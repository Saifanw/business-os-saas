# BusinessOS Free Plan V1

- New self-service workspaces start on the `trial` plan, presented as Free.
- Free accounts are limited in the UI to 10 combined CRM contact records (customers and Finder prospects share the same contacts collection).
- Manual customer creation, Finder prospect creation, website-lead conversion, and CSV/XLSX import all check the limit. Imports stop at the remaining capacity and report skipped rows.
- Existing records can still be edited/deleted after the limit is reached.
- The configured admin email bypasses the limit. Starter/Growth/Business plans bypass this initial 10-record cap; paid plan capacity can be refined before selling those plans.
- The Plans & Limits page presents manual paid-access requests. No payment gateway is included.
- Firestore rules prevent a workspace owner from changing their own plan field and restrict self-service business creation to trial/free plans. Admin can still assign plans.

## Important launch note
The 10-record cap is currently enforced in the client workflows. Firestore Rules cannot count a collection directly, so a determined user could bypass the UI by writing directly to Firestore. Before public paid launch, move record creation through a trusted backend/Cloud Function or implement an atomic usage-counter design and enforce it in Firestore Rules. Deploy the updated rules and test with two separate Google accounts before onboarding customers.
