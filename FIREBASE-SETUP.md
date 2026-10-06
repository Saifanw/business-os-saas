# Business OS Firebase Setup

## Firebase project
Use the dedicated `business-os-saas-traking` Firebase project.

## Authentication
Enable **Google** under Firebase Authentication > Sign-in method.

Authorized domain required for GitHub Pages:
- `saifanw.github.io`

## Firestore
Use **Cloud Firestore**. Realtime Database is not used by Business OS.

Publish `firestore.rules` from this repository.

## Important
`customers.html` is configured for the Business OS Firebase project. Do not replace it with the Jaipur Property Consultant Firebase config.


## Business OS SaaS admin
The customer workspace and Private Admin now use the same `business-os-saas-traking` Firebase project.

### One-time Super Admin setup
After the first deployment, open Firestore in the Business OS Firebase project and manually create:
`admins/<YOUR_FIREBASE_AUTH_UID>`

The document can contain:
`role: "superadmin"`

Do not create this admin document from the public website. The Firestore rules deliberately prevent clients from writing to `/admins`.

### Important
The old `jaipur-property-consultant` Firebase project is not used by the Business OS Admin after this version. Do not delete the old project until any legacy data you still need has been exported/backed up.
