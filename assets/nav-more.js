/* BusinessOS — simple navigation.
 * Keeps the 4 everyday links in the top bar and tucks everything else under "More".
 * Loaded with <script src="assets/nav-more.js" defer></script> on app pages only.
 * Existing link ids (navFu, navLd, nFollow...) are moved, not recreated, so counters keep working. */
(function(){
  var CORE=["customers.html","customer-list.html","followups.html","deals.html"];
  var nav=document.querySelector("nav.nav");
  if(!nav||nav.dataset.simple||!nav.querySelector('a[href="customer-list.html"]'))return;
  nav.dataset.simple="1";
  var css=document.createElement("style");
  css.textContent=
    "nav.nav{overflow:visible!important}"+
    ".nav-more{position:relative;flex:none}"+
    ".nav-more>button{border:0;background:none;font:inherit;font-weight:600;font-size:13px;color:var(--mut,#64748b);padding:8px 13px;border-radius:9px;cursor:pointer;display:flex;align-items:center;gap:6px;white-space:nowrap}"+
    ".nav-more>button:hover,.nav-more>button[aria-expanded=true]{background:#f1f4fa;color:var(--ink,#0f172a)}"+
    ".nav-more>button.on{background:#eaf0ff;color:var(--blue,#2f5bff)}"+
    ".nav-more>button svg{width:12px;height:12px;transition:transform .15s}.nav-more>button[aria-expanded=true] svg{transform:rotate(180deg)}"+
    ".nav-more .dot{width:7px;height:7px;border-radius:50%;background:var(--amber,#d98a00)}"+
    ".nav-more-menu{position:absolute;left:0;top:calc(100% + 6px);min-width:210px;background:#fff;border:1px solid var(--line,#e6eaf2);border-radius:12px;box-shadow:0 18px 40px #0f172a1f;padding:6px;z-index:60;display:grid;gap:2px}"+
    ".nav-more-menu[hidden]{display:none}"+
    ".nav-more-menu a{display:flex!important;align-items:center;justify-content:space-between;gap:10px;width:100%;padding:9px 11px!important;border-radius:8px!important;font-size:13px!important;font-weight:600;color:var(--ink,#0f172a)!important;white-space:nowrap}"+
    ".nav-more-menu a:hover{background:#f3f6fc!important}.nav-more-menu a.on{background:#eaf0ff!important;color:var(--blue,#2f5bff)!important}"+
    "@media(max-width:760px){.nav-more-menu{left:auto;right:0}nav.nav{gap:0!important;justify-content:space-between}nav.nav>a,.nav-more>button{padding:8px 5px!important;font-size:12px!important}nav.nav>a svg{display:none!important}}";
  document.head.appendChild(css);
  var links=[].slice.call(nav.querySelectorAll(":scope > a")),rest=[];
  links.forEach(function(a){var h=(a.getAttribute("href")||"").split(/[?#]/)[0];if(CORE.indexOf(h)<0)rest.push(a)});
  /* make sure all four everyday links exist, in the same order on every page */
  var LABEL={"customers.html":"Overview","customer-list.html":"Customers","followups.html":"Follow-ups","deals.html":"Deals"};
  CORE.forEach(function(h){var a=nav.querySelector(':scope > a[href^="'+h+'"]');
    if(!a){a=document.createElement("a");a.href=h;a.textContent=LABEL[h];if(location.pathname.split("/").pop()===h)a.className="on"}
    nav.appendChild(a)});
  if(!rest.length)return;
  var wrap=document.createElement("div");wrap.className="nav-more";
  var btn=document.createElement("button");btn.type="button";btn.setAttribute("aria-haspopup","true");btn.setAttribute("aria-expanded","false");
  btn.innerHTML='More<span class="dot" hidden></span><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2 4 4 4 4-4"/></svg>';
  var menu=document.createElement("div");menu.className="nav-more-menu";menu.hidden=true;menu.setAttribute("role","menu");
  /* same menu, same order, on every page */
  var ORDER=[["website-leads.html","Leads"],["whatsapp-center.html","WhatsApp"],["business-finder-app.html","Finder"],["prospecting-center.html","Prospecting"],["reports.html","Reports"],["import-export.html","Import & export"],["team-settings.html","Team & settings"]],here=location.pathname.split("/").pop();
  ORDER.forEach(function(x){
    var a=rest.filter(function(r){return(r.getAttribute("href")||"").split(/[?#]/)[0]===x[0]})[0];
    if(!a){a=document.createElement("a");a.href=x[0];a.textContent=x[1];if(here===x[0])a.className="on"}
    menu.appendChild(a)});
  rest.forEach(function(a){if(!menu.contains(a))menu.appendChild(a)});
  wrap.appendChild(btn);wrap.appendChild(menu);nav.appendChild(wrap);
  if(menu.querySelector("a.on"))btn.classList.add("on");
  function badge(){var d=btn.querySelector(".dot");
    d.hidden=!menu.querySelector(".pill:not(.hidden),em.cnt:not(.z)")}
  badge();new MutationObserver(badge).observe(menu,{subtree:true,childList:true,attributes:true,characterData:true});
  function close(){menu.hidden=true;btn.setAttribute("aria-expanded","false")}
  btn.addEventListener("click",function(e){e.stopPropagation();var open=menu.hidden;menu.hidden=!open;btn.setAttribute("aria-expanded",String(open))});
  document.addEventListener("click",function(e){if(!wrap.contains(e.target))close()});
  document.addEventListener("keydown",function(e){if(e.key==="Escape"){close();btn.focus()}});
})();
