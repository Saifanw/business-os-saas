/* BusinessOS — simple navigation.
 * Top bar: Overview · Customers · Follow-ups · Deals · [Properties / Vehicles] · Outreach · Calls · More.
 * The industry item (Properties today, Vehicles later) only shows for businesses that use it,
 * decided by INVENTORY / TEMPLATE_MODULE below.
 * Everything else lives under "More" (uniform icons, Team & settings highlighted at the bottom).
 * Loaded with <script src="assets/nav-more.js" defer></script> on app pages only.
 * Existing link ids (navFu, navLd, nFollow...) are moved, not recreated, so counters keep working. */
(function(){
  var CORE=["customers.html","customer-list.html","followups.html","deals.html"];
  /* Industry module: the one extra page that sits next to Deals for businesses that need it.
   * To add a new industry: add an INVENTORY entry, map its templateId in TEMPLATE_MODULE.
   * ready:false keeps the link hidden until the page actually exists. */
  var INVENTORY={
    property:{href:"properties.html",label:"Properties",ready:true},
    car:{href:"vehicles.html",label:"Vehicles",ready:false}
  };
  /* templateId -> module. "" = no industry page. Empty/unknown-old templateId falls back to
   * "property" because this product shipped property-first (existing workspaces keep Properties). */
  var TEMPLATE_MODULE={property:"property",car:"car",coaching:"",general:"property"};
  function moduleKey(){
    var v={};try{v=JSON.parse(localStorage.getItem("bos.vertical")||"{}")||{}}catch(e){}
    if(v.m)return v.m==="none"?"":v.m;               /* explicit override: businesses/{id}.inventoryModule */
    var t=v.t||"";
    if(!t)return "property";
    return Object.prototype.hasOwnProperty.call(TEMPLATE_MODULE,t)?TEMPLATE_MODULE[t]:"";
  }
  function isInv(h){for(var k in INVENTORY)if(INVENTORY[k].href===h)return true;return false}
  var nav=document.querySelector("nav.nav");
  if(!nav||nav.dataset.simple||!nav.querySelector('a[href="customer-list.html"]'))return;
  nav.dataset.simple="1";
  var here=location.pathname.split("/").pop(),mode0=new URLSearchParams(location.search).get("mode");
  var css=document.createElement("style");
  css.textContent=[
    "nav.nav{overflow:visible!important}",
    /* Calls button */
    ".nav-out{color:#0b7a52!important;font-weight:700!important;flex:none}",
    ".nav-out:hover{background:#e3f6ee!important}",
    ".nav-out.on{background:#e3f6ee!important;color:#0b7a52!important}",
    ".nav-call{display:inline-flex!important;align-items:center;gap:7px;height:36px!important;margin-left:8px;padding:0 13px!important;border-radius:10px!important;border:1px solid #d3defe;background:#fff;color:#2347d6!important;font-size:13px!important;font-weight:700;white-space:nowrap;flex:none}",
    ".nav-call svg{display:block!important;width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}",
    ".nav-call:hover{background:#eef2ff!important;border-color:#b9ccff}",
    ".nav-call.on{background:#2f5bff!important;border-color:#2f5bff;color:#fff!important;box-shadow:0 4px 12px rgba(47,91,255,.25)}",
    /* More button */
    ".nav-more{position:relative;flex:none}",
    ".nav-more>button{border:0;background:none;font:inherit;font-weight:600;font-size:13px;color:var(--mut,#64748b);padding:8px 13px;border-radius:9px;cursor:pointer;display:flex;align-items:center;gap:6px;white-space:nowrap}",
    ".nav-more>button:hover,.nav-more>button[aria-expanded=true]{background:#f1f4fa;color:var(--ink,#0f172a)}",
    ".nav-more>button.on{background:#eaf0ff;color:var(--blue,#2f5bff)}",
    ".nav-more>button svg{width:12px;height:12px;transition:transform .15s}.nav-more>button[aria-expanded=true] svg{transform:rotate(180deg)}",
    ".nav-more .dot{width:7px;height:7px;border-radius:50%;background:var(--amber,#d98a00)}",
    /* dropdown */
    ".nav-more-menu{position:absolute;left:0;top:calc(100% + 8px);width:250px;background:#fff;border:1px solid var(--line,#e6eaf2);border-radius:14px;box-shadow:0 20px 44px rgba(15,23,42,.16);padding:8px;z-index:60;display:flex;flex-direction:column;gap:2px}",
    ".nav-more-menu[hidden]{display:none}",
    ".nav-more-menu a{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:12px!important;width:100%;height:auto!important;padding:7px 9px!important;border-radius:10px!important;font-size:13.5px!important;font-weight:600!important;color:var(--ink,#0f172a)!important;background:none;white-space:nowrap;text-align:left}",
    ".nav-more-menu a:hover{background:#f3f6fc!important}",
    ".nav-more-menu a.on{background:#eaf0ff!important;color:var(--blue,#2f5bff)!important}",
    ".nav-more-menu .nm-ic{display:grid;place-items:center;flex:none;width:30px;height:30px;border-radius:9px;background:#f1f4f9;color:#64748b}",
    ".nav-more-menu .nm-ic svg{display:block!important;width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}",
    ".nav-more-menu a:hover .nm-ic{background:#e4eaf7;color:#2347d6}",
    ".nav-more-menu a.on .nm-ic{background:#d7e2ff;color:#2347d6}",
    ".nav-more-menu a em{margin-left:auto}",
    ".nav-more-menu .nm-sep{height:1px;margin:6px 4px;background:var(--line,#e6eaf2)}",
    /* Team & settings highlight */
    ".nav-more-menu a.nm-set{background:#eef2ff!important;border:1px solid #d3defe;color:#2347d6!important;font-weight:700!important}",
    ".nav-more-menu a.nm-set:hover{background:#e3eaff!important}",
    ".nav-more-menu a.nm-set .nm-ic{background:#2f5bff;color:#fff}",
    ".nav-more-menu a.nm-set:hover .nm-ic{background:#2347d6;color:#fff}",
    ".nav-more-menu a.nm-set .nm-go{margin-left:auto;width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;opacity:.7}",
    "@media(max-width:760px){nav.nav{gap:0!important;justify-content:flex-start;overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch;scrollbar-width:none}nav.nav::-webkit-scrollbar{display:none}nav.nav>a,.nav-more>button{padding:8px 8px!important;font-size:12.5px!important;flex:none;white-space:nowrap}nav.nav>a svg{display:none!important}nav.nav>a.nav-call svg{display:block!important}.nav-call{margin-left:4px;padding:0 11px!important}.nav-call span{display:none}.nav-more-menu{position:fixed;left:12px;right:12px;width:auto;max-width:360px;margin-left:auto}}"
  ].join("\n");
  document.head.appendChild(css);

  var links=[].slice.call(nav.querySelectorAll(":scope > a")),rest=[];
  links.forEach(function(a){var h=(a.getAttribute("href")||"").split(/[?#]/)[0];if(isInv(h)||h==="outreach-queue.html"){a.remove();return}if(CORE.indexOf(h)<0)rest.push(a)});
  /* make sure all four everyday links exist, in the same order on every page */
  var LABEL={"customers.html":"Overview","customer-list.html":"Customers","followups.html":"Follow-ups","deals.html":"Deals"};
  CORE.forEach(function(h){var a=nav.querySelector(':scope > a[href^="'+h+'"]');
    if(!a){a=document.createElement("a");a.href=h;a.textContent=LABEL[h];if(here===h)a.className="on"}
    nav.appendChild(a)});

  /* Calls — the only extra button kept outside the menu */
  var PHONE='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>';
  var call=document.createElement("a");call.href="whatsapp-center.html?mode=call";call.className="nav-call";call.title="Call your customers";call.innerHTML=PHONE+"<span>Calls</span>";
  nav.appendChild(call);

  /* Industry link (Properties / Vehicles) — top bar, right after Deals, only when the business uses it */
  var out=document.createElement("a");out.href="outreach-queue.html";out.className="nav-out"+(here==="outreach-queue.html"?" on":"");out.textContent="Outreach";out.title="WhatsApp outreach list";
  if(here==="outreach-queue.html")out.setAttribute("aria-current","page");
  var inv=null;
  function applyInventory(){
    if(inv&&inv.parentNode)inv.parentNode.removeChild(inv);inv=null;
    var cfg=INVENTORY[moduleKey()];
    if(cfg&&cfg.ready){
      inv=document.createElement("a");inv.href=cfg.href;inv.className="nav-inv"+(here===cfg.href?" on":"");inv.textContent=cfg.label;
      if(here===cfg.href)inv.setAttribute("aria-current","page");
      nav.insertBefore(inv,call);
    }
    nav.insertBefore(out,call);   /* Outreach always sits right before Calls */
  }
  applyInventory();
  document.addEventListener("bos-vertical",applyInventory);
  (function(){var on=nav.querySelector(":scope > a.on");if(on&&nav.scrollWidth>nav.clientWidth)nav.scrollLeft=Math.max(0,on.offsetLeft-nav.offsetLeft-12)})();   /* pages fire this once the business profile loads */

  var wrap=null,btn=null,menu=null;
  if(rest.length){
    wrap=document.createElement("div");wrap.className="nav-more";
    btn=document.createElement("button");btn.type="button";btn.setAttribute("aria-haspopup","true");btn.setAttribute("aria-expanded","false");
    btn.innerHTML='More<span class="dot" hidden></span><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2 4 4 4 4-4"/></svg>';
    menu=document.createElement("div");menu.className="nav-more-menu";menu.hidden=true;menu.setAttribute("role","menu");
    var IC={
      "custom-requests.html":'<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
      "properties.html":'<path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/>',
      "website-leads.html":'<path d="M7 17 17 7M8 7h9v9"/>',
      "whatsapp-center.html":'<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z"/>',
      "business-finder-app.html":'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
      "prospecting-center.html":'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
      "reports.html":'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
      "import-export.html":'<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
      "team-settings.html":'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>'
    };
    var ORDER=[["website-leads.html","Leads"],["whatsapp-center.html","WhatsApp"],["business-finder-app.html","Finder"],["prospecting-center.html","Prospecting"],["reports.html","Reports"],["import-export.html","Import & export"],["custom-requests.html","Customise request"]],SET=["team-settings.html","Team & settings"];
    function find(h){return rest.filter(function(r){return(r.getAttribute("href")||"").split(/[?#]/)[0]===h})[0]}
    function item(x){
      var a=find(x[0]);
      if(!a){a=document.createElement("a");a.href=x[0];a.textContent=x[1];if(here===x[0])a.className="on"}
      [].slice.call(a.querySelectorAll("svg")).forEach(function(v){v.remove()});
      a.classList.remove("nm-done");a.removeAttribute("style");
      var ic=document.createElement("span");ic.className="nm-ic";ic.setAttribute("aria-hidden","true");
      ic.innerHTML='<svg viewBox="0 0 24 24">'+(IC[x[0]]||'<circle cx="12" cy="12" r="3"/>')+'</svg>';
      a.insertBefore(ic,a.firstChild);
      return a}
    ORDER.forEach(function(x){menu.appendChild(item(x))});
    /* any other link that was in the old menu goes above the divider */
    rest.forEach(function(a){if(!menu.contains(a)&&a!==find(SET[0])){a.insertBefore((function(){var ic=document.createElement("span");ic.className="nm-ic";ic.innerHTML='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/></svg>';return ic})(),a.firstChild);menu.appendChild(a)}});
    var sep=document.createElement("div");sep.className="nm-sep";sep.setAttribute("role","separator");menu.appendChild(sep);
    var st=item(SET);st.classList.add("nm-set");
    st.insertAdjacentHTML("beforeend",'<svg class="nm-go" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>');
    menu.appendChild(st);
    wrap.appendChild(btn);wrap.appendChild(menu);nav.appendChild(wrap);

    function badge(){var d=btn.querySelector(".dot");d.hidden=!menu.querySelector(".pill:not(.hidden),em.cnt:not(.z)")}
    badge();new MutationObserver(badge).observe(menu,{subtree:true,childList:true,attributes:true,characterData:true});
    function close(){menu.hidden=true;btn.setAttribute("aria-expanded","false")}
    btn.addEventListener("click",function(e){e.stopPropagation();var open=menu.hidden;
      menu.style.top=(open&&window.matchMedia("(max-width:760px)").matches)?(btn.getBoundingClientRect().bottom+6)+"px":"";
      menu.hidden=!open;btn.setAttribute("aria-expanded",String(open))});
    nav.addEventListener("scroll",close,{passive:true});window.addEventListener("scroll",close,{passive:true});
    document.addEventListener("click",function(e){if(!wrap.contains(e.target))close()});
    document.addEventListener("keydown",function(e){if(e.key==="Escape"){close();btn.focus()}});
  }

  /* active states: Calls vs WhatsApp share one page, told apart by ?mode=call */
  function sync(mode){
    var onCenter=here==="whatsapp-center.html",isCall=onCenter&&mode==="call";
    call.classList.toggle("on",isCall);if(isCall)call.setAttribute("aria-current","page");else call.removeAttribute("aria-current");
    if(menu){var wa=menu.querySelector('a[href^="whatsapp-center.html"]');
      if(wa){wa.classList.toggle("on",onCenter&&!isCall);if(onCenter&&!isCall)wa.setAttribute("aria-current","page");else wa.removeAttribute("aria-current")}
      btn.classList.toggle("on",!!menu.querySelector("a.on"))}}
  sync(mode0);
  document.addEventListener("bos-mode",function(e){sync(e.detail)});
})();

/* Upgrade bar for Free workspaces (see ../upgrade-banner.js) */
(function(){try{var s=document.createElement("script");s.type="module";s.src=(document.currentScript&&document.currentScript.src?document.currentScript.src.replace(/assets\/nav-more\.js.*$/,""):"")+"upgrade-banner.js";document.head.appendChild(s)}catch(e){}})();
