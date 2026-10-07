
import{initializeApp}from"https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import{getAuth,GoogleAuthProvider,signInWithPopup,signInWithRedirect,getRedirectResult,onAuthStateChanged,signOut}from"https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import{getFirestore,collection,addDoc,updateDoc,deleteDoc,doc,getDocs,query,orderBy,onSnapshot,serverTimestamp,writeBatch,setDoc,getDoc,where}from"https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
const cfg={apiKey:"AIzaSyA4GEKs3fxmiqq7iGI4-L-QuqFFwFBZ0dI",authDomain:"business-os-saas-traking.firebaseapp.com",projectId:"business-os-saas-traking",storageBucket:"business-os-saas-traking.firebasestorage.app",messagingSenderId:"316542715521",appId:"1:316542715521:web:32e84948bcc8d52ef9af80",measurementId:"G-85D45ENBLK"};
const app=initializeApp(cfg),auth=getAuth(app),db=getFirestore(app),provider=new GoogleAuthProvider();
let customers=[],publicLeads=[],selectedId=null,atype="Call",unsub=null,unsubPublicLeads=null,currentUser=null,businessId=null,businessProfile=null;
const $=id=>document.getElementById(id), ini=n=>String(n||"?").trim().split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase(), esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
function toast(msg,error=false){$("toast").textContent=msg;$("toast").classList.remove("hidden","toast-error");if(error)$("toast").classList.add("toast-error");setTimeout(()=>$("toast").classList.add("hidden"),2400)}
function todayISO(){return new Date().toISOString().slice(0,10)}
function normalizePhone(v){return String(v||"").replace(/\D/g,"").replace(/^91(?=\d{10}$)/,"")}
function dateText(d,t){if(!d)return"Not set";const dt=new Date(d+"T00:00:00");return dt.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})+" · "+(t||"—")}
function safeStatus(s){return String(s||"New").toLowerCase().replace(/\s+/g,"-")}
function resetFilters(){["search"].forEach(id=>$(id).value="");["area","type","statusFilter","sourceFilter","followFilter"].forEach(id=>$(id).value="");render()}
function buildAreas(){const sel=$("area"),current=sel.value;const vals=[...new Set(customers.map(c=>c.area).filter(Boolean))].sort();sel.innerHTML='<option value="">All Cities / Areas</option>'+vals.map(v=>`<option>${esc(v)}</option>`).join("");sel.value=vals.includes(current)?current:""}
function currentTemplate(){return getBusinessTemplate((businessProfile&&businessProfile.templateId)||'general')}
function navView(section){
  const dash=document.getElementById('dashboardV2');
  const summary=document.getElementById('summary');
  const pipeline=document.getElementById('templatePipeline');
  const list=document.getElementById('customerList');
  const wa=document.getElementById('whatsappCenter');
  const showDash=section==='overview';
  if(wa)wa.classList.toggle('view-hidden',section!=='whatsapp');
  if(dash)dash.classList.toggle('view-hidden',!showDash);
  [summary,pipeline,list].forEach(el=>{if(el)el.classList.toggle('view-hidden',showDash)});
}
function osNav(el,section){
  document.querySelectorAll('.os-side-link').forEach(x=>x.classList.remove('active'));
  if(el)el.classList.add('active');
  navView(section);
  if(section==='overview'){window.scrollTo({top:0,behavior:'smooth'});return false}
  if(section==='customers'){clearDashFilter();window.scrollTo({top:0,behavior:'smooth'});return false}
  if(section==='followups'){setFollowFilter('today');window.scrollTo({top:0,behavior:'smooth'});return false}
  if(section==='deals'){setStageFilter('Won');window.scrollTo({top:0,behavior:'smooth'});return false}
  if(section==='website'){navView('overview');document.getElementById('websiteLeads')?.scrollIntoView({behavior:'smooth',block:'center'});return false}
  if(section==='whatsapp'){navView('whatsapp');document.getElementById('whatsappCenter')?.scrollIntoView({behavior:'smooth',block:'start'});renderWhatsAppCenter();return false}
  return false;
}
function parseNextDate(value){
  const raw=String(value||'').trim();
  if(!raw || /not set|completed/i.test(raw)) return null;
  const m=raw.match(/(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/);
  if(!m)return null;
  const months={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
  const mon=months[m[2].slice(0,3).toLowerCase()];
  if(mon==null)return null;
  const d=new Date(Number(m[3]),mon,Number(m[1]));
  return Number.isNaN(d.getTime())?null:d;
}
function dateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function isTerminal(c){return ['Won','Paid','Lost'].includes(String(c.status||''));}
function isCompletedFollowUp(c){return /completed/i.test(String(c.next||''));}
function followStats(){
  const now=new Date(); const todayKey=dateKey(now); const dayStart=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  let today=0,overdue=0,upcoming=0;
  customers.forEach(c=>{if(isTerminal(c)||isCompletedFollowUp(c))return; const d=parseNextDate(c.next); if(!d)return; const k=dateKey(d); if(k===todayKey)today++; else if(d<dayStart)overdue++; else if(d>dayStart)upcoming++;});
  return {today,overdue,upcoming};
}
function updateSideCounts(){const fs=followStats();const deals=customers.filter(c=>['Won','Paid'].includes(c.status)).length;const f=document.getElementById('sideFollowCount'),d=document.getElementById('sideDealCount');if(f)f.textContent=fs.today+fs.overdue;if(d)d.textContent=deals}
function applyTemplateUI(){
  const t=currentTemplate();
  const typeLabel=t.id==='property'?'Lead Type':t.id==='coaching'?'Student Type':'Contact Type';
  const title=t.id==='property'?'All Property Leads':t.id==='coaching'?'All Students / Enquiries':'All Customers / Leads';
  const sub=t.id==='property'?'Manage buyers, sellers, site visits and property follow-ups.':t.id==='coaching'?'Manage students, counselling, demo classes and admissions.':'Manage customers, requirements and follow-ups.';
  const set=(id,val)=>{const el=$(id);if(el)el.textContent=val};
  set('tableTypeLabel',typeLabel); set('listTitle',title); set('listSubtitle',sub);
  set('reqLabel',t.fields?.requirement||'Requirement'); set('budgetLabel',t.fields?.budget||'Budget');
  set('locationLabel',t.fields?.location||'Area'); set('followLabel',t.fields?.visit||'Follow-up date');
  set('businessTypeLabel',t.id==='property'?'Property Type':t.id==='coaching'?'Education / Course':'Business Type');
  set('contactTypeLabel',typeLabel);
  const typeSel=$('fType'); if(typeSel){typeSel.innerHTML=(t.contactTypes||['Customer']).map(x=>`<option>${x}</option>`).join('');}
  const statusSel=$('fStatus'); if(statusSel){statusSel.innerHTML=t.stages.filter(x=>!['Lost'].includes(x)).map(x=>`<option>${x}</option>`).join('');}
  const filter=$('statusFilter'); if(filter){filter.innerHTML='<option value="">All Statuses</option>'+t.stages.map(x=>`<option>${x}</option>`).join('')+'<option>Overdue</option>';}
  updatePipeline(t);
  const head=document.querySelector('.page-head h1'); if(head) head.innerHTML=`${t.icon} ${businessProfile?.name||'Your Business'} <span class="workspace-badge">${t.name}</span>`;
}

function updatePipeline(t=currentTemplate()){
  const pipe=$('templatePipeline');
  if(!pipe)return;
  const selected=$('statusFilter')?.value||'';
  pipe.innerHTML=t.stages.map((stage,i)=>{const n=customers.filter(c=>String(c.status||'')===stage).length;return `<button type="button" class="stage ${selected===stage?'active':''}" onclick="stagePick('${esc(stage)}')"><b>${i+1}</b>${esc(stage)}<em>${n}</em></button>`}).join('');
}
function stagePick(stage){
  const filter=$('statusFilter');
  if(!filter)return;
  filter.value=stage||'';
  render();
  document.querySelector('.list-card')?.scrollIntoView({behavior:'smooth',block:'start'});
}
function clearDashFilter(){
  const sf=$('statusFilter'),ff=$('followFilter'); if(sf)sf.value=''; if(ff)ff.value=''; render();
}
function setStageFilter(stage){ const sf=$('statusFilter'); if(sf){sf.value=stage; render(); document.querySelector('.list-card')?.scrollIntoView({behavior:'smooth',block:'start'});} }
function setFollowFilter(mode){ const ff=$('followFilter'); if(ff){ff.value=mode; render(); document.querySelector('.list-card')?.scrollIntoView({behavior:'smooth',block:'start'});} }
function leadFormUrl(){
  const base=new URL('lead-capture.html',window.location.href);
  base.searchParams.set('business',businessId||'');
  base.searchParams.set('template',businessProfile?.templateId||'general');
  base.searchParams.set('businessName',businessProfile?.name||'Business');
  return base.href;
}
function renderWebsiteLeads(){
  const list=$('webLeadsList'), count=$('sideWebLeadCount'), link=$('leadFormLink');
  const active=publicLeads.filter(x=>x.status!=='converted');
  if(count)count.textContent=active.length;
  if(link)link.href=leadFormUrl();
  if(!list)return;
  if(!active.length){list.innerHTML='<div class="web-lead-empty">No website enquiries yet. Share the lead form link with your website or customers.</div>';return}
  list.innerHTML=active.slice(0,8).map(l=>`<div class="web-lead-item"><div class="web-lead-main"><b>${esc(l.name||'Website visitor')}</b><small>${esc(l.phone||'No mobile')} · ${esc(l.requirement||'New enquiry')} · ${esc(l.city||'')}</small></div><div class="web-lead-actions"><button onclick="leadCall('${l.id}')">Call</button><button class="convert" onclick="convertPublicLead('${l.id}')">Add to Leads</button></div></div>`).join('');
}
function leadCall(id){const l=publicLeads.find(x=>x.id===id);if(l?.phone)window.location.href='tel:'+normalizePhone(l.phone);else toast('No mobile number',true)}
async function copyLeadFormLink(){try{await navigator.clipboard.writeText(leadFormUrl());toast('Website lead form link copied')}catch(e){toast('Copy failed — use Open Lead Form',true)}}
async function convertPublicLead(id){
  const l=publicLeads.find(x=>x.id===id); if(!l||l.status==='converted')return;
  const t=currentTemplate();
  const data={name:l.name||'Website Lead',phone:l.phone||'',phoneNormalized:normalizePhone(l.phone||''),email:l.email||'',businessName:'',businessType:businessProfile?.businessType||t.businessTypes?.[0]||'Other',type:t.contactTypes?.[0]||'Customer',requirement:l.requirement||'Website enquiry',req:l.requirement||'Website enquiry',detail:l.message||'',city:l.city||businessProfile?.city||'Jaipur',area:l.area||'',budget:l.budget||'',status:t.stages?.[0]||'New',source:'Website',notes:l.message||'',note:l.message||'',next:'Not set',last:'Website enquiry',events:[{date:new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})+' · Now',type:'Website Lead Imported',note:'Converted from public website lead form.'}],createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
  try{const ref=await addDoc(collection(db,'businesses',businessId,'contacts'),data);await updateDoc(doc(db,'publicLeads',id),{status:'converted',convertedContactId:ref.id,convertedAt:serverTimestamp()});toast('Website lead added to Customers');}catch(e){toast(e.message||'Could not convert website lead',true)}
}
function subscribePublicLeads(){
  if(unsubPublicLeads)unsubPublicLeads();
  const q=query(collection(db,'publicLeads'),where('businessId','==',businessId));
  unsubPublicLeads=onSnapshot(q,snap=>{publicLeads=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>((b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)));renderWebsiteLeads()},err=>{console.error('Website leads error',err);renderWebsiteLeads();});
}

function renderDashboard(){
  const total=customers.length;
  const fs=followStats();
  const today=fs.today, overdue=fs.overdue;
  const hot=customers.filter(c=>['Interested','Follow-up','Site Visit','Negotiation'].includes(c.status)).length;
  const won=customers.filter(c=>['Won','Paid'].includes(c.status)).length;
  const rate=total?Math.round((won/total)*100):0;
  const set=(id,v)=>{const el=$(id);if(el)el.textContent=v};
  set('dashTotal',total); set('dashToday',today); set('dashOverdue',overdue); set('dashHot',hot); set('dashWon',won); set('dashWonRate',rate+'% conversion'); set('dashPipelineTotal',total+' leads');
  const t=currentTemplate(); const stages=t.stages||[]; const pipe=$('dashPipeline');
  if(pipe)pipe.innerHTML=stages.map(stage=>{const n=customers.filter(c=>String(c.status||'')===stage).length;return `<button class="dash-stage" type="button" onclick="setStageFilter('${esc(stage)}')"><small><span class="stage-dot"></span>${esc(stage)}</small><b>${n}</b></button>`}).join('');
  const needs=customers.filter(c=>{const d=parseNextDate(c.next);return c.status==='Overdue'||(d&&dateKey(d)===dateKey(new Date()))}).sort((a,b)=>String(a.next||'').localeCompare(String(b.next||''))).slice(0,5);
  const box=$('dashAttention');
  if(box)box.innerHTML=needs.length?needs.map(c=>{const isOver=c.status==='Overdue'||(parseNextDate(c.next)&&parseNextDate(c.next)<new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate()));return `<button class="attention-item" type="button" onclick="selectCustomer('${c.id}')"><span class="attention-main"><b>${esc(c.name)}</b><small>${esc(c.status||'New')} · ${esc(c.next||'Follow-up needed')}</small></span><span class="attention-badge ${isOver?'overdue':'today'}">${isOver?'OVERDUE':'TODAY'}</span></button>`}).join(''):'<div class="attention-empty">No urgent follow-ups. You are all caught up.</div>';
  const recent=[...customers].sort((a,b)=>String(b.updatedAt?.seconds||b.createdAt?.seconds||0)-String(a.updatedAt?.seconds||a.createdAt?.seconds||0)).slice(0,5);
  const rb=$('dashRecent');
  if(rb)rb.innerHTML=recent.length?recent.map(c=>{const wonish=['Won','Paid'].includes(c.status);return `<button class="attention-item" type="button" onclick="selectCustomer('${c.id}')"><span class="attention-main"><b>${esc(c.name)}</b><small>${esc(c.status||'New')} · ${esc(c.source||'Manual Entry')}</small></span><span class="attention-badge ${wonish?'today':''}">${wonish?'DEAL':'LEAD'}</span></button>`}).join(''):'<div class="attention-empty">No leads yet.</div>';
  renderWebsiteLeads(); renderWhatsAppCenter();
}


function render(){
 buildAreas();updatePipeline();const q=$("search").value.toLowerCase(),ar=$("area").value,tp=$("type").value,sf=$("statusFilter").value,src=$("sourceFilter").value,ff=$("followFilter").value;
 const now=new Date(),dayStart=new Date(now.getFullYear(),now.getMonth(),now.getDate());
 const arr=customers.filter(c=>{const hay=[c.name,c.phone,c.businessName,c.area,c.city,c.req,c.detail,c.budget,c.status,c.note,c.source,c.businessType].join(" ").toLowerCase();const d=parseNextDate(c.next);if(q&&!hay.includes(q))return false;if(ar&&c.area!==ar)return false;if(tp&&String(c.type||"Customer")!==tp)return false;if(sf&&c.status!==sf)return false;if(src&&String(c.source||"Other")!==src)return false;if(ff==="today"&&(isTerminal(c)||isCompletedFollowUp(c)||!d||dateKey(d)!==dateKey(now)))return false;if(ff==="overdue"&&(isTerminal(c)||isCompletedFollowUp(c)||!d||d>=dayStart)&&c.status!=="Overdue")return false;if(ff==="upcoming"&&(isTerminal(c)||isCompletedFollowUp(c)||!d||d<=dayStart))return false;return true});
 const fs=followStats();
 $("total").textContent=customers.length;$("today").textContent=fs.today;$("hot").textContent=customers.filter(c=>["Interested","Follow-up","Site Visit","Negotiation"].includes(c.status)).length;$("overdue").textContent=fs.overdue;$("count").textContent=arr.length+" records";
 $("rows").innerHTML=arr.length?arr.map(c=>{const overdue=c.status==="Overdue",businessType=c.businessType||"Other",source=c.source||"Other",follow=String(c.next||"Not set"),parts=follow.split(" · ");return `<div class="row" onclick="selectCustomer('${c.id}')"><div class="check"><input type="checkbox" onclick="event.stopPropagation()" aria-label="Select ${esc(c.name)}"></div><div class="contact-cell"><div class="avatar">${ini(c.name)}</div><div class="contact-main"><b>${esc(c.name)}</b><small>${esc(c.name)} · ${esc(c.phone||"No mobile")}</small></div></div><div><span class="type-pill ${String(c.type||"Customer").toLowerCase()}">${esc(c.type||"Customer")}</span></div><div class="data-cell"><b>${esc(c.area||"—")}</b><small>${esc(c.city||"—")}</small></div><div class="source-cell">${esc(source)}</div><div><span class="status ${safeStatus(c.status)}">${esc(c.status||"New")}</span></div><div class="follow-cell ${overdue?"overdue":""}"><b>${esc(parts[0]||"—")}</b><small>${esc(parts.slice(1).join(" · ")||"Set follow-up")}</small></div><div class="actions"><button class="wa" title="WhatsApp" onclick="event.stopPropagation();wa('${c.id}')">◉</button><button title="Email" onclick="event.stopPropagation();email('${c.id}')">✉</button><button title="More" onclick="event.stopPropagation();selectCustomer('${c.id}')">•••</button></div></div>`}).join(""):'<div class="empty-state"><b>No customers found</b>Add your first customer or import your existing CSV/Excel list.</div>';
  renderDashboard(); updateSideCounts();
}
async function selectCustomer(id){selectedId=id;const c=customers.find(x=>x.id===id);if(!c)return;renderProfile(c);$("profileOverlay").classList.add("show")}
function renderProfile(c){
  const events=Array.isArray(c.events)?c.events:[];
  const stages=currentTemplate().stages||[];
  const stageOptions=stages.map(stage=>'<option '+(stage===(c.status||'')?'selected':'')+'>'+esc(stage)+'</option>').join('');
  const dealBadge=['Won','Paid'].includes(c.status)?'<span class="deal-badge">✓ Converted to Deal / Admission</span>':'';
  const lastEvent=events.length?(events[events.length-1]?.type||'Activity')+': '+(events[events.length-1]?.note||''):'No activity recorded yet.';
  $("profileModalContent").innerHTML=`
    <div class="profile-card">
      <div class="profile-top">
        <button class="close-profile" onclick="closeProfile()">×</button>
        <div class="profile-person">
          <div class="avatar">${ini(c.name)}</div>
          <div><h2>${esc(c.name)}</h2><p>${esc(c.area||'')}, ${esc(c.city||'')} · <span class="status ${safeStatus(c.status)}">${esc(c.status||'New')}</span></p></div>
        </div>
        <div class="profile-actions">
          <button onclick="call('${c.id}')">☎ Call</button>
          <button class="wa" onclick="wa('${c.id}')">◉ WhatsApp</button>
          <button onclick="email('${c.id}')">✉ Email</button>
        </div>
      </div>
      <div class="profile-section"><h3>CUSTOMER DETAILS</h3><div class="facts">
        <div class="fact"><small>Mobile</small><b>${esc(c.phone||'Not added')}</b></div>
        <div class="fact"><small>Requirement</small><b>${esc(c.req||'Not specified')}</b></div>
        <div class="fact"><small>Budget / Value</small><b>${esc(c.budget||'Not specified')}</b></div>
        <div class="fact"><small>Location</small><b>${esc(c.area||'—')}, ${esc(c.city||'—')}</b></div>
        <div class="fact"><small>Source</small><b>${esc(c.source||'Other')}</b></div>
        <div class="fact"><small>Last Contact</small><b>${esc(c.last||'—')}</b></div>
      </div></div>
      <div class="profile-section"><h3>PIPELINE</h3>
        <div class="pipeline-control"><select id="profileStageSelect">${stageOptions}</select><button onclick="changeStage()">Update Stage</button></div>
        ${dealBadge}
      </div>
      <div class="profile-section"><h3>NEXT ACTION</h3>
        <div class="next"><b>${c.status==='Overdue'?'🔴':'📅'} ${esc(c.next||'Not set')}</b><small>Next step for this customer</small>
          <div class="next-actions"><button onclick="wa('${c.id}')">WhatsApp</button><button class="done" onclick="markDone()">✓ Mark done</button></div>
        </div>
        <button class="add-activity" onclick="openActivityModal()">＋ Add Activity</button>
      </div>
      <div class="profile-section"><h3>RECENT CONTACT</h3>
        <div class="next"><b>🕒 ${esc(c.last||'No contact')}</b><small>${esc(lastEvent)}</small>
          <div class="next-actions"><button onclick="openActivityModal()">＋ Add note</button><button onclick="openActivityModal()">＋ Activity</button></div>
        </div>
      </div>
      <div class="profile-section"><h3>IMPORTANT NOTE</h3>
        <div class="next" style="background:#f8f7ff;border-color:#ded8ff"><b>📝 Keep for next follow-up</b><small>${esc(c.note||'No important note added yet.')}</small></div>
      </div>
      <div class="profile-section" style="display:flex;justify-content:flex-end;gap:8px">
        <button onclick="editCustomer()" style="border:1px solid #dfe4eb;background:#fff;border-radius:8px;padding:9px 13px;font-size:9px;font-weight:800">✎ Edit</button>
        <button onclick="deleteCustomer()" style="border:1px solid #ffd1cf;background:#fff4f3;color:#c33b34;border-radius:8px;padding:9px 13px;font-size:9px;font-weight:800">Delete Customer</button>
      </div>
    </div>`;
}
function closeProfile(){$("profileOverlay").classList.remove("show")}
function openCustomerModal(){$("customerModal").dataset.editId="";applyTemplateUI();["fName","fPhone","fReq","fBudget","fArea","fNotes"].forEach(id=>$(id).value="");$("fCity").value=businessProfile?.city||"Jaipur";$("fStatus").value=currentTemplate().stages[0]||"New";$("fType").value=currentTemplate().contactTypes?.[0]||"Customer";$("fBusinessType").value=businessProfile?.businessType||currentTemplate().businessTypes?.[0]||"Other";$("fSource").value="Manual Entry";$("fDate").value=todayISO();$("fTime").value="15:30";$("customerModal").classList.add("show")}
function closeCustomerModal(){$("customerModal").classList.remove("show")}
async function saveCustomer(){
  const name=$("fName").value.trim(); if(!name){toast("Customer name is required",true);return}
  const phone=$("fPhone").value.trim(),norm=normalizePhone(phone),editId=$("customerModal").dataset.editId||"";
  if(norm&&customers.some(c=>c.id!==editId&&normalizePhone(c.phone)===norm)){toast("Customer already exists with this mobile",true);return}
  const d=$("fDate").value,t=$("fTime").value;
  const patch={name,phone,phoneNormalized:norm,businessName:"",businessType:$("fBusinessType").value,type:$("fType").value,requirement:$("fReq").value.trim(),req:$("fReq").value.trim(),city:$("fCity").value.trim()||"Jaipur",area:$("fArea").value.trim()||"",budget:$("fBudget").value.trim(),status:$("fStatus").value,source:$("fSource").value,note:$("fNotes").value.trim(),notes:$("fNotes").value.trim(),updatedAt:serverTimestamp()};
  if(d) patch.next=dateText(d,t);
  try{
    if(editId){await updateDoc(doc(db,"businesses",businessId,"contacts",editId),patch);$("customerModal").dataset.editId="";closeCustomerModal();toast("Customer updated");await selectCustomer(editId);}
    else{patch.detail="";patch.last="—";patch.next=patch.next||"Not set";patch.events=[{date:new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})+" · "+(t||"Now"),type:"Enquiry Created",note:$("fNotes").value.trim()||"Customer added."}];patch.createdAt=serverTimestamp();const ref=await addDoc(collection(db,"businesses",businessId,"contacts"),patch);closeCustomerModal();toast("Customer saved");await selectCustomer(ref.id);}
  }catch(e){toast(e.message||"Could not save customer",true)}
}
function editCustomer(){const c=customers.find(x=>x.id===selectedId);if(!c)return;$("fName").value=c.name||"";$("fPhone").value=c.phone||"";$("fReq").value=c.req||c.requirement||"";$("fBudget").value=c.budget||"";$("fArea").value=c.area||"";$("fCity").value=c.city||"Jaipur";$("fStatus").value=c.status||"New";$("fType").value=c.type||"Customer";$("fBusinessType").value=c.businessType||"Real Estate";$("fSource").value=c.source||"Other";$("fNotes").value=c.note||c.notes||"";$("fDate").value="";$("fTime").value="";$("customerModal").classList.add("show");$("customerModal").dataset.editId=c.id}
async function deleteCustomer(){const c=customers.find(x=>x.id===selectedId);if(!c||!confirm("Delete "+c.name+"? This will remove the contact from your business workspace."))return;try{await deleteDoc(doc(db,"businesses",businessId,"contacts",c.id));closeProfile();toast("Customer deleted")}catch(e){toast(e.message||"Delete failed",true)}}
function openActivityModal(){$("modal").classList.add("show");$("adate").value=todayISO();$("atime").value=new Date().toTimeString().slice(0,5);$("anote").value="";typePick(document.querySelector('[data-type="Call"]'))}
function closeModal(){$("modal").classList.remove("show")}
function typePick(el){atype=el.dataset.type;document.querySelectorAll(".types button").forEach(b=>b.classList.toggle("active",b===el))}
async function changeStage(){
  const c=customers.find(x=>x.id===selectedId);
  const sel=$("profileStageSelect");
  if(!c || !sel) return;
  const nextStage=sel.value;
  const previousStage=c.status||"New";
  if(nextStage===previousStage){toast("Stage is already "+nextStage);return}
  const events=Array.isArray(c.events)?[...c.events]:[];
  events.push({
    date:new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})+" · Now",
    type:"Pipeline Stage Updated",
    note:previousStage+" → "+nextStage
  });
  try{
    await updateDoc(doc(db,"businesses",businessId,"contacts",c.id),{
      status:nextStage,
      events,
      updatedAt:serverTimestamp()
    });

    // Won/Paid contacts become a deal/admission record.
    if(["Won","Paid"].includes(nextStage)){
      await setDoc(
        doc(db,"businesses",businessId,"deals",c.id),
        {
          contactId:c.id,
          customerId:c.id,
          customerName:c.name||"",
          businessType:c.businessType||"",
          type:c.type||"Customer",
          value:c.budget||"",
          stage:nextStage,
          status:"won",
          source:c.source||"",
          location:(c.area?c.area+", ":"")+ (c.city||""),
          updatedAt:serverTimestamp(),
          createdAt:c.createdAt||serverTimestamp()
        },
        {merge:true}
      );
    }

    toast("Stage updated: "+nextStage);
    await selectCustomer(c.id);
  }catch(e){
    console.error("Stage update failed",e);
    toast(e.message||"Could not update stage",true);
  }
}

async function saveActivity(){const c=customers.find(x=>x.id===selectedId);if(!c)return;const d=$("adate").value,t=$("atime").value,n=$("anote").value.trim()||"Activity added.";const events=Array.isArray(c.events)?[...c.events]:[];events.push({date:dateText(d,t),type:atype,note:n});const patch={events,note:n,updatedAt:serverTimestamp()};if(atype==="Deal Won")patch.status="Won";if(atype==="Site Visit")patch.status="Site Visit";if(atype==="Follow-up"){patch.status="Follow-up";patch.next=dateText(d,t);}if(atype==="Call"||atype==="WhatsApp"||atype==="Email"||atype==="Meeting")patch.last=dateText(d,t);try{await updateDoc(doc(db,"businesses",businessId,"contacts",c.id),patch);closeModal();toast(atype==="Follow-up"?"Follow-up scheduled":"Activity saved");await selectCustomer(c.id)}catch(e){toast(e.message||"Could not save activity",true)}}
async function markDone(){const c=customers.find(x=>x.id===selectedId);if(!c)return;const events=Array.isArray(c.events)?[...c.events]:[];events.push({date:new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})+" · Now",type:"Follow-up completed",note:"Next action marked complete."});try{await updateDoc(doc(db,"businesses",businessId,"contacts",c.id),{events,next:"Completed",last:new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}),updatedAt:serverTimestamp()});toast("Follow-up completed")}catch(e){toast(e.message||"Could not update follow-up",true)}}
function call(id){const c=customers.find(x=>x.id===id);if(c?.phone)window.location.href="tel:"+normalizePhone(c.phone);else toast("No mobile number",true)}
function waMessage(c){
  const t=currentTemplate(); const name=c.name||'there'; const req=c.req||c.requirement||'your enquiry';
  const stage=c.status||'New';
  if(t.id==='property') return `Hello ${name} ji, aapne ${req} ke regarding enquiry ki thi. Aapki requirement aur budget ke hisaab se options share kar sakte hain. Kya abhi baat karna convenient hai?`;
  if(t.id==='coaching') return `Hello ${name} ji, aapne ${req} ke regarding enquiry ki thi. Aapko course, fees ya demo class ke baare mein information chahiye ho to batayein. Kya aaj baat kar sakte hain?`;
  if(stage==='Won'||stage==='Paid') return `Hello ${name} ji, thank you for choosing us. Aapke next steps ke liye agar kisi help ki zarurat ho to message kijiye.`;
  return `Hello ${name} ji, aapne ${req} ke regarding enquiry ki thi. Main aapka follow-up kar raha hoon. Kya abhi baat karna convenient hai?`;
}
function openWaFor(c){
  if(!c?.phone){toast('No mobile number',true);return;}
  const url='https://wa.me/'+normalizePhone(c.phone)+'?text='+encodeURIComponent(waMessage(c));
  window.open(url,'_blank','noopener');
  const events=Array.isArray(c.events)?[...c.events]:[]; events.push({date:new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})+' · Now',type:'WhatsApp opened',note:'Contextual WhatsApp follow-up opened from Business OS.'});
  updateDoc(doc(db,'businesses',businessId,'contacts',c.id),{events,last:'WhatsApp opened',updatedAt:serverTimestamp()}).catch(()=>{});
}
function renderWhatsAppCenter(){
  const ready=customers.filter(c=>normalizePhone(c.phone));
  const hot=customers.filter(c=>['Interested','Follow-up','Site Visit','Negotiation'].includes(c.status));
  const fs=followStats(); const set=(id,v)=>{const e=$(id);if(e)e.textContent=v}; set('waReadyCount',ready.length);set('waHotCount',hot.length);set('waTodayCount',fs.today);set('sideWaCount',ready.length);
  const box=$('waCenterList'); if(!box)return;
  const ordered=[...customers].sort((a,b)=>{const ah=['Interested','Follow-up','Site Visit','Negotiation'].includes(a.status)?0:1,bh=['Interested','Follow-up','Site Visit','Negotiation'].includes(b.status)?0:1;return ah-bh}).slice(0,12);
  box.innerHTML=ordered.length?ordered.map(c=>`<div class="wa-center-item"><div class="wa-center-main"><b>${esc(c.name)}</b><small>${esc(c.status||'New')} · ${esc(c.req||c.requirement||'No requirement')} · ${esc(c.phone||'No mobile')}</small></div><div class="wa-center-actions"><button onclick="selectCustomer('${c.id}')">View</button><button class="wa-open" onclick="openWaFor(customers.find(x=>x.id==='${c.id}'))">💬 WhatsApp</button></div></div>`).join(''):'<div class="wa-center-empty">No customers yet. Add a customer with a mobile number to start WhatsApp follow-ups.</div>';
}
function waBroadcastHint(){toast('Use individual contextual messages first. Bulk WhatsApp automation will require WhatsApp Business API approval.')}
function wa(id){const c=customers.find(x=>x.id===id);if(!c)return;openWaFor(c)}
function email(){toast("Email integration is the next communication phase")}
function exportCSV(){const headers=["Name","Mobile","Business Type","Contact Type","City","Area","Requirement","Budget","Status","Source","Next Follow-up","Last Contact"];const lines=[headers.join(",")].concat(customers.map(c=>[c.name,c.phone,c.businessType,c.type,c.city,c.area,c.req,c.budget,c.status,c.source,c.next,c.last].map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(",")));const blob=new Blob(["\ufeff"+lines.join("\n")],{type:"text/csv;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="business-os-customers.csv";a.click();URL.revokeObjectURL(a.href);toast("Export ready")}
async function importCSV(e){const file=e.target.files[0];if(!file)return;try{let rows=[];if(/\.xlsx?$/i.test(file.name)){const data=await file.arrayBuffer(),wb=XLSX.read(data,{type:"array"}),ws=wb.Sheets[wb.SheetNames[0]];rows=XLSX.utils.sheet_to_json(ws,{defval:""})}else{const text=await file.text();rows=parseCSV(text)}if(!rows.length){toast("No customer rows found",true);return}const batch=writeBatch(db),existing=new Set(customers.map(c=>normalizePhone(c.phone)).filter(Boolean));let added=0,dupes=0;for(const r of rows){const name=String(r.Name||r.name||"").trim();if(!name)continue;const phone=String(r.Mobile||r.mobile||"").trim(),norm=normalizePhone(phone);if(norm&&existing.has(norm)){dupes++;continue}const ref=doc(collection(db,"businesses",businessId,"contacts"));batch.set(ref,{name,phone,phoneNormalized:norm,businessName:String(r.Business||r.businessName||""),businessType:String(r["Business Type"]||r.businessType||"Other"),type:String(r.Type||r["Contact Type"]||"Customer"),city:String(r.City||"Jaipur"),area:String(r.Area||""),req:String(r.Requirement||r.requirement||"New enquiry"),requirement:String(r.Requirement||r.requirement||"New enquiry"),detail:String(r.Detail||""),budget:String(r.Budget||""),status:String(r.Status||"New"),source:String(r.Source||"Excel Import"),next:String(r["Next Follow-up"]||r.Followup||"Not set"),last:String(r["Last Contact"]||"Imported"),note:"Imported customer. Add an important note after the first contact.",events:[{date:"Imported",type:"Customer Imported",note:"Imported from CSV/Excel."}],createdAt:serverTimestamp(),updatedAt:serverTimestamp()});if(norm)existing.add(norm);added++}if(added)await batch.commit();toast(added+" imported · "+dupes+" duplicates skipped")}catch(e){toast(e.message||"Import failed",true)}finally{e.target.value=""}}
function parseCSV(text){const lines=text.replace(/^\ufeff/,"").split(/\r?\n/).filter(Boolean);if(lines.length<2)return[];const parse=line=>{const out=[];let cur="",q=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'&&line[i+1]==='"'){cur+='"';i++;continue}if(ch==='"'){q=!q;continue}if(ch===','&&!q){out.push(cur);cur="";continue}cur+=ch}out.push(cur);return out};const h=parse(lines[0]);return lines.slice(1).map(line=>{const v=parse(line),o={};h.forEach((k,i)=>o[k.trim()]=v[i]||"");return o})}
async function logout(){await signOut(auth)}
async function ensureWorkspace(u){
  const userRef=doc(db,'users',u.uid);
  const existingUser=await getDoc(userRef);
  let assignedId=existingUser.exists()?existingUser.data()?.businessId:null;

  // IMPORTANT: preserve an existing business/workspace if the user document
  // was accidentally pointed at a different/empty workspace.
  // First validate the assigned business; then recover by ownerUid/email.
  let assignedSnap=null;
  if(assignedId){
    assignedSnap=await getDoc(doc(db,'businesses',assignedId));
    if(!assignedSnap.exists() || !assignedSnap.data()?.name) assignedId=null;
  }

  if(!assignedId){
    const byUid=await getDocs(query(collection(db,'businesses'),where('ownerUid','==',u.uid)));
    const byEmail=byUid.empty
      ? await getDocs(query(collection(db,'businesses'),where('ownerEmail','==',(u.email||'').toLowerCase())))
      : byUid;
    const candidates=byEmail.docs.filter(d=>d.data()?.name);
    if(candidates.length){
      // Prefer an active workspace, then the first real named workspace.
      const active=candidates.find(d=>String(d.data()?.status||'').toLowerCase()==='active');
      assignedId=(active||candidates[0]).id;
    }
  }

  // Admin-provisioned pending business: claim it by matching owner email.
  if(!assignedId){
    const pending=await getDocs(query(collection(db,'businesses'),where('ownerEmail','==',(u.email||'').toLowerCase()),where('ownerUid','==','')));
    const candidate=pending.docs.find(d=>!d.data()?.ownerUid || d.data()?.ownerUid===u.uid);
    if(candidate){
      assignedId=candidate.id;
      await updateDoc(doc(db,'businesses',assignedId),{ownerUid:u.uid,status:'active',onboardingStatus:'active',updatedAt:serverTimestamp()});
    }
  }

  // Backward-compatible self-serve workspace only when no existing business exists.
  if(!assignedId){
    assignedId=u.uid;
    const businessRef=doc(db,'businesses',assignedId);
    const existingBusiness=await getDoc(businessRef);
    if(!existingBusiness.exists() || !existingBusiness.data()?.name){
      $('obOwner').value=u.displayName||'';$('obBusiness').value='';$('onboardingModal').style.display='grid';
      await new Promise(resolve=>{$('obSave').onclick=async()=>{const name=$('obBusiness').value.trim();if(!name){$('obMsg').textContent='Business name is required.';$('obMsg').style.display='block';return}const phone=$('obPhone').value.trim();$('obSave').disabled=true;$('obSave').textContent='Creating...';try{const type=$('obType').value;const template=/real estate|property/i.test(type)?'property':/education|coaching/i.test(type)?'coaching':'general';const profile={ownerUid:u.uid,ownerEmail:(u.email||'').toLowerCase(),ownerName:$('obOwner').value.trim()||u.displayName||'',name,businessType:type,templateId:template,phone,whatsapp:phone,city:$('obCity').value.trim(),area:$('obArea').value.trim(),website:$('obWebsite').value.trim(),description:$('obDescription').value.trim(),plan:'trial',status:'active',onboardingStatus:'active',createdAt:serverTimestamp(),updatedAt:serverTimestamp()};await setDoc(businessRef,profile,{merge:true});$('onboardingModal').style.display='none';resolve()}catch(e){$('obMsg').textContent=e.message||'Workspace setup failed.';$('obMsg').style.display='block';$('obSave').disabled=false;$('obSave').textContent='Create My Workspace'}}});
    }
  }

  businessId=assignedId;
  const businessSnap=await getDoc(doc(db,'businesses',businessId));
  businessProfile=businessSnap.exists()?businessSnap.data():{};
  const template=getBusinessTemplate(businessProfile.templateId);
  const name=businessProfile.name||'Your Business';
  document.title=name+' — Business OS';
  applyTemplateUI();
  const head=document.querySelector('.page-head h1'); if(head) head.textContent=name;
  const desc=document.querySelector('.page-head p'); if(desc) desc.textContent=`${template.icon} ${template.name} · Customers, enquiries and follow-ups in one workspace.`;
  await setDoc(userRef,{uid:u.uid,email:u.email||'',displayName:u.displayName||'',businessId,businessName:name,role:'owner',templateId:businessProfile.templateId||'general',updatedAt:serverTimestamp()},{merge:true});
}

function subscribe(){if(unsub)unsub();const q=query(collection(db,"businesses",businessId,"contacts"),orderBy("createdAt","desc"));unsub=onSnapshot(q,snap=>{customers=snap.docs.map(d=>({id:d.id,...d.data()}));render()},err=>toast(err.message||"Could not load CRM data",true))}
async function finishRedirect(){
  try{
    const result=await getRedirectResult(auth);
    if(result&&result.user){
      $("authMsg").textContent="Signed in. Opening your workspace...";
    }
  }catch(e){
    console.error("Google redirect result error",e);
    $("authMsg").textContent=e.code?((e.message||"Google sign-in failed.")+" ["+e.code+"]"):(e.message||"Google sign-in failed.");
  }
}

$("googleBtn").onclick=async()=>{
  try{
    $("googleBtn").disabled=true;
    $("authMsg").textContent="Opening Google sign-in...";
    try{
      await signInWithPopup(auth,provider);
    }catch(popupError){
      console.warn("Popup sign-in failed, trying redirect",popupError);
      if(popupError&&["auth/popup-blocked","auth/popup-closed-by-user","auth/cancelled-popup-request","auth/operation-not-supported-in-this-environment"].includes(popupError.code)){
        $("authMsg").textContent="Redirecting to Google...";
        await signInWithRedirect(auth,provider);
      }else{
        throw popupError;
      }
    }
  }catch(e){
    console.error("Google sign-in error",e);
    $("authMsg").textContent=e.code?((e.message||"Google sign-in failed.")+" ["+e.code+"]"):(e.message||"Google sign-in failed.");
    $("googleBtn").disabled=false;
  }
};

await finishRedirect();

onAuthStateChanged(auth,async u=>{currentUser=u;if(!u){$("authScreen").classList.remove("hidden");$("app").classList.add("hidden");if(unsub)unsub();if(unsubPublicLeads)unsubPublicLeads();$("googleBtn").disabled=false;return}try{$("authMsg").textContent="Opening your workspace...";await ensureWorkspace(u);$("authScreen").classList.add("hidden");$("app").classList.remove("hidden");$("userEmail").textContent=u.email||"";subscribe();subscribePublicLeads()}catch(e){console.error("Workspace setup error",e);$("authMsg").textContent=e.message||"Workspace setup failed.";$("googleBtn").disabled=false;}});
navView('overview');
window.logout=logout;window.openCustomerModal=openCustomerModal;window.closeCustomerModal=closeCustomerModal;window.saveCustomer=saveCustomer;window.selectCustomer=selectCustomer;window.closeProfile=closeProfile;window.editCustomer=editCustomer;window.deleteCustomer=deleteCustomer;window.openActivityModal=openActivityModal;window.closeModal=closeModal;window.typePick=typePick;window.saveActivity=saveActivity;window.markDone=markDone;window.call=call;window.wa=wa;window.email=email;window.exportCSV=exportCSV;window.importCSV=importCSV;window.resetFilters=resetFilters;window.stagePick=stagePick;window.updatePipeline=updatePipeline;window.changeStage=changeStage;window.clearDashFilter=clearDashFilter;window.setStageFilter=setStageFilter;window.setFollowFilter=setFollowFilter;window.osNav=osNav;window.copyLeadFormLink=copyLeadFormLink;window.convertPublicLead=convertPublicLead;window.leadCall=leadCall;
