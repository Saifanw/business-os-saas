BusinessOS - new member cannot open Team & settings (failed-precondition) + join link flow

WHAT WAS WRONG
1) failed-precondition = Firestore needs a collection-group index on teamInvites.email. It did not exist.
2) The Sales Join Link pointed to customers.html?joinToken=..., but only team-settings.html understood joinToken.
   A new member opening the link was never actually joined. New page join.html does the join.

STEPS (in this order)
A) Create the index (pick ONE):
   - Console: Firebase -> Firestore Database -> Indexes -> "Single field" tab -> Add exemption
       Collection ID: teamInvites     Field path: email
       Query scopes: tick "Collection group" (Ascending)  -> Save. Wait until status = Enabled.
   - or CLI from the repo root:  firebase deploy --only firestore:indexes
B) Copy these files into the repo (same paths):
     join.html                  (NEW)
     team-settings.html         (join links now point to join.html)
     assets/workspace.js        (missing index no longer blocks; clearer message)
     firebase.json              (adds the indexes file)
     firestore.indexes.json     (NEW)
   firestore.rules is NOT changed.
C) In Team & settings, create a NEW Sales Join Link (old links point to customers.html and will not join anyone).
D) Open that link in the other Google account -> join.html -> "Welcome to <business>".

A NEW ACCOUNT MUST JOIN THROUGH THE LINK FIRST. Opening team-settings.html directly with an account that
has no workspace will show "No Business OS workspace is linked..." - that is expected.
