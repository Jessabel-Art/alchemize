export const businessContact = {
  phone: {
    display: "(910) 644-0207",
    href: "tel:+19106440207",
    tel: "tel:+19106440207",
  },
};

export const contactRouting = {
  general: {
    label: "General questions",
    email: "hello@getalchemize.com",
    mailto: "mailto:hello@getalchemize.com",
    purpose: "General questions and website inquiries",
  },
  newClients: {
    label: "New clients",
    email: "start@getalchemize.com",
    mailto: "mailto:start@getalchemize.com",
    purpose: "New client intake and consultation requests",
  },
  support: {
    label: "Support",
    email: "support@getalchemize.com",
    mailto: "mailto:support@getalchemize.com",
    purpose: "Client support and account follow-up",
  },
  documents: {
    label: "Documents",
    email: "documents@getalchemize.com",
    mailto: "mailto:documents@getalchemize.com",
    purpose: "Document delivery and secure document handling",
  },
  billing: {
    label: "Billing",
    email: "billing@getalchemize.com",
    mailto: "mailto:billing@getalchemize.com",
    purpose: "Billing, invoices, and payment questions",
  },
  founder: {
    label: "Founder",
    email: "founder@getalchemize.com",
    mailto: "mailto:founder@getalchemize.com",
    purpose: "Executive or founder-only communication",
  },
};

export const contactDirectory = Object.values(contactRouting);

export default {
  businessContact,
  contactRouting,
  contactDirectory,
};
