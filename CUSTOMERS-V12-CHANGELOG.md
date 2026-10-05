# Business OS Customers V12 — Production Foundation

## What changed
- Replaced browser-local customer storage with Firebase Authentication + Cloud Firestore.
- Added Google sign-in gate to the private Customers workspace.
- Each signed-in user receives an isolated business workspace keyed to their Firebase UID.
- Added Firestore-backed customer CRUD, live realtime list updates, duplicate-mobile protection, CSV/XLSX import, CSV export, activity updates and follow-up completion.
- Added a production `firestore.rules` baseline enforcing tenant isolation.
- Kept `demo.html` as the public dummy-data demo; Customers is now the authenticated private workspace.
- Changed the Customers page Live Demo button to point to `demo.html`.

## Firebase setup required
1. In Firebase Console, enable Google sign-in under Authentication > Sign-in method.
2. Create/enable Firestore Database.
3. Publish `firestore.rules` to the same Firebase project.
4. Add the deployed GitHub Pages domain to Authentication > Settings > Authorized domains.

## Important limitation
The current rules use `businessId == request.auth.uid`, which provides strong tenant isolation for the current single-owner workspace. Team members/role-based access should be added before multi-user businesses are enabled.

## Next recommended module
Build the dedicated Follow-ups module using `businesses/{businessId}/contacts/{contactId}/followups`, with Today / Overdue / Upcoming / Completed views and immutable history.
