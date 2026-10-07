# Business OS V15 — Lead Pipeline & Deal Flow

## Added
- Clickable template-specific pipeline stages with live counts.
- Stage buttons filter the customer/lead list instantly.
- Customer profile now includes a Pipeline control to move a lead between stages.
- Moving a contact to `Won` or `Paid` creates/updates a deal record under `businesses/{businessId}/deals/{contactId}`.
- Pipeline remains template-driven for Property, Coaching, and General businesses.

## Preserved
- Firebase authentication and business ownership.
- Existing customers/contacts and follow-up/activity data.
- Existing templates and customer save/import/export workflows.

## Security
- No Firestore rules changes are included in this release. Existing deployed rules continue to control access.
