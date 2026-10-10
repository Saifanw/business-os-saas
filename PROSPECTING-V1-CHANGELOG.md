# Prospecting V1 — 10 October 2026

- Added `prospecting-center.html` for Places discovery, CRM consent review, WhatsApp campaign submission, and campaign status viewing.
- Added Firebase Cloud Functions: `searchPlaces`, `sendWhatsAppCampaign`, and `whatsappWebhook`.
- Google Places searches are server-side; the API key is a Firebase secret, not a browser key. Search rate limit is 30 calls per signed-in user per UTC day.
- The app saves only Place IDs from Places API results; API-returned names, phone numbers, websites and addresses remain transient in the search session due Google Places content storage restrictions.
- Campaign sends are limited to 100 contacts per run, require `whatsappOptIn === true`, validate Indian mobile numbers, and use an approved Meta WhatsApp template.
- Delivery/read/failure states and inbound replies depend on Meta webhook configuration.
- Added Firestore read rules for campaign reporting and user-scoped Place ID shortlists. Campaign writes and provider indexes remain server-side.
- No API credentials are included. See `PROSPECTING-WHATSAPP-SETUP.md` before deploying.
