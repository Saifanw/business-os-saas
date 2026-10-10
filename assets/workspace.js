/* Business OS — shared workspace resolver (single source of truth).
 * Every page calls resolveWorkspace() instead of guessing "businessId || uid".
 *
 * Order:
 *  1. users/{uid}.businessId (the persisted link).
 *  2. Not linked yet -> look for an invitation addressed to this Google email
 *     (?join=<businessId> hint first, then a collection-group lookup). If exactly one
 *     active invitation exists the link is created (users/{uid}), which Firestore Rules
 *     accept only for an active invitation whose email matches the signed-in token.
 *  3. Legacy owner workspace (businesses/{uid}) only if it really exists / has data.
 *  4. Otherwise throw WorkspaceError. NEVER silently fall back to an empty workspace.
 * Firestore Rules remain the real authority; this file only picks the right ID and
 * explains denials clearly.
 */
import {
  doc, getDoc, getDocs, setDoc, query, where, limit,
  collection, collectionGroup, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

export class WorkspaceError extends Error {
  constructor(code, message) { super(message); this.name = "WorkspaceError"; this.code = code; }
}

const lc = v => String(v || "").trim().toLowerCase();
const denied = e => e && (e.code === "permission-denied" || /permission/i.test(e.message || ""));

async function findInvite(db, email, hintBizId) {
  // 1) Direct lookup when the invitation link carries ?join=<businessId> (no index needed).
  if (hintBizId && /^[A-Za-z0-9_-]{1,128}$/.test(hintBizId)) {
    try {
      const s = await getDoc(doc(db, "businesses", hintBizId, "teamInvites", email));
      if (s.exists() && lc(s.data().email) === email) return { bizId: hintBizId, data: s.data() };
    } catch (e) { console.warn("invite hint lookup", e); }
  }
  // 2) Collection-group lookup by email (needs the rule + index shipped with this fix).
  let snap;
  try {
    snap = await getDocs(query(collectionGroup(db, "teamInvites"), where("email", "==", email)));
  } catch (e) {
    console.warn("invite lookup", e);
    throw new WorkspaceError("invite-lookup-failed",
      "Could not look up your invitation (" + (e.code || e.message) + "). Ask the owner to resend the invitation link, or contact support.");
  }
  const found = snap.docs
    .map(d => ({ bizId: d.ref.parent.parent.id, data: d.data() }))
    .filter(x => lc(x.data.email) === email);
  if (!found.length) return null;
  const active = found.filter(x => x.data.status === "active");
  if (active.length > 1) {
    throw new WorkspaceError("ambiguous-invite",
      "This Google account is invited to more than one workspace. Open the invitation link shared by your owner so the correct workspace is used.");
  }
  if (active.length === 1) return active[0];
  return found[0]; // only inactive invitations exist
}

async function findJoinLink(db, token) {
  if (!token || !/^[A-Za-z0-9_-]{32,128}$/.test(token)) return null;
  try {
    const s = await getDoc(doc(db, "teamJoinLinks", token));
    if (!s.exists()) return null;
    const data = s.data();
    if (data.status !== "active" || data.role !== "sales" || !data.businessId) return null;
    return { token, data };
  } catch (e) {
    console.warn("join link lookup", e);
    throw new WorkspaceError("join-link-lookup-failed", "Could not verify this join link. Please try again or ask the owner for a new link.");
  }
}

async function legacySelfWorkspace(db, uid) {
  try {
    const b = await getDoc(doc(db, "businesses", uid));
    if (b.exists()) return true;
    const c = await getDocs(query(collection(db, "businesses", uid, "contacts"), limit(1)));
    return !c.empty;
  } catch (e) { console.warn("legacy workspace check", e); return false; }
}

export async function resolveWorkspace(db, user, opts = {}) {
  if (!user || !user.uid) throw new WorkspaceError("signed-out", "Please sign in.");
  const uid = user.uid, email = lc(user.email);
  const hint = opts.hint !== undefined ? opts.hint : new URLSearchParams(location.search).get("join");

  let us;
  try { us = await getDoc(doc(db, "users", uid)); }
  catch (e) { throw new WorkspaceError("profile-unreadable", "Could not read your account link (" + (e.code || e.message) + ")."); }

  let bizId = us.exists() ? String(us.data().businessId || "") : "";
  let role = us.exists() ? String(us.data().role || "") : "";
  let via = "users-doc";
  const incomingJoinToken = new URLSearchParams(location.search).get("joinToken");
  if (bizId && incomingJoinToken) {
    const incoming = await findJoinLink(db, incomingJoinToken);
    if (incoming && incoming.data.businessId !== bizId) {
      throw new WorkspaceError("workspace-already-linked", "This Google account is already linked to another workspace. For safety, the link cannot switch your existing workspace automatically. Ask the owner to review the account's workspace membership.");
    }
  }

  if (!bizId) {
    const joinToken = new URLSearchParams(location.search).get("joinToken");
    const joinLink = joinToken ? await findJoinLink(db, joinToken) : null;
    if (joinLink) {
      const target = joinLink.data.businessId;
      const businessSnap = await getDoc(doc(db, "businesses", target));
      if (!businessSnap.exists()) throw new WorkspaceError("workspace-missing", "The owner's workspace no longer exists. Ask the owner to create a new join link.");
      role = "sales";
      try {
        await setDoc(doc(db, "users", uid), {
          uid, email: user.email || "", displayName: user.displayName || "",
          businessId: target, role: "sales", joinToken, createdAt: serverTimestamp(), updatedAt: serverTimestamp()
        });
        await setDoc(doc(db, "businesses", target, "teamInvites", email), {
          email, role: "sales", status: "active", businessId: target,
          joinedVia: "join-link", joinToken, createdAt: serverTimestamp(), updatedAt: serverTimestamp()
        });
      } catch (e) {
        throw new WorkspaceError("join-failed", "Could not join this workspace (" + (e.code || e.message) + "). Ask the owner to check Firestore Rules.");
      }
      bizId = target; via = "join-link";
    }
    const inv = bizId ? null : (email ? await findInvite(db, email, hint) : null);
    if (!bizId && inv) {
      if (inv.data.status !== "active") {
        throw new WorkspaceError("invite-inactive", "Your invitation to this workspace is disabled. Ask the owner to enable it again.");
      }
      role = String(inv.data.role || "sales");
      try {
        await setDoc(doc(db, "users", uid), {
          uid, email: user.email || "", displayName: user.displayName || "",
          businessId: inv.bizId, role, createdAt: serverTimestamp(), updatedAt: serverTimestamp()
        });
      } catch (e) {
        throw new WorkspaceError("join-failed", "Could not link your account to the invited workspace (" + (e.code || e.message) + "). Ask the owner to check your invitation.");
      }
      bizId = inv.bizId; via = "invite-join";
    } else if (!bizId && await legacySelfWorkspace(db, uid)) {
      return { bizId: uid, role: "owner", manager: true, biz: null, via: "legacy-self" };
    } else if (!bizId) {
      throw new WorkspaceError("no-workspace",
        "No Business OS workspace is linked to " + (user.email || "this Google account") + ". Ask your business owner to invite this exact email, then sign in again.");
    }
  }

  // Verify membership. Owners (workspace id == uid, or owner of the business doc) need no invitation.
  let inviteDoc = null;
  if (bizId !== uid) {
    try {
      const s = await getDoc(doc(db, "businesses", bizId, "teamInvites", email));
      if (s.exists()) inviteDoc = s.data();
    } catch (e) { console.warn("invite check", e); }
    if (inviteDoc && inviteDoc.status !== "active") {
      throw new WorkspaceError("invite-inactive", "Your access to this workspace has been disabled by the owner.");
    }
    if (inviteDoc) role = String(inviteDoc.role || role || "sales");
  }

  let biz = null;
  try {
    const bs = await getDoc(doc(db, "businesses", bizId));
    if (bs.exists()) biz = bs.data();
  } catch (e) {
    if (denied(e)) {
      throw new WorkspaceError(inviteDoc || bizId === uid ? "access-denied" : "no-membership",
        inviteDoc
          ? "You do not have access to this workspace. Ask the owner to check your invitation."
          : "Your account is linked to a workspace but no active invitation was found. Ask the owner to invite " + (user.email || "your email") + ".");
    }
    throw new WorkspaceError("workspace-unreadable", "Could not open the workspace (" + (e.code || e.message) + ").");
  }
  if (!biz && bizId !== uid) {
    throw new WorkspaceError("workspace-missing", "The workspace linked to your account no longer exists. Contact support.");
  }
  const isOwner = bizId === uid || (biz && biz.ownerUid === uid) || role === "owner";
  if (isOwner) role = "owner";
  const manager = isOwner || role === "admin";
  return { bizId, role: role || "sales", manager, biz, via };
}

/* Full-screen explanation + sign-out. Used instead of showing an empty dashboard. */
export function blockWorkspace(err, auth) {
  const msg = (err && err.message) || "Workspace could not be opened.";
  let el = document.getElementById("bosWsBlock");
  if (!el) {
    el = document.createElement("div"); el.id = "bosWsBlock"; el.setAttribute("role", "alert");
    el.style.cssText = "position:fixed;inset:0;z-index:9999;background:#f5f7fb;display:grid;place-items:center;padding:20px;font-family:Inter,system-ui,Arial,sans-serif";
    document.body.appendChild(el);
  }
  el.innerHTML = "";
  const card = document.createElement("div");
  card.style.cssText = "max-width:440px;background:#fff;border:1px solid #e6eaf2;border-radius:16px;padding:28px;text-align:center;box-shadow:0 18px 40px #0f172a1a";
  const h = document.createElement("h2"); h.textContent = "Workspace not available"; h.style.cssText = "margin:0 0 10px;font-size:20px;color:#0f172a";
  const p = document.createElement("p"); p.textContent = msg; p.style.cssText = "margin:0 0 18px;color:#475569;font-size:14px;line-height:1.5";
  const b = document.createElement("button"); b.textContent = "Sign out"; b.style.cssText = "border:0;background:#2f5bff;color:#fff;border-radius:10px;padding:10px 18px;font-weight:600;cursor:pointer";
  b.onclick = async () => { try { await signOut(auth); } catch (e) {} location.reload(); };
  card.append(h, p, b); el.append(card);
}
