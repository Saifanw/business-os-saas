# Business OS — Product V1 Checklist

## Core SaaS
- [x] Existing Firebase authentication preserved
- [x] Admin-provisioned business records
- [x] Owner email onboarding / claim flow
- [x] Multi-business workspace mapping
- [x] Backward-compatible self-serve workspace
- [x] Firestore ownership rules updated

## Templates
- [x] Property template
- [x] Coaching template
- [x] General Business template
- [x] Reusable `templates.js` configuration

## Sales demo
- [x] Business selector in public demo
- [x] Property sample metrics
- [x] Coaching sample metrics
- [x] General Business sample metrics
- [x] Demo data isolated from private Firestore data

## Admin
- [x] Create Business button
- [x] Business provisioning form
- [x] Business list
- [x] Owner email + template + plan + status

## Customer workspace
- [x] Existing contacts preserved
- [x] Existing follow-up/activity logic preserved
- [x] Workspace resolves assigned businessId
- [x] Business name/template shown in workspace

## Before taking paid customers
- [ ] Deploy updated Firestore rules
- [ ] Test Admin → Create Business
- [ ] Test owner Google login with exact owner email
- [ ] Test Customer A cannot read Customer B
- [ ] Test existing account still opens its old workspace
- [ ] Test property/coaching/general demos
- [ ] Add real payment gateway only after product validation
