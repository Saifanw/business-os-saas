const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();
const GOOGLE_PLACES_API_KEY = defineSecret('GOOGLE_PLACES_API_KEY');
const WHATSAPP_ACCESS_TOKEN = defineSecret('WHATSAPP_ACCESS_TOKEN');
const WHATSAPP_PHONE_NUMBER_ID = defineSecret('WHATSAPP_PHONE_NUMBER_ID');
const WHATSAPP_VERIFY_TOKEN = defineSecret('WHATSAPP_VERIFY_TOKEN');
const WHATSAPP_APP_SECRET = defineSecret('WHATSAPP_APP_SECRET');
const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || 'v23.0';

async function businessFor(uid) {
  const userSnap = await db.doc(`users/${uid}`).get();
  return userSnap.exists && userSnap.data().businessId ? userSnap.data().businessId : uid;
}
async function requireAuth(request) {
  if (!request.auth || !request.auth.uid) throw new HttpsError('unauthenticated', 'Please sign in first.');
  return request.auth.uid;
}
function clean(v, max = 180) { return String(v || '').trim().slice(0, max); }

// Search Text (New) returns publicly listed business profile fields only.
exports.searchPlaces = onCall({ secrets: [GOOGLE_PLACES_API_KEY], timeoutSeconds: 60 }, async (request) => {
  await requireAuth(request);
  const query = clean(request.data && request.data.query, 200);
  if (query.length < 3) throw new HttpsError('invalid-argument', 'Enter a business category and city.');
  // Control API spend: limit each signed-in user to 30 search requests per UTC day.
  const day = new Date().toISOString().slice(0, 10);
  const rateRef = db.doc(`placesSearchUsage/${request.auth.uid}`);
  await db.runTransaction(async tx => {
    const snap = await tx.get(rateRef);
    const prior = snap.exists && snap.data().day === day ? Number(snap.data().count || 0) : 0;
    if (prior >= 30) throw new HttpsError('resource-exhausted', 'Daily Google Places search limit reached (30 searches). Try again tomorrow.');
    tx.set(rateRef, { day, count: prior + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
  const body = { textQuery: query, pageSize: 20, regionCode: 'IN', languageCode: 'en' };
  if (request.data && request.data.pageToken) body.pageToken = clean(request.data.pageToken, 500);
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY.value(),
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.primaryTypeDisplayName,places.businessStatus,nextPageToken'
    },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('Places API error', response.status, payload.error && payload.error.message);
    throw new HttpsError('failed-precondition', 'Google Places search failed. Check API enablement, billing, key restrictions and quota.');
  }
  const places = (payload.places || []).map(p => ({
    placeId: p.id || '', name: p.displayName && p.displayName.text || '',
    address: p.formattedAddress || '', phone: p.nationalPhoneNumber || p.internationalPhoneNumber || '',
    website: p.websiteUri || '', mapsUrl: p.googleMapsUri || '',
    category: p.primaryTypeDisplayName && p.primaryTypeDisplayName.text || '',
    businessStatus: p.businessStatus || ''
  }));
  return { places, nextPageToken: payload.nextPageToken || null, count: places.length };
});

// Sends only to contacts whose WhatsApp opt-in has been explicitly confirmed in CRM.
// Uses a pre-approved WhatsApp template; it does not send arbitrary cold messages.
exports.sendWhatsAppCampaign = onCall({ secrets: [WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID], timeoutSeconds: 540, memory: '512MiB' }, async (request) => {
  const uid = await requireAuth(request);
  const businessId = await businessFor(uid);
  const ids = Array.isArray(request.data && request.data.contactIds) ? [...new Set(request.data.contactIds.map(x => clean(x, 160)).filter(Boolean))] : [];
  if (ids.length > 100) throw new HttpsError('invalid-argument', 'Campaigns are limited to 100 recipients per run. Filter the list and run smaller batches.');
  const templateName = clean(request.data && request.data.templateName, 100).replace(/[^a-zA-Z0-9_]/g, '');
  const languageCode = clean(request.data && request.data.languageCode, 12) || 'en';
  const campaignName = clean(request.data && request.data.campaignName, 120) || 'WhatsApp campaign';
  if (!ids.length) throw new HttpsError('invalid-argument', 'Select at least one opted-in contact.');
  if (!templateName) throw new HttpsError('invalid-argument', 'Enter the name of an approved WhatsApp template.');
  const businessRef = db.doc(`businesses/${businessId}`);
  const businessSnap = await businessRef.get();
  if (!businessSnap.exists) throw new HttpsError('failed-precondition', 'Business workspace not found.');
  const contacts = [];
  const seenPhones = new Set();
  for (const id of ids) {
    const ref = businessRef.collection('contacts').doc(id);
    const snap = await ref.get();
    if (!snap.exists) continue;
    const c = snap.data();
    if (c.whatsappOptIn !== true) continue;
    const phone = String(c.phone || '').replace(/\D/g, '').replace(/^0/, '');
    const normalized = phone.length === 10 ? '91' + phone : phone;
    if (!/^91[6-9]\d{9}$/.test(normalized) || seenPhones.has(normalized)) continue;
    seenPhones.add(normalized);
    contacts.push({ id, ref, c, phone: normalized });
  }
  if (!contacts.length) throw new HttpsError('failed-precondition', 'No valid selected contacts have confirmed WhatsApp consent.');

  const campaignRef = businessRef.collection('campaigns').doc();
  await campaignRef.set({ name: campaignName, templateName, languageCode, status: 'sending', total: contacts.length, sent: 0, failed: 0, createdAt: FieldValue.serverTimestamp(), createdBy: uid });
  let sent = 0, failed = 0;
  for (const item of contacts) {
    const values = [clean(item.c.name, 100) || 'there', clean(item.c.businessName || item.c.name, 100) || 'your business', clean(item.c.city, 80), clean(item.c.area, 80)];
    const components = [{ type: 'body', parameters: values.map(text => ({ type: 'text', text: text || '-' })) }];
    const payload = { messaging_product: 'whatsapp', recipient_type: 'individual', to: item.phone, type: 'template', template: { name: templateName, language: { code: languageCode }, components } };
    let result, status = 'failed', errorText = '';
    try {
      const r = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${WHATSAPP_PHONE_NUMBER_ID.value()}/messages`, {
        method: 'POST', headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN.value()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      result = await r.json().catch(() => ({}));
      if (!r.ok) errorText = clean(result.error && result.error.message || `HTTP ${r.status}`, 300);
      else status = 'sent';
    } catch (e) { errorText = clean(e.message || 'Network error', 300); }
    const messageId = result && result.messages && result.messages[0] && result.messages[0].id || '';
    const recRef = campaignRef.collection('recipients').doc(item.id);
    await recRef.set({ contactId: item.id, name: values[0], phone: item.phone, status, messageId, error: errorText, sentAt: status === 'sent' ? FieldValue.serverTimestamp() : null, updatedAt: FieldValue.serverTimestamp() });
    if (messageId) {
      await db.doc(`whatsappMessageIndex/${messageId}`).set({ businessId, campaignId: campaignRef.id, contactId: item.id, createdAt: FieldValue.serverTimestamp() });
      await db.doc(`whatsappPhoneIndex/${item.phone}`).set({ businessId, contactId: item.id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    if (status === 'sent') sent++; else failed++;
  }
  await campaignRef.update({ status: failed ? (sent ? 'partially_sent' : 'failed') : 'sent', sent, failed, completedAt: FieldValue.serverTimestamp() });
  return { campaignId: campaignRef.id, total: contacts.length, sent, failed, message: 'WhatsApp API accepted messages marked sent; delivery status will update from Meta webhooks.' };
});

// Configure this URL as the Meta WhatsApp webhook. Subscribe to messages (statuses and inbound replies).
exports.whatsappWebhook = onRequest({ secrets: [WHATSAPP_VERIFY_TOKEN, WHATSAPP_APP_SECRET], cors: false }, async (req, res) => {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token && token === WHATSAPP_VERIFY_TOKEN.value()) return res.status(200).send(challenge);
    return res.sendStatus(403);
  }
  if (req.method !== 'POST') return res.sendStatus(405);
  const crypto = require('crypto');
  const signature = String(req.get('x-hub-signature-256') || '');
  const expected = 'sha256=' + crypto.createHmac('sha256', WHATSAPP_APP_SECRET.value()).update(req.rawBody || Buffer.from('')).digest('hex');
  const a = Buffer.from(signature); const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.sendStatus(401);
  try {
    const entries = req.body && req.body.entry || [];
    for (const entry of entries) for (const change of (entry.changes || [])) {
      const value = change.value || {};
      for (const status of (value.statuses || [])) {
        if (!status.id) continue;
        const index = await db.doc(`whatsappMessageIndex/${status.id}`).get();
        if (!index.exists) continue;
        const ix = index.data();
        await db.doc(`businesses/${ix.businessId}/campaigns/${ix.campaignId}/recipients/${ix.contactId}`).set({ status: status.status || 'unknown', statusAt: status.timestamp ? new Date(Number(status.timestamp) * 1000) : FieldValue.serverTimestamp(), statusError: status.errors && status.errors[0] && status.errors[0].title || '' }, { merge: true });
      }
      for (const msg of (value.messages || [])) {
        const from = String(msg.from || '').replace(/\D/g, '');
        if (!from) continue;
        const route = await db.doc(`whatsappPhoneIndex/${from}`).get();
        if (route.exists) {
          const target = route.data();
          await db.doc(`businesses/${target.businessId}/contacts/${target.contactId}`).update({ whatsappLastReplyAt: FieldValue.serverTimestamp(), whatsappLastReplyType: msg.type || 'text', whatsappLastReplyText: clean(msg.text && msg.text.body || '[Incoming WhatsApp message]', 500), updatedAt: FieldValue.serverTimestamp() });
        }
      }
    }
    return res.sendStatus(200);
  } catch (e) { console.error('WhatsApp webhook error', e); return res.sendStatus(500); }
});
