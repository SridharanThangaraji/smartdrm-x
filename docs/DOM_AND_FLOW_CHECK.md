# DOM and flow check – end-to-end verification

Use this to verify every page has the right DOM nodes and that the flow works.

## 1. DOM checklist (required elements per page)

| Page | Required IDs / elements | Used by |
|------|------------------------|--------|
| **login.html** | `#login-form`, `#username`, `#password`, `#demo-btn` | auth.js |
| **register.html** | `#register-form`, `#reg-username`, `#reg-password`, `#reg-role` | auth.js |
| **dashboard.html** | `#sidebar-container`, `#topbar-container`, `#stat-assets`, `#stat-licenses`, `#stat-risk` | components.js, dashboard.js |
| **upload.html** | `#sidebar-container`, `#topbar-container`, `#upload-form`, `#file-input`, `#drop-area`, `#file-label` | components.js, upload.js |
| **assets.html** | `#sidebar-container`, `#topbar-container`, `#assets-body`, `#shared-body` | components.js, assets.js |
| **request.html** | `#sidebar-container`, `#topbar-container`, `#incoming-body`, `#catalog-body`, `#mine-body` | components.js, request.js |
| **ai.html** | `#sidebar-container`, `#topbar-container`, `#risk-score-display`, `#risk-reasons`, `#logs-body`, `#activity-chart` | components.js, ai.js |

**App layout pages** (dashboard, upload, assets, request, ai) must have:
- `#sidebar-container` (components.js injects sidebar with `#logout-btn`, `.nav-item[data-page="..."]`)
- `#topbar-container` (components.js injects topbar)

**Nav `data-page` values:** `dashboard`, `assets`, `upload`, `request`, `ai` — must match URL (e.g. `request.html` → `data-page="request"`).

---

## 2. Correct flow (manual browser check)

1. **Start app:** `python run.py` (backend 8000, frontend 5173).
2. **Open:** http://127.0.0.1:5173 → redirects to login.
3. **Login:** Use "Use demo (admin / admin)" or type admin / admin → Submit → should land on **Dashboard**.
4. **Dashboard:** Check `#stat-assets`, `#stat-licenses`, `#stat-risk` show numbers or "—". Click "Upload asset" → **Upload** page.
5. **Upload:** Choose file → label updates → Submit → success → redirect to **Assets**.
6. **Assets:** "My Uploaded Assets" table has rows; "Grant license" works. "Shared With Me" table loads (empty or rows). "Download" works for shared rows.
7. **Request Access:** Sidebar → "Request access". Incoming table (your content), Catalog table (requestable), My requests table — all load without errors. Request access from catalog; as owner, approve/deny from Incoming.
8. **AI Analytics:** Sidebar → "AI Analytics". Risk score/level and reasons; chart; audit table — all render.
9. **Logout:** Sidebar → "Terminate Session" → back to login.
10. **Register:** From login, "Register" → fill form → Create account → redirect to login. Log in with new user → Dashboard.

---

## 3. Quick console check

In browser DevTools (F12) → Console:

- No red errors on any page.
- After login, `localStorage.getItem('token')` and `localStorage.getItem('user')` are set.
- On protected pages, 401 from API should redirect to login and clear storage.

---

## 4. Run automated browser test (optional)

If you have Node.js and install Playwright, you can run a headless browser test.

**Terminal 1 – start the app (only if not already running):**
```bash
cd /home/rogue/workspace/SmartDRM-X
python run.py
```
If you see **"Address already in use"**, ports 8000 or 5173 are in use. Either stop the existing process (Ctrl+C where `run.py` is running, or `pkill -f run.py`) and start again, or skip starting and run the tests against the already-running app.

**Terminal 2 – run tests (run these commands one at a time; omit the `#` comment lines):**
```bash
cd /home/rogue/workspace/SmartDRM-X
npm install
npx playwright install chromium
npm run test:browser
```

This runs `tests/browser/flow.spec.js` (login → dashboard DOM → nav to assets/upload/request/ai → logout).
