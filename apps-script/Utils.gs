/**
 * Utils.gs — shared helpers: sheet access, ID generation, normalization,
 * row <-> object mapping and JSON responses.
 */

var SHEET_CUSTOMERS = 'Customers';
var SHEET_VEHICLES = 'Vehicles';

var CUSTOMER_HEADERS = [
  'CustomerID', 'Name', 'Phone', 'WhatsApp', 'Address', 'Notes', 'CreatedAt', 'UpdatedAt'
];

var VEHICLE_HEADERS = [
  'VehicleID', 'CustomerID', 'RegistrationNumber', 'Make', 'Model', 'Year',
  'FuelType', 'CurrentKM', 'Notes', 'CreatedAt', 'UpdatedAt'
];

/** Columns that must never be coerced into numbers/dates by Sheets. */
var TEXT_COLUMNS = {
  Customers: ['CustomerID', 'Phone', 'WhatsApp'],
  Vehicles: ['VehicleID', 'CustomerID', 'RegistrationNumber']
};

/* ------------------------------------------------------------------ */
/* Sheet access                                                        */
/* ------------------------------------------------------------------ */

/**
 * Returns the sheet, creating it with a frozen header row if missing.
 * @param {string} name
 * @return {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (sheet) return sheet;

  var headers = name === SHEET_CUSTOMERS ? CUSTOMER_HEADERS : VEHICLE_HEADERS;
  sheet = ss.insertSheet(name);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  sheet.setFrozenRows(1);

  // Keep IDs, phone numbers and registrations as plain text.
  (TEXT_COLUMNS[name] || []).forEach(function (col) {
    var idx = headers.indexOf(col);
    if (idx >= 0) sheet.getRange(2, idx + 1, sheet.getMaxRows() - 1, 1).setNumberFormat('@');
  });

  return sheet;
}

/**
 * Reads every data row of a sheet as an array of plain objects.
 * Row numbers are attached as `_row` so writes can target them directly.
 * @param {string} name
 * @return {Object[]}
 */
function readTable(name) {
  var sheet = getSheet(name);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];

  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0].map(function (h) { return String(h).trim(); });

  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var raw = values[r];
    // Skip fully blank rows left behind by manual deletions.
    var isBlank = raw.every(function (cell) { return cell === '' || cell === null; });
    if (isBlank) continue;

    var obj = { _row: r + 1 };
    for (var c = 0; c < headers.length; c++) {
      if (!headers[c]) continue;
      obj[headers[c]] = cellToValue(raw[c]);
    }
    rows.push(obj);
  }
  return rows;
}

/** Normalizes a cell value for JSON output. */
function cellToValue(value) {
  if (value instanceof Date) return value.toISOString();
  if (value === null || value === undefined) return '';
  return value;
}

/**
 * Turns an object into a row array ordered to match the sheet headers.
 * @param {Object} obj
 * @param {string[]} headers
 * @return {Array}
 */
function objectToRow(obj, headers) {
  return headers.map(function (h) {
    var v = obj[h];
    return v === undefined || v === null ? '' : v;
  });
}

/* ------------------------------------------------------------------ */
/* IDs                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Generates the next sequential ID for a sheet, e.g. CUS-000007.
 * Scans existing IDs rather than using the row count so that deleted rows
 * never cause a collision.
 * @param {string} sheetName
 * @param {string} prefix e.g. 'CUS'
 * @param {string} idColumn e.g. 'CustomerID'
 * @return {string}
 */
function nextId(sheetName, prefix, idColumn) {
  var rows = readTable(sheetName);
  var max = 0;
  var pattern = new RegExp('^' + prefix + '-(\\d+)$');
  rows.forEach(function (row) {
    var match = pattern.exec(String(row[idColumn] || '').trim());
    if (match) {
      var n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  });
  return prefix + '-' + padLeft(String(max + 1), 6);
}

function padLeft(str, length) {
  while (str.length < length) str = '0' + str;
  return str;
}

/* ------------------------------------------------------------------ */
/* Normalization                                                       */
/* ------------------------------------------------------------------ */

/**
 * Strips spaces/hyphens and uppercases a registration number so that
 * "KL 10 AB 1234", "KL10-AB-1234" and "kl10ab1234" all compare equal.
 * @param {*} value
 * @return {string}
 */
function normalizeRegistration(value) {
  return String(value == null ? '' : value)
    .replace(/[\s\-_.]/g, '')
    .toUpperCase();
}

/** Keeps digits and a leading +, so phone numbers compare reliably. */
function normalizePhone(value) {
  var str = String(value == null ? '' : value).trim();
  var plus = str.charAt(0) === '+' ? '+' : '';
  return plus + str.replace(/\D/g, '');
}

/** Trims a value to a string, treating null/undefined as ''. */
function str(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

/** Parses a value to a number, returning '' when it isn't one. */
function num(value) {
  if (value === null || value === undefined || String(value).trim() === '') return '';
  var n = Number(value);
  return isNaN(n) ? '' : n;
}

function nowIso() {
  return new Date().toISOString();
}

/* ------------------------------------------------------------------ */
/* Responses                                                           */
/* ------------------------------------------------------------------ */

function jsonOutput(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function ok(data) {
  return jsonOutput({ success: true, data: data });
}

function fail(message, code) {
  return jsonOutput({ success: false, error: message, code: code || 'ERROR' });
}

/**
 * Runs a write inside a script lock so two concurrent requests can't
 * generate the same ID or double-insert a registration number.
 * @param {Function} fn
 */
function withLock(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) {
    return fail('The sheet is busy, please try again.', 'LOCK_TIMEOUT');
  }
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}
