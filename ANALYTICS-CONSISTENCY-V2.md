# Analytics Consistency V2

- Added a shared `assets/analytics-engine.js` used by Customers and Reports.
- Unified totals, Won/Lost, open pipeline, hot leads, pipeline stages, follow-up today/overdue, source normalization, and activity counts.
- Customers workspace counters now use the same follow-up calculations as Reports.
- Reports now uses the shared analytics engine instead of duplicate date/status/source logic.
- Follow-up date parsing supports the Business OS display formats consistently.
- Source labels are normalized to Website, WhatsApp, Google, Import, Manual Entry, or the original source.
- Existing Firebase collections and permissions are unchanged.
