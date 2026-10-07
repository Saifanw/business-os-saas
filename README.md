# Business OS SaaS V1
Premium multi-page front-end prototype with interactive demo. Demo data is browser-local only.


## Luxury UI Layer — v1
This build adds `assets/luxury.css`, a presentation layer for the existing Business OS product.
The visual direction is premium SaaS / BI-inspired: executive KPI cards, Power BI-style analytics,
glass/soft surfaces, cinematic gradients, refined spacing, premium navigation, and responsive layouts.
Existing pages and JavaScript functionality are preserved.


## Customer Workspace Luxury V2
Customer workspace typography, contrast, density, shadows and modal hierarchy are upgraded while the Admin Control Center remains intentionally unchanged.


## Customer Workspace Luxury V3
Stronger contrast, larger typography, deeper shadows, denser customer rows and a more executive premium workspace. Admin remains unchanged.


## Full-Screen CRM Table V4
Customer list is presented as a full-width executive data table with compact rows, stronger contrast and premium depth. Existing data and JavaScript model are preserved.


## Admin Full-Width V5
The large dark navigation rail is hidden on the Admin Control Center so the dashboard and contact table use the full browser width.


## Product V1 — Ready-to-Sell Architecture

Business OS is now structured as a reusable SaaS product rather than a separate website per customer. Admin can provision a business, assign an owner email and template, and the owner claims the workspace by signing in with that email.

### Templates
- Property — enquiry to site visit to negotiation to won
- Coaching — enquiry to counselling to demo class to admission
- General — lead to follow-up to visit/demo to won

### Customer flow
Public site → Live Demo → customer agrees → Admin creates Business → owner signs in → assigned workspace opens.

### Important
Deploy `firestore.rules` to the Firebase project before using the new provisioning flow. Test with two separate Google accounts before onboarding real customers.
