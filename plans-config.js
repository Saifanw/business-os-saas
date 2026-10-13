/* BusinessOS shared plan config — single source of truth for the browser.
 * Keep prices/limits in sync with functions/plans.js (server copy used when approving payments). */
(function(){
  var PLANS=[
    {key:"free",rank:0,name:"Free",price:"₹0",amount:0,per:"free plan",days:0,active:true,lim:{customers:10,prospects:0,team:1,deals:10},feat:["10 combined customer / lead records","Overview and core workflow access","Follow-ups, deals and reports","1 workspace owner"]},
    {key:"starter",rank:1,name:"Starter",price:"₹499",amount:499,per:"/ month",days:30,active:true,lim:{customers:500,prospects:250,team:3,deals:250}},
    {key:"growth",rank:2,name:"Growth",price:"₹999",amount:999,per:"/ month",days:30,popular:true,active:true,lim:{customers:2000,prospects:1000,team:10,deals:2000}},
    {key:"business",rank:3,name:"Business",price:"Custom",amount:null,per:"talk to us",days:30,active:true,lim:{customers:10000,prospects:5000,team:25,deals:10000}}
  ];
  var ALIAS={trial:"free",free:"free",starter:"starter",premium:"starter",growth:"growth",business:"business",custom:"business",paid:"starter"};
  var LEGACY={premium:{name:"Premium",lim:{customers:1000,prospects:250,team:3,deals:250}}};
  function current(biz){var raw=String((biz&&biz.plan)||"trial").toLowerCase(),p=PLANS.filter(function(x){return x.key===(ALIAS[raw]||"free")})[0]||PLANS[0],lg=LEGACY[raw];return{raw:raw,p:p,name:(lg&&lg.name)||p.name,lim:(lg&&lg.lim)||p.lim}}
  /* Record limit = plan limit (or admin override recordLimit) + top-up */
  function limit(biz){var c=current(biz);return Math.max(1,Math.max(0,Number(biz&&biz.recordLimit!=null?biz.recordLimit:c.lim.customers))+Math.max(0,Number(biz&&biz.topupRecords||0)))}
  window.BOS_PLANS={PLANS:PLANS,ALIAS:ALIAS,LEGACY:LEGACY,current:current,limit:limit,
    PAY:{upi:"6350566010@ybl",upiName:"SAIF ANWAR S O MOH ANAS ALAM",qr:"assets/upi-qr.jpeg",bank:{name:"Bank of Baroda",account:"29570100018204",ifsc:"BARB0JHOTWA"}}};
})();
