/**
 * Code.gs — HTTP entry points and the action router.
 *
 * Deploy: Extensions > Apps Script > Deploy > New deployment >
 *   Type "Web app", Execute as "Me", Who has access "Anyone".
 * See GOOGLE_SHEETS_SETUP.md for the full walkthrough.
 *
 * CORS note: Apps Script cannot answer a CORS preflight (OPTIONS) request,
 * so the browser client must POST with Content-Type "text/plain;charset=utf-8"
 * — that keeps the request "simple" and skips the preflight entirely. The
 * body is still JSON and is parsed as JSON below.
 */

/** Reads. */
function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var action = str(params.action);

    switch (action) {
      case '':
      case 'ping':
        return ok({ status: 'ok', time: nowIso() });

      case 'getCustomers':
        return ok(getCustomers());

      case 'getCustomerById':
        var customer = getCustomerById(params.customerId);
        return customer ? ok(customer) : fail('Customer not found.', 'NOT_FOUND');

      case 'getVehicles':
        return ok(getVehicles());

      case 'getVehicleById':
        var vehicle = getVehicleById(params.vehicleId);
        return vehicle ? ok(vehicle) : fail('Vehicle not found.', 'NOT_FOUND');

      case 'getVehiclesByCustomerId':
        if (!str(params.customerId)) return fail('customerId is required.', 'VALIDATION');
        return ok(getVehiclesByCustomerId(params.customerId));

      case 'search':
        return ok(search(params.q));

      default:
        return fail('Unknown action: ' + action, 'UNKNOWN_ACTION');
    }
  } catch (err) {
    return fail(errorMessage(err), 'SERVER_ERROR');
  }
}

/** Writes. */
function doPost(e) {
  try {
    var body = parseBody(e);
    var params = (e && e.parameter) || {};
    var action = str(body.action) || str(params.action);
    var payload = body.payload || body.data || body;

    switch (action) {
      case 'createCustomer':
        return withLock(function () { return createCustomer(payload); });
      case 'updateCustomer':
        return withLock(function () { return updateCustomer(payload); });
      case 'deleteCustomer':
        return withLock(function () { return deleteCustomer(payload); });

      case 'createVehicle':
        return withLock(function () { return createVehicle(payload); });
      case 'updateVehicle':
        return withLock(function () { return updateVehicle(payload); });
      case 'deleteVehicle':
        return withLock(function () { return deleteVehicle(payload); });

      default:
        return fail('Unknown action: ' + action, 'UNKNOWN_ACTION');
    }
  } catch (err) {
    return fail(errorMessage(err), 'SERVER_ERROR');
  }
}

/** Parses the POST body, whether it arrived as JSON text or form-encoded. */
function parseBody(e) {
  if (!e) return {};
  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents) || {};
    } catch (err) {
      // Fall through to form parameters below.
    }
  }
  if (e.parameter && e.parameter.payload) {
    try {
      return { action: e.parameter.action, payload: JSON.parse(e.parameter.payload) };
    } catch (err) {
      return {};
    }
  }
  return e.parameter || {};
}

function errorMessage(err) {
  if (!err) return 'Unknown error.';
  return err.message ? String(err.message) : String(err);
}

/* ------------------------------------------------------------------ */
/* Unified search                                                      */
/* ------------------------------------------------------------------ */

/**
 * Searches customers (name / phone / whatsapp) and vehicles
 * (registration / make / model) in one pass.
 *
 * A registration-style query is matched against the normalized
 * registration, so "kl 10 ab 1234" finds "KL10AB1234".
 *
 * @param {string} query
 * @return {{query: string, customers: Object[], vehicles: Object[]}}
 */
function search(query) {
  var q = str(query).toLowerCase();
  if (!q) return { query: '', customers: [], vehicles: [] };

  var qDigits = q.replace(/\D/g, '');
  var qReg = normalizeRegistration(q);

  var customers = getCustomers();
  var byId = {};
  customers.forEach(function (c) { byId[c.customerId] = c; });

  var matchedCustomers = customers.filter(function (c) {
    if (c.name.toLowerCase().indexOf(q) !== -1) return true;
    if (qDigits && normalizePhone(c.phone).indexOf(qDigits) !== -1) return true;
    if (qDigits && c.whatsapp && normalizePhone(c.whatsapp).indexOf(qDigits) !== -1) return true;
    return false;
  });

  var matchedVehicles = getVehicles().filter(function (v) {
    if (qReg && normalizeRegistration(v.registrationNumber).indexOf(qReg) !== -1) return true;
    if (v.make.toLowerCase().indexOf(q) !== -1) return true;
    if (v.model.toLowerCase().indexOf(q) !== -1) return true;
    return false;
  }).map(function (v) {
    var owner = byId[v.customerId];
    v.customerName = owner ? owner.name : '';
    v.customerPhone = owner ? owner.phone : '';
    return v;
  });

  return { query: str(query), customers: matchedCustomers, vehicles: matchedVehicles };
}

/* ------------------------------------------------------------------ */
/* Sample data                                                         */
/* ------------------------------------------------------------------ */

/**
 * Seeds 10 customers and 15 vehicles. Run once from the Apps Script editor
 * (select seedSampleData and press Run). Does nothing if data already exists,
 * so it is safe to re-run by accident.
 */
function seedSampleData() {
  if (readTable(SHEET_CUSTOMERS).length > 0) {
    Logger.log('Customers sheet is not empty — skipping seed.');
    return;
  }

  var customers = [
    ['Anil Kumar', '9847012345', '9847012345', 'Kaloor, Kochi', 'Prefers Saturday morning slots'],
    ['Fathima Beevi', '9895023456', '', 'Edappally, Kochi', ''],
    ['Joseph Mathew', '9846034567', '9846034567', 'Aluva, Ernakulam', 'Fleet owner — two cars'],
    ['Lakshmi Nair', '9744045678', '', 'Thrippunithura, Kochi', ''],
    ['Rahul Menon', '9633056789', '9633056789', 'Palarivattom, Kochi', 'Always asks for a wash'],
    ['Sneha Thomas', '9061067890', '', 'Kakkanad, Ernakulam', ''],
    ['Vinod Pillai', '9526078901', '9526078901', 'Vyttila, Kochi', 'Pays by UPI'],
    ['Ayesha Rahman', '9995089012', '', 'Fort Kochi', 'Call before 6 PM only'],
    ['Manoj Varghese', '9447090123', '9447090123', 'Perumbavoor, Ernakulam', ''],
    ['Divya Krishnan', '9539001234', '', 'Angamaly, Ernakulam', 'New customer — referral']
  ];

  var vehicles = [
    [1, 'KL07AB1234', 'Maruti Suzuki', 'Swift', 2019, 'Petrol', 58200, ''],
    [1, 'KL07CD5678', 'Hyundai', 'Creta', 2022, 'Diesel', 31400, 'Second car'],
    [2, 'KL41EF2345', 'Honda', 'City', 2018, 'Petrol', 82500, ''],
    [3, 'KL39GH3456', 'Toyota', 'Innova Crysta', 2020, 'Diesel', 141000, 'Runs as a taxi'],
    [3, 'KL39IJ7890', 'Mahindra', 'Bolero', 2017, 'Diesel', 176300, ''],
    [4, 'KL17KL4567', 'Tata', 'Nexon EV', 2023, 'Electric', 18900, 'Charging port checked in Jan'],
    [5, 'KL07MN8901', 'Volkswagen', 'Polo', 2016, 'Petrol', 96700, ''],
    [6, 'KL40OP5678', 'Kia', 'Seltos', 2021, 'Petrol', 42800, ''],
    [7, 'KL07QR9012', 'Maruti Suzuki', 'Wagon R', 2015, 'CNG', 118400, 'CNG kit fitted 2019'],
    [7, 'KL07ST3456', 'Renault', 'Kwid', 2019, 'Petrol', 61200, ''],
    [8, 'KL07UV6789', 'Ford', 'EcoSport', 2017, 'Diesel', 103500, ''],
    [9, 'KL42WX1234', 'Maruti Suzuki', 'Ertiga', 2021, 'Petrol', 47600, 'Family car'],
    [9, 'KL42YZ5678', 'Ashok Leyland', 'Dost', 2018, 'Diesel', 152900, 'Goods carrier'],
    [10, 'KL63AA7890', 'Hyundai', 'i20', 2022, 'Petrol', 22300, ''],
    [10, 'KL63BB2345', 'MG', 'Hector', 2023, 'Diesel', 15800, 'Under warranty']
  ];

  var customerSheet = getSheet(SHEET_CUSTOMERS);
  var vehicleSheet = getSheet(SHEET_VEHICLES);
  var now = nowIso();
  var customerIds = [];

  var customerRows = customers.map(function (c, i) {
    var id = 'CUS-' + padLeft(String(i + 1), 6);
    customerIds.push(id);
    return objectToRow({
      CustomerID: id, Name: c[0], Phone: c[1], WhatsApp: c[2],
      Address: c[3], Notes: c[4], CreatedAt: now, UpdatedAt: now
    }, CUSTOMER_HEADERS);
  });

  var vehicleRows = vehicles.map(function (v, i) {
    return objectToRow({
      VehicleID: 'VEH-' + padLeft(String(i + 1), 6),
      CustomerID: customerIds[v[0] - 1],
      RegistrationNumber: normalizeRegistration(v[1]),
      Make: v[2], Model: v[3], Year: v[4], FuelType: v[5],
      CurrentKM: v[6], Notes: v[7], CreatedAt: now, UpdatedAt: now
    }, VEHICLE_HEADERS);
  });

  customerSheet.getRange(2, 1, customerRows.length, CUSTOMER_HEADERS.length).setValues(customerRows);
  vehicleSheet.getRange(2, 1, vehicleRows.length, VEHICLE_HEADERS.length).setValues(vehicleRows);

  Logger.log('Seeded %s customers and %s vehicles.', customerRows.length, vehicleRows.length);
}
