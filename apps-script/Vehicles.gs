/**
 * Vehicles.gs — CRUD for the Vehicles sheet.
 */

var FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];

/** Strips internal fields and shapes a row for the API. */
function toVehicle(row) {
  return {
    vehicleId: str(row.VehicleID),
    customerId: str(row.CustomerID),
    registrationNumber: str(row.RegistrationNumber),
    make: str(row.Make),
    model: str(row.Model),
    year: row.Year === '' || row.Year === undefined ? null : Number(row.Year),
    fuelType: str(row.FuelType),
    currentKm: row.CurrentKM === '' || row.CurrentKM === undefined ? null : Number(row.CurrentKM),
    notes: str(row.Notes),
    createdAt: str(row.CreatedAt),
    updatedAt: str(row.UpdatedAt)
  };
}

function getVehicles() {
  return readTable(SHEET_VEHICLES).map(toVehicle);
}

function findVehicleRow(vehicleId) {
  var id = str(vehicleId);
  var rows = readTable(SHEET_VEHICLES);
  for (var i = 0; i < rows.length; i++) {
    if (str(rows[i].VehicleID) === id) return rows[i];
  }
  return null;
}

function getVehicleById(vehicleId) {
  var row = findVehicleRow(vehicleId);
  return row ? toVehicle(row) : null;
}

function getVehiclesByCustomerId(customerId) {
  var id = str(customerId);
  return readTable(SHEET_VEHICLES)
    .filter(function (row) { return str(row.CustomerID) === id; })
    .map(toVehicle);
}

/** Sheet row numbers of every vehicle belonging to a customer. */
function findVehicleRowNumbers(customerId) {
  var id = str(customerId);
  return readTable(SHEET_VEHICLES)
    .filter(function (row) { return str(row.CustomerID) === id; })
    .map(function (row) { return row._row; });
}

/**
 * @return {string|null} an error message, or null when valid.
 */
function validateVehicle(payload) {
  if (!str(payload.customerId)) return 'A customer must be selected.';
  if (!normalizeRegistration(payload.registrationNumber)) return 'Registration number is required.';
  if (!str(payload.make)) return 'Make is required.';
  if (!str(payload.model)) return 'Model is required.';

  var year = num(payload.year);
  if (year !== '') {
    var maxYear = new Date().getFullYear() + 1;
    if (year < 1900 || year > maxYear) return 'Year must be between 1900 and ' + maxYear + '.';
  }

  var km = num(payload.currentKm);
  if (km !== '' && km < 0) return 'Odometer reading cannot be negative.';

  var fuel = str(payload.fuelType);
  if (fuel && FUEL_TYPES.indexOf(fuel) === -1) {
    return 'Fuel type must be one of: ' + FUEL_TYPES.join(', ') + '.';
  }
  return null;
}

/**
 * @param {string} registration
 * @param {string} [ignoreVehicleId] the vehicle being edited
 */
function registrationAlreadyUsed(registration, ignoreVehicleId) {
  var target = normalizeRegistration(registration);
  if (!target) return false;
  var rows = readTable(SHEET_VEHICLES);
  for (var i = 0; i < rows.length; i++) {
    if (ignoreVehicleId && str(rows[i].VehicleID) === str(ignoreVehicleId)) continue;
    if (normalizeRegistration(rows[i].RegistrationNumber) === target) return true;
  }
  return false;
}

function createVehicle(payload) {
  var error = validateVehicle(payload);
  if (error) return fail(error, 'VALIDATION');

  if (!findCustomerRow(payload.customerId)) {
    return fail('Customer not found.', 'NOT_FOUND');
  }
  if (registrationAlreadyUsed(payload.registrationNumber)) {
    return fail('A vehicle with this registration number already exists.', 'DUPLICATE_REGISTRATION');
  }

  var now = nowIso();
  var record = {
    VehicleID: nextId(SHEET_VEHICLES, 'VEH', 'VehicleID'),
    CustomerID: str(payload.customerId),
    RegistrationNumber: normalizeRegistration(payload.registrationNumber),
    Make: str(payload.make),
    Model: str(payload.model),
    Year: num(payload.year),
    FuelType: str(payload.fuelType),
    CurrentKM: num(payload.currentKm),
    Notes: str(payload.notes),
    CreatedAt: now,
    UpdatedAt: now
  };

  getSheet(SHEET_VEHICLES).appendRow(objectToRow(record, VEHICLE_HEADERS));
  return ok(toVehicle(record));
}

function updateVehicle(payload) {
  var row = findVehicleRow(payload.vehicleId);
  if (!row) return fail('Vehicle not found.', 'NOT_FOUND');

  // Keep the existing owner unless the caller explicitly moves the vehicle.
  var customerId = str(payload.customerId) || str(row.CustomerID);
  var merged = {
    customerId: customerId,
    registrationNumber: payload.registrationNumber,
    make: payload.make,
    model: payload.model,
    year: payload.year,
    fuelType: payload.fuelType,
    currentKm: payload.currentKm
  };

  var error = validateVehicle(merged);
  if (error) return fail(error, 'VALIDATION');
  if (!findCustomerRow(customerId)) return fail('Customer not found.', 'NOT_FOUND');
  if (registrationAlreadyUsed(payload.registrationNumber, payload.vehicleId)) {
    return fail('Another vehicle already uses this registration number.', 'DUPLICATE_REGISTRATION');
  }

  var record = {
    VehicleID: str(row.VehicleID),
    CustomerID: customerId,
    RegistrationNumber: normalizeRegistration(payload.registrationNumber),
    Make: str(payload.make),
    Model: str(payload.model),
    Year: num(payload.year),
    FuelType: str(payload.fuelType),
    CurrentKM: num(payload.currentKm),
    Notes: str(payload.notes),
    CreatedAt: str(row.CreatedAt) || nowIso(),
    UpdatedAt: nowIso()
  };

  getSheet(SHEET_VEHICLES)
    .getRange(row._row, 1, 1, VEHICLE_HEADERS.length)
    .setValues([objectToRow(record, VEHICLE_HEADERS)]);

  return ok(toVehicle(record));
}

function deleteVehicle(payload) {
  var row = findVehicleRow(payload.vehicleId);
  if (!row) return fail('Vehicle not found.', 'NOT_FOUND');
  getSheet(SHEET_VEHICLES).deleteRow(row._row);
  return ok({ vehicleId: str(row.VehicleID) });
}
