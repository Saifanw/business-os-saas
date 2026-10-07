
import{initializeApp}from"https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import{getAuth,GoogleAuthProvider,signInWithPopup,signInWithRedirect,getRedirectResult,onAuthStateChanged,signOut}from"https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import{getFirestore,collection,getDocs,getDoc,doc,query,where}from"https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
const cfg={apiKey:"AIzaSyA4GEKs3fxmiqq7iGI4-L-QuqFFwFBZ0dI",authDomain:"business-os-saas-traking.firebaseapp.com",projectId:"business-os-saas-traking",storageBucket:"business-os-saas-traking.firebasestorage.app",messagingSenderId:"316542715521",appId:"1:316542715521:web:32e84948bcc8d52ef9af80",measurementId:"G-85D45ENBLK"};
const app=initializeApp(cfg),auth=getAuth(app),db=getFirestore(app),provider=new GoogleAuthProvider();let businessId=null,businessProfile={},contacts=[],deals=[];const $=id=>document.getElementById(id);
function msg(t){$('msg').textContent=t||''}function normStatus(s){return String(s||'New').trim()}function localDateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function parseDate(v){const s=String(v||'');let m=s.match(/(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/);if(m){const months={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};const mon=months[m[2].slice(0,3).toLowerCase()];if(mon!=null)return new Date(+m[3],mon,+m[1])}m=s.match(/(\d{4})-(\d{2})-(\d{2})/);return m?new Date(+m[1],+m[2]-1,+m[3]):null}
function followDate(c){return parseDate(c.next)}function isTerminal(c){return ['Won','Paid','Lost'].includes(String(c.status||''))}function isToday(c){const d=followDate(c);return !isTerminal(c)&&! /completed/i.test(c.next||'') && d&&localDateKey(d)===localDateKey(new Date())}function isOverdue(c){const d=followDate(c);const start=new Date();start.setHours(0,0,0,0);return !isTerminal(c)&&!/completed/i.test(c.next||'')&&d&&d<start}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function pipelineStages(){return ['New','Contacted','Interested','Follow-up','Visit / Demo','Won','Lost']}
function render(){const total=contacts.length,won=contacts.filter(c=>/^(Won|Paid)$/i.test(c.status||'')).length,lost=contacts.filter(c=>/^Lost$/i.test(c.status||'')).length,today=contacts.filter(isToday).length,overdue=contacts.filter(isOverdue).length,open=contacts.filter(c=>!(/^(Won|Lost|Paid)$/i.test(c.status||''))).length;const conv=total?Math.round(won/total*100):0;$('kTotal').textContent=total;$('kWon').textContent=won;$('kLost').textContent=lost;$('kToday').textContent=today;$('kOverdue').textContent=overdue+' overdue';$('kConv').textContent=conv+'% conversion';$('kPipeline').textContent=open;
 const stages=pipelineStages();const counts=stages.map(s=>contacts.filter(c=>{const st=normStatus(c.status);return s==='Visit / Demo'?/^(Visit \/ Demo|Demo|Site Visit)$/i.test(st):st===s}).length);const max=Math.max(1,...counts);$('pipeline').innerHTML=stages.map((s,i)=>`<div class="bar-row"><span>${esc(s)}</span><div class="track"><div class="fill" style="width:${Math.round(counts[i]/max*100)}%"></div></div><b>${counts[i]}</b></div>`).join('');
 const src={};contacts.forEach(c=>{const s=c.source||'Other';src[s]=(src[s]||0)+1});const ss=Object.entries(src).sort((a,b)=>b[1]-a[1]);const sm=Math.max(1,...ss.map(x=>x[1]));$('sources').innerHTML=ss.length?ss.map(([s,n])=>`<div class="source-row"><span>${esc(s)}</span><div class="track"><div class="fill green" style="width:${Math.round(n/sm*100)}%"></div></div><b>${n}</b></div>`).join(''):'<div class="empty">No source data yet.</div>';
 $('conversion').innerHTML=`<div class="source-row"><span>Won</span><div class="track"><div class="fill green" style="width:${conv}%"></div></div><b>${won}</b></div><div class="source-row"><span>Lost</span><div class="track"><div class="fill" style="width:${total?Math.round(lost/total*100):0}%"></div></div><b>${lost}</b></div><div class="notice">${conv}% of all CRM records are currently marked Won/Paid.</div>`;
 const acts=contacts.reduce((a,c)=>a+(Array.isArray(c.events)?c.events.length:0),0);const wa=contacts.reduce((a,c)=>a+(Array.isArray(c.events)?c.events.filter(e=>/whatsapp/i.test(e.type||'')).length:0),0);const calls=contacts.reduce((a,c)=>a+(Array.isArray(c.events)?c.events.filter(e=>/call/i.test(e.type||'')).length:0),0);$('activity').innerHTML=`<div class="source-row"><span>Activities</span><div class="track"><div class="fill" style="width:${Math.min(100,acts*8)}%"></div></div><b>${acts}</b></div><div class="source-row"><span>WhatsApp</span><div class="track"><div class="fill green" style="width:${Math.min(100,wa*12)}%"></div></div><b>${wa}</b></div><div class="source-row"><span>Calls</span><div class="track"><div class="fill" style="width:${Math.min(100,calls*12)}%"></div></div><b>${calls}</b></div>`;
 const recent=[...contacts].sort((a,b)=>{const da=parseDate(a.createdAt)||new Date(0),db=parseDate(b.createdAt)||new Date(0);return db-da}).slice(0,8);$('recent').innerHTML=`<table class="table"><thead><tr><th>Customer</th><th>Source</th><th>Status</th><th>Next Follow-up</th></tr></thead><tbody>${recent.map(c=>`<tr><td><b>${esc(c.name||'Unnamed')}</b></td><td>${esc(c.source||'Other')}</td><td><span class="pill">${esc(c.status||'New')}</span></td><td>${esc(c.next||'Not set')}</td></tr>`).join('')}</tbody></table>`;
}
function exportReport(){const rows=[['Name','Source','Status','City','Requirement','Budget','Next Follow-up'],...contacts.map(c=>[c.name,c.source,c.status,c.city,c.req||c.requirement,c.budget,c.next])];const csv='\ufeff'+rows.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='business-os-report.csv';a.click();URL.revokeObjectURL(a.href)}
async function loadWorkspace(u){
  const userRef=doc(db,'users',u.uid);
  const userSnap=await getDoc(userRef);
  let assignedId=userSnap.exists()?userSnap.data()?.businessId:null;
  let businessSnap=null;

  if(assignedId){
    businessSnap=await getDoc(doc(db,'businesses',assignedId));
    if(!businessSnap.exists() || !businessSnap.data()?.name){assignedId=null;businessSnap=null;}
  }
  if(!assignedId){
    const byUid=await getDocs(query(collection(db,'businesses'),where('ownerUid','==',u.uid)));
    const byEmail=byUid.empty
      ? await getDocs(query(collection(db,'businesses'),where('ownerEmail','==',(u.email||'').toLowerCase())))
      : byUid;
    const candidates=byEmail.docs.filter(d=>d.data()?.name);
    if(candidates.length){
      const active=candidates.find(d=>String(d.data()?.status||'').toLowerCase()==='active');
      assignedId=(active||candidates[0]).id;
      businessSnap=active||candidates[0];
      await setDoc(userRef,{uid:u.uid,email:u.email||'',displayName:u.displayName||'',businessId:assignedId,businessName:businessSnap.data()?.name||'',role:'owner',templateId:businessSnap.data()?.templateId||'general',updatedAt:serverTimestamp()},{merge:true});
    }
  }
  if(!assignedId) throw new Error('No Business OS workspace is linked to this Google account. Open Customers first and complete workspace setup.');
  businessId=assignedId;
  businessProfile=businessSnap?.exists()?businessSnap.data():(await getDoc(doc(db,'businesses',businessId))).data()||{};
  $('businessName').textContent=(businessProfile.name||'Business')+' — Reports';
  $('businessSub').textContent='Leads, sources, follow-ups and conversions in one place.';
  const snap=await getDocs(collection(db,'businesses',businessId,'contacts'));
  contacts=snap.docs.map(d=>({id:d.id,...d.data()}));
  const ds=await getDocs(collection(db,'businesses',businessId,'deals'));
  deals=ds.docs.map(d=>({id:d.id,...d.data()}));
  render();$('auth').classList.add('hidden');$('app').classList.remove('hidden');
}
$('googleBtn').onclick=async()=>{try{$('googleBtn').disabled=true;msg('Redirecting to Google...');await signInWithRedirect(auth,provider)}catch(e){console.error(e);msg(e.message||'Google sign-in failed.');$('googleBtn').disabled=false}};
onAuthStateChanged(auth,async u=>{if(!u){$('auth').classList.remove('hidden');$('app').classList.add('hidden');return}try{await loadWorkspace(u)}catch(e){console.error(e);msg(e.message||'Could not load reports.');$('auth').classList.remove('hidden');$('app').classList.add('hidden')}});
try{await getRedirectResult(auth)}catch(e){console.error('Redirect sign-in error',e);msg(e.message||'Google sign-in failed.');}
