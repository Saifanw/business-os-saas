# Owner Claim Fix

The customer onboarding query now includes `ownerUid == ""` so Firestore Security Rules can safely authorize the pending-business query.

Flow: Google login → pending business query by ownerEmail + ownerUid → claim business → create/update users/{uid} → open workspace.
