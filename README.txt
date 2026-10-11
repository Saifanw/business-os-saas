BusinessOS Requests & Activity V1
=================================

Replace these 7 files in the GitHub repository (same paths, root folder):
- team-settings.html
- import-export.html
- customer-list.html
- customer-profile.html
- followups.html
- followups-new.html
- deals.html

Firebase Rules are separate from GitHub Pages. The included firestore.rules must be published separately in Firebase Console for permission requests/activity to load.

SAFE DEPLOY ORDER
1. Backup your current GitHub repository and current Firestore Rules.
2. Upload the seven HTML files to the same paths in GitHub and commit.
3. Open the included firestore.rules. It is based on the latest project ZIP you supplied and adds permissionRequests/teamActivity rules to the existing rules.
4. In Firebase Console, select the same BusinessOS project, open Firestore Database > Rules, replace the editor content with this full rules file, review, then Publish. If the editor reports an error or Publish is unavailable, stop and send a screenshot; do not force it.
5. Test with Owner + Sales accounts:
   - Sales sends an import/export permission request.
   - Owner opens Team & Settings. The Requests & activity tab should show a live pending count.
   - In Team, click Requests / activity beside a member to filter their requests and activity.
   - Owner approves or rejects a request; Sales sees status in Import & Export.
   - Change a customer status, save a note/interaction, schedule/complete a follow-up, add/edit a customer, save a deal, import/export; these instrumented actions should appear in the Owner activity feed.

What is recorded in this V1:
- Permission requested / approved / rejected / used
- Team member invited / disabled / activated / removed
- Customer created / edited / status changed / interaction / note saved
- Follow-up scheduled / completed
- Deal saved
- Import / export action

Limitations / security note:
- The feed only records actions instrumented in this version; it does not backfill old activity and is not a tamper-proof audit log.
- Import/Export approval gates the normal page controls. Active Sales users still have Firestore read access to customer records so normal CRM screens work; a technically determined user could bypass a browser-only export gate. Strong prevention of bulk export requires moving export generation to a trusted backend/Cloud Function that checks approval server-side. Do not treat this V1 alone as complete data-loss prevention.
- No live Firebase test was run. JavaScript syntax checks passed locally for all seven modified HTML page scripts. Firestore Rules were reviewed for delimiter balance but not compiled with the Firebase Emulator.
