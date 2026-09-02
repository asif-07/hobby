# NewTown Garage

A small web app for a 4-wheeler garage to keep track of customers and their
vehicles. Records live in a Google Spreadsheet, so the garage owner can open
the sheet and see (or fix) everything without touching the app.

- **Frontend** — React 18 + TypeScript + Vite + Tailwind CSS
- **Backend** — Google Apps Script web app
- **Database** — Google Sheets (`Customers` and `Vehicles` tabs)

```
React app  ──HTTPS──▶  Apps Script web app  ──▶  Google Sheets
```

---

## Getting started

```bash
npm install
cp .env.example .env.local     # then paste your Apps Script URL into it
npm run dev
```

The app needs a deployed Apps Script backend before it can show anything.
**[GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md)** walks through creating the
spreadsheet, pasting in the script, seeding sample data and deploying — about
ten minutes. Until `VITE_APPS_SCRIPT_URL` is set, the app shows a setup notice
instead of the pages.

### Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server on <http://localhost:5173> |
| `npm run build` | Typecheck and build to `dist/` |
| `npm run preview` | Serve the built output |
| `npm run lint` | Typecheck only |

`VITE_APPS_SCRIPT_URL` is read at build time, so a production build bakes the
URL in. Rebuild after changing it.

---

## What it does

**Home** — one large search box that covers customers *and* vehicles: name,
phone number, WhatsApp number, registration number, make or model. Below it,
the ten most recently added customers.

**Customers** — the full list with a live filter and a vehicle count per
customer.

**Customer profile** — contact details, notes, and every vehicle on file, with
add / edit / delete for both the customer and their vehicles.

Registration numbers are normalized before they are stored or compared, so
`KL 10 AB 1234`, `KL10-AB-1234` and `kl10ab1234` are all the same vehicle. They
are displayed spaced out (`KL 10 AB 1234`) and stored packed (`KL10AB1234`).

---

## Rules the backend enforces

Validation runs on the server as well as in the form, so editing the sheet
through another client can't slip past it:

- A customer needs a name and a phone number, and the phone number must be
  unique.
- A vehicle needs a registration number, make, model and an existing owner.
- Registration numbers are unique across all customers.
- `Year` must be between 1900 and next year; `CurrentKM` cannot be negative.
- Deleting a customer who still has vehicles is refused unless the caller opts
  in. The app asks first, naming how many vehicles will go with them.
- IDs are allocated by scanning existing IDs, not by counting rows, so deleting
  a row never causes a collision. Writes hold a script lock, so two people
  saving at once can't be handed the same ID.

---

## Project layout

```
apps-script/          Paste these into the Apps Script editor
  Code.gs               doGet/doPost router, unified search, sample data
  Customers.gs          Customer CRUD
  Vehicles.gs           Vehicle CRUD
  Utils.gs              Sheet access, IDs, normalization, JSON responses

src/
  types/              Shared Customer / Vehicle / ApiResponse types
  services/           fetch wrapper + one module per entity
  hooks/              Data loading, kept in step with writes
  components/
    ui/                 Button, Input, Card, Modal, Badge, SearchBar, …
    layout/             AppLayout, Navbar
    customers/          CustomerList, CustomerCard, CustomerForm
    vehicles/           VehicleCard, VehicleForm
  pages/              HomePage, CustomersPage, CustomerProfilePage
  utils/              Registration/phone normalization and formatting
```

---

## API

Reads are `GET`, writes are `POST`, both against the same `/exec` URL with an
`action`.

| Action | Method | Purpose |
|---|---|---|
| `ping` | GET | Health check |
| `getCustomers` | GET | All customers, newest first |
| `getCustomerById` | GET | One customer |
| `getVehicles` | GET | All vehicles |
| `getVehicleById` | GET | One vehicle |
| `getVehiclesByCustomerId` | GET | One customer's vehicles |
| `search` | GET | Customers and vehicles matching `q` |
| `createCustomer` / `updateCustomer` / `deleteCustomer` | POST | Customer writes |
| `createVehicle` / `updateVehicle` / `deleteVehicle` | POST | Vehicle writes |

Every response uses the same envelope:

```jsonc
{ "success": true,  "data": … }
{ "success": false, "error": "A vehicle with this registration number already exists.",
  "code": "DUPLICATE_REGISTRATION" }
```

Codes the frontend acts on: `VALIDATION`, `NOT_FOUND`, `DUPLICATE_PHONE`,
`DUPLICATE_REGISTRATION`, `HAS_VEHICLES`, `LOCK_TIMEOUT`, `UNKNOWN_ACTION`,
`SERVER_ERROR`.

### Why writes send `Content-Type: text/plain`

Apps Script cannot answer a CORS preflight (`OPTIONS`) request. A `POST` with
`Content-Type: application/json` triggers one and fails. Sending the same JSON
body as `text/plain;charset=utf-8` keeps the request "simple" under CORS, so the
browser skips the preflight. The script parses the body as JSON regardless. This
is why `src/services/api.ts` sets that header deliberately — it is not a
mistake, and changing it to `application/json` will break every write.

---

## Trade-offs worth knowing

**Google Sheets is not a database.** There are no transactions beyond the script
lock, uniqueness is enforced by scanning rows, and every request re-reads the
whole sheet. For a few hundred customers that is fine and the sheet stays
directly editable, which is the point. At a few thousand rows the reads get
slow, and that is the moment to move to a real database.

**Apps Script cold starts** take 3–5 seconds on the first request after a quiet
period. Every screen shows a spinner rather than pretending to be instant.

**The endpoint is unauthenticated.** Deploying with access set to "Anyone" is
what makes browser requests work; it also means anyone with the URL can read and
write the data. See the security note in
[GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md#what-anyone-means-here).

**Deleting a customer deletes their vehicles.** There is no soft delete and no
undo. The confirmation names the count before it happens.
