// Server copy of paid plans. MUST match plans-config.js in the browser.
module.exports = {
  starter: { name: 'Starter', amount: 499, days: 30, lim: { customers: 500, prospects: 250, team: 3, deals: 250 } },
  growth:  { name: 'Growth',  amount: 999, days: 30, lim: { customers: 2000, prospects: 1000, team: 10, deals: 2000 } }
};
