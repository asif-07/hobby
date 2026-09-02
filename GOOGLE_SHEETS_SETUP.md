# Google Sheets setup

The app stores everything in one Google Spreadsheet and talks to it through a
Google Apps Script web app. This takes about ten minutes, once.

---

## 1. Create the spreadsheet

1. Go to <https://sheets.new> and create a blank spreadsheet.
2. Rename it something like **NewTown Garage Data**.

You do **not** need to create the `Customers` and `Vehicles` tabs by hand — the
script creates them, with headers, the first time it runs.

---

## 2. Add the script

1. In the spreadsheet, choose **Extensions → Apps Script**. A script project
   opens, bound to this spreadsheet.
2. Delete the contents of the default `Code.gs`.
3. Create four script files and paste in the matching file from this repo's
   `apps-script/` folder. Use the **+** next to *Files* to add each one:

   | Apps Script file | Paste from |
   |---|---|
   | `Code.gs` | `apps-script/Code.gs` |
   | `Utils.gs` | `apps-script/Utils.gs` |
   | `Customers.gs` | `apps-script/Customers.gs` |
   | `Vehicles.gs` | `apps-script/Vehicles.gs` |

   The `.gs` extension is added automatically; name the files without it.
   Order does not matter — Apps Script loads all files into one shared scope.

4. Press **Save** (the disk icon).

---

## 3. Load the sample data (optional)

1. In the toolbar's function dropdown, pick **`seedSampleData`**.
2. Press **Run**.
3. Google asks for authorization the first time: **Review permissions** →
   choose your account → **Advanced** → **Go to (project name)** → **Allow**.
   The "unverified app" warning is expected for a private script you wrote
   yourself.
4. Switch back to the spreadsheet. You should see a `Customers` tab with 10 rows
   and a `Vehicles` tab with 15.

`seedSampleData` refuses to run twice — if the `Customers` sheet already has any
rows it does nothing, so an accidental second run cannot duplicate your data.

To start empty instead, skip this step; the sheets are created on the first
request from the app.

---

## 4. Deploy as a web app

1. In the Apps Script editor: **Deploy → New deployment**.
2. Click the gear next to *Select type* and choose **Web app**.
3. Fill in:
   - **Description**: anything, e.g. `v1`
   - **Execute as**: **Me**
   - **Who has access**: **Anyone**
4. Click **Deploy**, authorize if prompted, and copy the **Web app URL**.

It ends in `/exec` and looks like:

```
https://script.google.com/macros/s/AKfycb.../exec
```

> **Use the `/exec` URL, not the `/dev` one.** The `/dev` URL only works while
> you are signed in as the script's owner, so the app will fail for everyone
> else — including you in a private browsing window.

### What "Anyone" means here

"Anyone" makes the *endpoint* reachable without a Google sign-in. It does not
share your spreadsheet — the script runs as you, and callers only ever see what
the script chooses to return. But it does mean anyone who learns the URL can
read and write your customer records. This is the standard trade-off for an
Apps Script backend with a browser front end, and it is a real one: treat the
URL as a password, and don't put it in a public repository.

If you need stronger protection, add a shared secret: have the client send a
token with every request and have `doGet`/`doPost` reject requests without it.
That is not implemented here.

---

## 5. Point the app at your deployment

In the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set your URL:

```
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycb.../exec
```

Then restart the dev server — Vite only reads `.env` files at startup.

`.env.local` is gitignored, so the URL stays out of version control.

---

## 6. Check it works

Open the web app URL directly in a browser tab. You should see:

```json
{"success":true,"data":{"status":"ok","time":"..."}}
```

If you get that, start the app with `npm run dev`. The home page should list
your customers.

---

## Redeploying after a script change

Editing the script does **not** update the live web app. After any change:

**Deploy → Manage deployments →** pencil icon **→ Version: New version → Deploy**

Do this rather than creating a *new* deployment — a new deployment gets a new
URL, and you would have to update `.env.local` every time.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| App says the server didn't return JSON | The deployment's access is not set to **Anyone**, or you used the `/dev` URL. Redeploy with the right settings. |
| Browser console shows a CORS error | Same cause as above. Apps Script sends permissive CORS headers only on a correctly deployed "Anyone" web app. |
| First request takes 3–5 seconds | Normal. Apps Script cold-starts. The app shows a spinner. |
| Changes to the script have no effect | You created a new version but didn't deploy it. See *Redeploying* above. |
| `Cannot read properties of null` in the script log | The script isn't bound to a spreadsheet. Open the script through **Extensions → Apps Script** from inside the sheet, not from script.google.com directly. |
| Phone numbers lose their leading zero | The script formats the ID, phone and registration columns as plain text when it creates the sheets. If you created the tabs by hand first, format those columns as **Plain text** (Format → Number → Plain text). |
| "The sheet is busy, please try again" | Two writes collided and one waited 20s for the lock. Retry; if it persists, something is holding the script lock — check **Executions** in the Apps Script editor. |

---

## The data model

### `Customers`

| Column | Notes |
|---|---|
| `CustomerID` | `CUS-000001`, assigned by the script |
| `Name` | required |
| `Phone` | required, must be unique |
| `WhatsApp` | optional |
| `Address` | optional |
| `Notes` | optional |
| `CreatedAt` / `UpdatedAt` | ISO 8601, set by the script |

### `Vehicles`

| Column | Notes |
|---|---|
| `VehicleID` | `VEH-000001`, assigned by the script |
| `CustomerID` | owner, must exist in `Customers` |
| `RegistrationNumber` | stored normalized and unique |
| `Make` / `Model` | required |
| `Year` | optional, 1900 – next year |
| `FuelType` | optional: Petrol, Diesel, CNG, Electric, Hybrid |
| `CurrentKM` | optional, ≥ 0 |
| `Notes` | optional |
| `CreatedAt` / `UpdatedAt` | ISO 8601, set by the script |

You can edit cells directly in the sheet, and the app will pick the changes up
on its next load. Two things to avoid: don't change the header row, and don't
reuse an ID from a row you deleted.
