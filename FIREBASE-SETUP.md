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
