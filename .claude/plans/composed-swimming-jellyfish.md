# Profile Picture feature — implementation plan

## Context

Roomify currently shows every user as a blue circle with the first letter of their name. Across 4 roles (admin, approver, requester, maintenance) the same pattern repeats in the navbar, dashboards, user lists, and audit log rows. The User model has no avatar field, no upload infrastructure exists, and no Profile page is present. The user wants every user to be able to upload, change, and remove a profile picture that appears everywhere their avatar is rendered today, with image cropping, validation, and storage handled cleanly.

This is a 1-day feature touching the User model, one new controller, three new endpoints, frontend cropping + upload UX, and updating ~10 avatar renderings across the app.

## Approach

**Server-side:** Add a `profilePicture` field on `User` (string URL or null). Accept image uploads via `multer` to `backend/uploads/avatars/` keyed by `<userId>.<ext>`. Serve them via `app.use('/uploads', express.static(...))`. Reject anything >5 MB or outside the allowed MIME types with a clean 4xx. Add 3 endpoints: upload, remove, and a small "me" refresh.

**Client-side:** Add `react-easy-crop` for a small drag-to-crop UI. Crop to a 1:1 square, resize to 256×256, export as a JPEG Blob, POST to the backend. Reusable `<Avatar>` component reads `profilePicture` from the user object, falls back to the initials circle everywhere the existing `charAt(0)` pattern lives.

**Authorization:** A user can change their own avatar. Admins can change anyone's avatar (per requirement). The endpoint validates `req.user.id === :id || req.user.role === 'admin'`.

**Persistence caveat (decided with user):** Local disk only. Railway's container filesystem wipes on redeploy; on next login the avatar just reverts to initials (graceful fallback), no broken `<img>` tags. The endpoint serves a 404 if the file is missing on disk, and the `<Avatar>` component treats that the same as "no picture".

## Critical files modified or created

### New files
- `backend/middleware/upload.js` — multer config (storage, fileFilter, 5 MB limit)
- `backend/controllers/profileController.js` — upload + remove handlers
- `frontend/src/components/common/Avatar.jsx` — unified avatar (image or initials)
- `frontend/src/components/common/ImageCropper.jsx` — wraps react-easy-crop with zoom slider, returns a square Blob
- `frontend/src/pages/common/Profile.jsx` — the new Profile page
- `frontend/src/pages/common/AdminEditAvatarModal.jsx` — admin override modal

### Modified files
- `backend/models/User.js` — add `profilePicture` field (string, default null)
- `backend/routes/userRoutes.js` — add `POST /:id/avatar`, `DELETE /:id/avatar`
- `backend/app.js` — mount `app.use('/uploads', express.static('uploads'))`; ensure `uploads/` dir exists at boot
- `backend/server.js` — `mkdir -p uploads/avatars` on startup
- `backend/controllers/authController.js` — return `profilePicture` in login/register responses so navbar shows it after login
- `backend/.gitignore` — ignore `uploads/`
- `frontend/package.json` — add `react-easy-crop` (~5 KB)
- `frontend/src/services/api.js` — `userAPI.uploadAvatar(id, FormData)`, `userAPI.removeAvatar(id)`
- `frontend/src/components/layout/Navbar.jsx` — swap inline avatar for `<Avatar>`; wrap with Link to `/profile`
- `frontend/src/components/layout/Sidebar.jsx` — add "Profile" link under each role's nav; add new `Avatar` import
- `frontend/src/App.jsx` — add `/profile` route (all roles)
- Avatar-rendering sites — replace inline `name?.charAt(0)` circles with `<Avatar user={x} />`:
  - `frontend/src/pages/admin/AdminDashboard.jsx:121`
  - `frontend/src/pages/approver/ApproverDashboard.jsx:110`
  - `frontend/src/pages/approver/FeedbackList.jsx:142`
  - `frontend/src/pages/admin/ManageUsers.jsx` (table + cards; also add "Edit avatar" button for admin rows)
  - `frontend/src/pages/maintenance/MaintenanceTasks.jsx` (assignedTo)
  - `frontend/src/pages/maintenance/MaintenanceHistory.jsx` (assignedTo)
  - `frontend/src/pages/maintenance/MaintenanceTaskDetails.jsx` (audit log byUser)
- `frontend/src/pages/requester/MyFeedback.jsx` (if it shows user avatar)

## Backend design

### User model
Add field:
```js
profilePicture: { type: String, default: null }   // "/uploads/avatars/<userId>.jpg" or null
```

### `backend/middleware/upload.js`
- `multer.diskStorage` with `destination: 'uploads/avatars/'` and `filename: <userId> + ext from mimetype`
- `fileFilter` allows `image/jpeg | image/jpg | image/png | image/webp` only
- `limits: { fileSize: 5 * 1024 * 1024 }`
- Exports a single configured `multer({ storage, fileFilter, limits }).single('avatar')` middleware

### `backend/controllers/profileController.js`
- `uploadAvatar(req, res, next)`:
  - Authz: `req.user.id === req.params.id || req.user.role === 'admin'` (403 otherwise)
  - On success: update user `profilePicture` to `/uploads/avatars/`, return updated user (no password)
- `removeAvatar(req, res, next)`:
  - Same authz, delete file from disk if present, set `profilePicture` to `null`, return user

### Routes
```js
// backend/routes/userRoutes.js
router.post('/:id/avatar', protect, upload.single('avatar'), uploadAvatar);
router.delete('/:id/avatar', protect, removeAvatar);
```

### Static serving
Add to `backend/app.js` (above route mounts, after JSON middleware):
```js
app.use('/uploads', express.static('uploads'));
```

### Startup hygiene
In `server.js`, before `app.listen`:
```js
const fs = require('fs');
fs.mkdirSync('uploads/avatars', { recursive: true });
```

### Error handling
multer throws `MulterError` for size + filter failures. Wrap upload middleware with an error handler in the route file (or rely on `next(err)` and add a small `MulterError`-aware branch in the global error handler in `app.js`). Clean 4xx responses:
- `LIMIT_FILE_SIZE` → `"File too large. Maximum size is 5 MB."`
- Wrong mimetype → `"Invalid file type. Only JPG, JPEG, PNG, and WebP are allowed."`

## Frontend design

### `<Avatar user={u} size={32} />`
- If `user?.profilePicture`, render `<img src={API_BASE + user.profilePicture} onError={fallbackToInitials} />`
- Else, render the existing initials circle (blue bg, white text, first letter of name)
- `size` prop controls both width/height; uses Tailwind `rounded-full`
- Optional `onClick` for profile-page preview

### `<ImageCropper onCropDone={(blob) => ...} />`
- Wraps `react-easy-crop` with a zoom slider (1× to 3×)
- Drag handles for the 1:1 crop area
- On "Save", draws cropped region to a 256×256 canvas via `getCroppedImg()` helper
- Returns a JPEG `Blob` (quality 0.9) to the parent
- Parent then `FormData.append('avatar', blob, '<userId>.jpg')` and calls `userAPI.uploadAvatar`

### `Profile.jsx`
- Route: `/profile` (all roles)
- Shows current avatar large (128px), name, email, role badge
- "Change Photo" button → opens `<ImageCropper>` modal
- "Remove Photo" button (only if a picture exists)
- Shows validation errors from server (size/type)
- On success, updates `AuthContext` so navbar reflects immediately

### `Sidebar.jsx` — Profile link
Append a "Profile" entry to each role's `links` array (admin/approver/maintenance/requester). Uses `User` icon. To avoid duplicating the link list 4×, refactor to a small helper that prepends common items (Dashboard, Profile) to each role's specific list.

### `api.js` additions
```js
export const userAPI = {
  // ... existing methods
  uploadAvatar: (id, formData) => api.post(`/users/${id}/avatar`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  removeAvatar: (id) => api.delete(`/users/${id}/avatar`),
};
```

### `authController` — surface profilePicture
After login/register, include `profilePicture: user.profilePicture` in the returned user object so the navbar avatar shows immediately.

## Verification

### Backend smoke test
```bash
# As authenticated user
curl -X POST https://<railway>/api/users/<myUserId>/avatar \
  -H "Authorization: Bearer <jwt>" \
  -F "avatar=@/path/to/test.jpg"

# Should return: { success: true, data: { user: { ..., profilePicture: "/uploads/avatars/<id>.jpg" } } }

# Verify file is served:
curl -I https://<railway>/uploads/avatars/<id>.jpg

# Remove:
curl -X DELETE https://<railway>/api/users/<myUserId>/avatar -H "Authorization: Bearer <jwt>"
```

### Frontend smoke test
1. Log in → navbar shows initials.
2. Navigate to `/profile` → click "Change Photo" → select JPG/PNG/WebP >5MB → see "File too large" error inline.
3. Select a 2MB JPG → see crop UI with zoom slider → drag to adjust → click Save.
4. Page reloads with new photo in profile page AND navbar AND any dashboard lists.
5. Log out, log in as a different user in another tab → that user's avatar is different.
6. As admin → open ManageUsers → click edit avatar on any row → modal opens → upload → that user's avatar updates.
7. As requester → "Remove Photo" button → avatar reverts to initials.
8. DevTools: verify `<img src>` includes the correct URL; simulate 404 → confirm graceful fallback to initials.

### Production deployment
1. `git push origin main` (Vercel + Railway auto-deploy).
2. Create `backend/uploads/avatars/` on first request — the startup `mkdirSync` handles this.
3. Confirm Railway logs show no multer/MIME errors on a sample upload.

## Order of work (single PR, ~1 day)

1. Backend: User model → multer middleware → profileController → routes → static mount → startup mkdir.
2. Frontend: install `react-easy-crop` → Avatar component → ImageCropper → Profile page → Sidebar link → App.jsx route.
3. Wire avatars in: Navbar + 7 page renderings.
4. Admin ManageUsers "Edit avatar" button + modal.
5. Test: smoke-test upload, remove, RBAC, file size/type validation, and a logout/login cycle.
