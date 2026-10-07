# BusinessOS V18.1 — Team Invitation Permission Fix

The Team & Settings invitation form can show `Missing or insufficient permissions` if the deployed Firestore rules are still on the older version.

## Required
Publish the included `firestore.rules` in Firebase Console → Firestore Database → Rules.

This version recognizes the workspace owner directly from `businesses/{businessId}.ownerUid`, in addition to the existing owner/admin user-role check.

No application data is migrated or deleted.
