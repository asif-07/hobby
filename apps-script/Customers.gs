/**
 * Customers.gs — CRUD for the Customers sheet.
 */

/** Strips internal fields and shapes a row for the API. */
function toCustomer(row) {
  return {
    customerId: str(row.CustomerID),
    name: str(row.Name),
    phone: str(row.Phone),
    whatsapp: str(row.WhatsApp),
    address: str(row.Address),
    notes: str(row.Notes),
    createdAt: str(row.CreatedAt),
    updatedAt: str(row.UpdatedAt)
  };
}

/** @return {Object[]} every customer, newest first. */
function getCustomers() {
  var rows = readTable(SHEET_CUSTOMERS).map(toCustomer);
  rows.sort(function (a, b) {
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });
  return rows;
}

/** Finds the raw sheet row for a customer id, or null. */
function findCustomerRow(customerId) {
  var id = str(customerId);
  var rows = readTable(SHEET_CUSTOMERS);
  for (var i = 0; i < rows.length; i++) {
    if (str(rows[i].CustomerID) === id) return rows[i];
  }
  return null;
}

function getCustomerById(customerId) {
  var row = findCustomerRow(customerId);
  return row ? toCustomer(row) : null;
}

/**
 * Validates the customer payload shared by create and update.
 * @return {string|null} an error message, or null when valid.
 */
function validateCustomer(payload) {
  if (!str(payload.name)) return 'Name is required.';
  var phone = normalizePhone(payload.phone);
  if (!phone) return 'Phone number is required.';
  if (phone.replace('+', '').length < 7) return 'Phone number looks too short.';
  return null;
}

/**
 * Rejects a second customer with the same phone number.
 * @param {string} phone
 * @param {string} [ignoreCustomerId] the customer being edited
 */
function phoneAlreadyUsed(phone, ignoreCustomerId) {
  var target = normalizePhone(phone);
  if (!target) return false;
  var rows = readTable(SHEET_CUSTOMERS);
  for (var i = 0; i < rows.length; i++) {
    if (ignoreCustomerId && str(rows[i].CustomerID) === str(ignoreCustomerId)) continue;
    if (normalizePhone(rows[i].Phone) === target) return true;
  }
  return false;
}

function createCustomer(payload) {
  var error = validateCustomer(payload);
  if (error) return fail(error, 'VALIDATION');
  if (phoneAlreadyUsed(payload.phone)) {
    return fail('A customer with this phone number already exists.', 'DUPLICATE_PHONE');
  }

  var now = nowIso();
  var record = {
    CustomerID: nextId(SHEET_CUSTOMERS, 'CUS', 'CustomerID'),
    Name: str(payload.name),
    Phone: str(payload.phone),
    WhatsApp: str(payload.whatsapp),
    Address: str(payload.address),
    Notes: str(payload.notes),
    CreatedAt: now,
    UpdatedAt: now
  };

  getSheet(SHEET_CUSTOMERS).appendRow(objectToRow(record, CUSTOMER_HEADERS));
  return ok(toCustomer(record));
}

function updateCustomer(payload) {
  var row = findCustomerRow(payload.customerId);
  if (!row) return fail('Customer not found.', 'NOT_FOUND');

  var error = validateCustomer(payload);
  if (error) return fail(error, 'VALIDATION');
  if (phoneAlreadyUsed(payload.phone, payload.customerId)) {
    return fail('Another customer already uses this phone number.', 'DUPLICATE_PHONE');
  }

  var record = {
    CustomerID: str(row.CustomerID),
    Name: str(payload.name),
    Phone: str(payload.phone),
    WhatsApp: str(payload.whatsapp),
    Address: str(payload.address),
    Notes: str(payload.notes),
    CreatedAt: str(row.CreatedAt) || nowIso(),
    UpdatedAt: nowIso()
  };

  getSheet(SHEET_CUSTOMERS)
    .getRange(row._row, 1, 1, CUSTOMER_HEADERS.length)
    .setValues([objectToRow(record, CUSTOMER_HEADERS)]);

  return ok(toCustomer(record));
}

/**
 * Deletes a customer. When the customer still has vehicles the delete is
 * refused unless `cascade` is true, so the UI can warn first.
 */
function deleteCustomer(payload) {
  var row = findCustomerRow(payload.customerId);
  if (!row) return fail('Customer not found.', 'NOT_FOUND');

  var vehicles = getVehiclesByCustomerId(payload.customerId);
  if (vehicles.length && payload.cascade !== true) {
    return jsonOutput({
      success: false,
      code: 'HAS_VEHICLES',
      error: 'This customer still has ' + vehicles.length +
        (vehicles.length === 1 ? ' vehicle.' : ' vehicles.'),
      data: { vehicleCount: vehicles.length }
    });
  }

  // Delete vehicles bottom-up so earlier deletions don't shift later rows.
  if (vehicles.length) {
    var vehicleSheet = getSheet(SHEET_VEHICLES);
    var rowNumbers = findVehicleRowNumbers(payload.customerId).sort(function (a, b) { return b - a; });
    rowNumbers.forEach(function (n) { vehicleSheet.deleteRow(n); });
  }

  getSheet(SHEET_CUSTOMERS).deleteRow(row._row);
  return ok({ customerId: str(row.CustomerID), deletedVehicles: vehicles.length });
}
