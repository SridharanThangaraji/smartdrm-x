# Manual Testing Checklist

## 1. Authentication
- [ ] Register a new user (Creator).
- [ ] Login with correct credentials (should redirect to Dashboard).
- [ ] specific error message on wrong password.

## 2. Asset Management
- [ ] Upload a text file.
- [ ] Verify success message with Asset Hash.
- [ ] Check `backend/app/asset/storage` to see if `.enc` file exists (encrypted).
- [ ] Verify asset appears in "My Uploads".

## 3. Licensing
- [ ] Create a second user (Consumer).
- [ ] As Creator, Grant License to "Consumer".
- [ ] As Consumer, Login and check "Shared With Me".
- [ ] Click "Download". Verify file content matches original (Decryption works).

## 4. Institutional Licensing
- [ ] Create a Group "University".
- [ ] Add "Consumer" to "University".
- [ ] As Creator, issue license to Group ID (via API payload or simple UI if available).
- [ ] As Consumer, verify access to the asset via Group license.

## 5. AI & Security
- [ ] As Consumer, download the same file 50+ times (script or manual).
- [ ] Check "AI Analytics" page. Risk Level should be "MEDIUM" or "HIGH".
- [ ] Check "Audit Logs" to see "ASSET_ACCESSED" events.
