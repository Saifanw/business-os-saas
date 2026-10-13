/* BusinessOS — small, dismissible upgrade bar for Free (demo) workspaces. Loaded by assets/nav-more.js.
 * Reuses the page's own Firebase app (no second login). Shows nothing for paid plans, admins or on billing pages. */
import{getApps}from"https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import{getAuth,onAuthStateChanged}from"https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import{getFirestore,doc,getDoc,collection,getCountFromServer}from"https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
const ADMIN="saif.anwar1618@gmail.com",DAY=864e5,KEY="bosUpgradeBarHidden";
if(!/subscription|payment|admin|login|join/i.test(location.pathname))start();
function start(){let tries=0;const t=setInterval(()=>{const app=getApps()[0];if(app){clearInterval(t);run(app)}else if(++tries>40)clearInterval(t)},250)}
function run(app){const auth=getAuth(app),db=getFirestore(app);
  onAuthStateChanged(auth,async u=>{if(!u||String(u.email||"").toLowerCase()===ADMIN)return;
    try{let id=u.uid;const us=await getDoc(doc(db,"users",u.uid));if(us.exists()&&us.data().businessId)id=us.data().businessId;
      let b={};try{const s=await getDoc(doc(db,"businesses",id));if(s.exists())b=s.data()}catch(e){}
      const raw=String(b.plan||"trial").toLowerCase(),free=["trial","free",""].includes(raw);
      let msg="",tone="info",full=false;
      if(free){let used=0;try{used=(await getCountFromServer(collection(db,"businesses",id,"contacts"))).data().count}catch(e){}
        const lim=Math.max(1,Number(b.recordLimit??10)+Number(b.topupRecords||0));full=used>=lim;
        msg=full?`<b>Free demo limit reached</b> (${used} of ${lim} records). Upgrade to keep adding customers.`:`You're on the <b>Free demo</b> · ${used} of ${lim} records used. Upgrade for more records and team members.`;tone=full||used>=lim-2?"warn":"info"}
      else if(b.subscriptionEndsAt){const d=Math.round((new Date(b.subscriptionEndsAt+"T00:00:00")-new Date(new Date().toDateString()))/DAY);
        if(d<=5){msg=d<0?`<b>Your plan expired</b> ${-d} day${-d===1?"":"s"} ago.`:`<b>Your plan expires in ${d} day${d===1?"":"s"}.</b>`;tone="warn";full=d<0}}
      if(!msg)return;
      try{const h=Number(localStorage.getItem(KEY)||0);if(!full&&Date.now()-h<DAY)return}catch(e){}
      show(msg,tone,full,free)}catch(e){console.warn("upgrade bar skipped",e)}})}
function show(msg,tone,full,free){if(document.getElementById("bosUpBar"))return;const w=document.createElement("div");w.id="bosUpBar";
  const warn=tone==="warn";w.style.cssText=`display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;padding:7px 14px;font:500 13px/1.4 Inter,system-ui,sans-serif;background:${warn?"#fff7ed":"#ecfdf5"};color:${warn?"#9a3412":"#065f46"};border-bottom:1px solid ${warn?"#fed7aa":"#a7f3d0"}`;
  w.innerHTML=`<span>${msg}</span><a href="subscription.html" style="background:#16a34a;color:#fff;text-decoration:none;font-weight:700;padding:5px 14px;border-radius:8px;white-space:nowrap">${free?"Upgrade":"Renew"}</a>${full?"":'<button type="button" aria-label="Hide for today" style="border:0;background:transparent;color:inherit;font-size:18px;line-height:1;cursor:pointer;opacity:.6">×</button>'}`;
  const x=w.querySelector("button");if(x)x.onclick=()=>{try{localStorage.setItem(KEY,String(Date.now()))}catch(e){}w.remove()};
  document.body.prepend(w)}
