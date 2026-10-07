# Deals V2
- Added dedicated Deals & Revenue workspace.
- Reads/writes `businesses/{businessId}/deals` using existing private Firestore rules.
- Won/Paid pipeline contacts continue to auto-create/update a deal record.
- Added deal value, payment status, received amount, closing date and notes.
- Added deal metrics: count, gross value, collected, pending, conversion.
- Added customer selector and manual deal creation.
- No Firebase rules changes required.
