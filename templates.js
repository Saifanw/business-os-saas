/* Business OS — reusable business templates. No customer data lives here. */
window.BUSINESS_TEMPLATES = {
  property: {
    id: 'property', name: 'Property Consultant', icon: '🏠',
    businessTypes: ['Real Estate','Property','Brokerage'],
    stages: ['New Enquiry','Contacted','Interested','Site Visit','Negotiation','Won','Lost'],
    labels: { lead: 'Enquiry', customer: 'Buyer / Seller', visit: 'Site Visit', deal: 'Deal' },
    kpis: ['New Enquiries','Hot Leads','Follow-ups Today','Site Visits','Negotiations','Won Deals']
  },
  coaching: {
    id: 'coaching', name: 'Coaching Institute', icon: '🎓',
    businessTypes: ['Education','Coaching','Training'],
    stages: ['New Enquiry','Contacted','Counselling','Demo Class','Admission Pending','Paid','Lost'],
    labels: { lead: 'Student Enquiry', customer: 'Student', visit: 'Demo Class', deal: 'Admission' },
    kpis: ['New Enquiries','Counselling Pending','Demo Classes','Admissions','Fees Pipeline']
  },
  general: {
    id: 'general', name: 'General Business', icon: '🏪',
    businessTypes: ['Consultancy','Agency','Services','Retail','Other'],
    stages: ['New','Contacted','Interested','Follow-up','Visit / Demo','Won','Lost'],
    labels: { lead: 'Lead', customer: 'Customer', visit: 'Visit / Demo', deal: 'Sale' },
    kpis: ['New Leads','Hot Leads','Follow-ups Today','Open Opportunities','Won Sales']
  }
};
function getBusinessTemplate(id){ return window.BUSINESS_TEMPLATES[id] || window.BUSINESS_TEMPLATES.general; }
