# BusinessOS Payments V1 (manual UPI / bank transfer)

## Files
New: `plans-config.js`, `payment.html`, `admin-payments.html`, `assets/upi-qr.jpeg`, `functions/plans.js`
Changed: `subscription.html`, `import-export.html`, `team-settings.html`, `admin.html` (nav link), `functions/index.js` (`reviewPayment`), `firestore.rules`

## Deploy (in this order)
1. Review `firestore.rules` (new blocks: paymentRequests, subscriptions, paymentAuditLogs). Then `firebase deploy --only firestore:rules`.
2. `cd functions && npm install && firebase deploy --only functions:reviewPayment` (Blaze plan needed).
3. Push the HTML/JS/assets to GitHub Pages.
Prices live in TWO places: `plans-config.js` (browser) and `functions/plans.js` (server) + the amounts in the rules. Change all three together.

## Flow
Customer: Plans page → Upgrade → payment.html → "Proceed" (creates `pending` request) → pays by UPI/bank → submits UTR, date, WhatsApp no. → "Awaiting verification".
Admin: admin.html → Payments → check credit in bank/UPI → Approve (Cloud Function: one transaction updates payment, business plan/expiry/limits, subscriptions doc, audit log) or Reject with reason.
Approving twice changes nothing. A UTR already used on a verified payment is refused. Renewal while active extends from the current expiry.

## Test checklist (none of this has been run against live Firebase yet)
- [ ] Free account opens Plans page and Import page without error
- [ ] Upgrade → request is created; both UPI QR and bank details show with working Copy buttons
- [ ] Submit with bad UTR / future date / bad phone is blocked
- [ ] After submit, plan is still Free
- [ ] Customer cannot set paymentStatus=verified from console (rules reject)
- [ ] Non-admin cannot open Payments or call reviewPayment
- [ ] Approve → plan, expiry, limits change; Approve again → "already verified", expiry unchanged
- [ ] Reject keeps the record; customer sees reason and can resubmit
- [ ] WhatsApp opens with right number and message; no phone → clear warning
- [ ] Starter user is stopped at 500 records on import; Free at 10
- [ ] Login, customers, import/export, team pages still work

## Known limitations
- No screenshot upload (needs Firebase Storage rules; UTR is the required proof).
- Phone is stored on the payment request, not on the business profile.
- Record limits are still enforced in the browser only; server-side counting is not built.
- Expiry is not enforced automatically yet: after `subscriptionEndsAt` passes, the plan stays until an admin or a scheduled function downgrades it.
- `business-finder-app.html` still uses its own 10-record check.
- Confirm that the UPI ID and bank account are authorised to receive business payments before launch.
