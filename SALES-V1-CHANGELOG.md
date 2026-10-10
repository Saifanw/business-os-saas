# Sales Contacts V1
- Added an admin-only Sales page for CSV contact imports, filters, status tracking, follow-up dates, notes, CSV export, and manual one-by-one WhatsApp click-to-chat.
- Contact records are stored in the existing Firebase project's top-level `salesContacts` collection, isolated from customer workspaces.
- Duplicate phone numbers are skipped on import.
- Added a `Sales` link to the existing Admin navigation.
- Updated Firestore rules to allow only admins to read/write `salesContacts`.
- Before use, deploy the updated `firestore.rules` and host `sales.html` and `sales-template.csv` with the rest of the site.
- WhatsApp is opened for human review and sending; no automatic bulk sending is implemented.
