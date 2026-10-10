# Prospecting & WhatsApp Campaigns — Setup Guide

This release adds a Prospecting Center UI and Firebase Cloud Functions for Google Places Text Search and WhatsApp Business Platform template campaigns. **The UI is not live until the functions and provider credentials below are configured and deployed.** No API secret is stored in browser code.

## What is included

- Search public Google Places business listings by category, city and area (up to 20 results per query).
- Display available business name, address, public phone, website and Google Maps URL.
- Save selected Place IDs only to `businesses/{businessId}/placeShortlists`; duplicate Place IDs are skipped. The API-returned names, phone numbers, websites and addresses are displayed only in the current search session and are not copied to the permanent CRM.
- Contacts added from an independent licensed/exportable source can be imported into CRM and must default to no WhatsApp consent until verified.
- Manually mark consent as confirmed only after valid permission is recorded. Campaign function rejects contacts without `whatsappOptIn: true` and validates Indian mobile numbers.
- Send up to 100 recipients per campaign using a Meta-approved WhatsApp template.
- Store campaign and per-recipient status in Firestore; Meta status webhooks update delivery/read/failure status. Inbound replies are attached to the contact indexed by a prior campaign send.

## Requirements

- Firebase CLI installed and signed in (`npm install -g firebase-tools`, then `firebase login`).
- Firebase project `business-os-saas-traking` with Cloud Functions enabled. Deployment may require the Firebase/Google Cloud Blaze billing plan and enabled billing.
- Google Places API (New) enabled with billing enabled. Create a server-side API key restricted to Places API (New), and store it as a Firebase secret.
- Meta WhatsApp Business Platform app, a registered phone number, an access token, and at least one approved message template.
- Do not use the feature to send unsolicited messages. A Google Maps listing or public phone number is not proof of WhatsApp opt-in. Keep a record of permission and respect opt-outs.

## Deploy

Run these commands from the repository root:

```bash
firebase use business-os-saas-traking
firebase functions:secrets:set GOOGLE_PLACES_API_KEY
firebase functions:secrets:set WHATSAPP_ACCESS_TOKEN
firebase functions:secrets:set WHATSAPP_PHONE_NUMBER_ID
firebase functions:secrets:set WHATSAPP_VERIFY_TOKEN
firebase functions:secrets:set WHATSAPP_APP_SECRET
cd functions && npm install && npm run lint && cd ..
firebase deploy --only functions,firestore:rules
```

When prompted, paste each corresponding value. `WHATSAPP_PHONE_NUMBER_ID` is the Meta phone-number ID, not the visible phone number. `WHATSAPP_VERIFY_TOKEN` is a random secret string you choose and also enter in Meta's webhook setup. `WHATSAPP_APP_SECRET` is the Meta app secret used to verify webhook signatures.

The code uses Cloud Functions in the default `us-central1` region and currently calls Graph API `v23.0`. If Meta has retired that version in your account, update `GRAPH_VERSION` in `functions/index.js` to a currently supported version before deploying.

## Meta webhook setup

After deploying, copy the HTTPS URL for `whatsappWebhook` from Firebase Functions. In Meta Developer Dashboard → WhatsApp → Configuration, set that URL as the callback URL and enter the same `WHATSAPP_VERIFY_TOKEN` secret. Subscribe the webhook to the `messages` field. The endpoint verifies `X-Hub-Signature-256` using `WHATSAPP_APP_SECRET`.

## Approved template variables

The send function passes four body variables, in this exact order:

1. Contact name
2. Business name
3. City
4. Area

Create/approve a Meta template with four body placeholders (for example `{{1}}`, `{{2}}`, `{{3}}`, `{{4}}`) or adjust the `components` payload to match the template you actually approve. The selected language code must match the approved template. Marketing templates may be subject to Meta approval, pricing and messaging limits.

## Data and campaign status

- Business contacts: `businesses/{businessId}/contacts/{contactId}`
- Campaign: `businesses/{businessId}/campaigns/{campaignId}`
- Campaign recipients: `businesses/{businessId}/campaigns/{campaignId}/recipients/{contactId}`
- Provider message lookup: `whatsappMessageIndex/{wamid}` (server-only; default-deny rules)
- Reply routing: `whatsappPhoneIndex/{countryCodeAndNumber}` (server-only; default-deny rules)

`sent` means Meta accepted the API request, not that the recipient received or read it. Delivery/read/failure states require the webhook. The static site cannot receive webhooks by itself; Cloud Functions are required.

## Search coverage limits

Google Places is not a complete downloadable city-wide registry. Each query returns a limited result set, ranking varies by query, and some listings have no public phone/website. Repeat searches across areas (for example Jhotwara, Vaishali Nagar, Mansarovar, Jagatpura, Malviya Nagar) and business categories to broaden discovery. Importantly, Places API policy restricts storing/caching its content; place IDs are the main exception. This implementation therefore stores only Place IDs from API results. Do not build a permanent phone/name database from Places output. For permanent CRM contact records, use a separately licensed/exportable data provider, contacts collected directly by your business, or an appropriate user-provided CSV. Show the Google logo/required attribution, and publish the Terms of Use and Privacy Policy required by Google before production. See https://developers.google.com/maps/documentation/places/web-service/policies.
