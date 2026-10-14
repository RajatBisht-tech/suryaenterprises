// ---------------------------------------------------------------------------
// Surya Enterprises — storefront business configuration.
//
// Every customer-facing business claim on the marketplace (helpline, delivery
// coverage, return policy, shipping thresholds, trust badges, offers, policy
// values) is read from THIS FILE ONLY. Values marked `PLACEHOLDER` are safe,
// non-committal defaults — the owner should review and edit them. Set a value
// to `null` to hide it.
// ---------------------------------------------------------------------------

// PLACEHOLDER — helpline hours. This one string is shown everywhere hours appear
// (header strip, footer, contact page, trust bar, institutional page).
const HELPLINE_HOURS = "Mon–Sat, 9:00 AM – 6:00 PM";

const EMAIL = "SURYA2026ENT@gmail.com";
const HELPLINE = { display: "+91 9650300157", tel: "+919650300157", hours: HELPLINE_HOURS };

export const SITE = {
  name: "Surya Enterprises",
  legalName: "SURYA ENTERPRISES",
  shortLabel: "Agri Marketplace",
  tagline: "India's biggest agriculture marketplace",
  // One-line mission shown in the footer brand block.
  mission: "Genuine seeds, traps & repellents and farm machinery from leading brands — for farmers, agri-retailers and institutional buyers.",
  // Brand artwork supplied by the owner (public/assets/brand). `logo` is the
  // whitespace-trimmed copy used in the UI; the square favicon is app/icon.png.
  logo: "/assets/brand/surya-logo-wide.png",
  logoTagline: "Growing a better tomorrow",

  // Contact details reused from the existing site (navbar/footer/contact).
  helpline: HELPLINE,
  email: EMAIL,
  grievanceEmail: EMAIL,
  // PLACEHOLDER — WhatsApp business number as digits with country code
  // (e.g. "919650300157"). null hides the WhatsApp link everywhere.
  whatsapp: null,
  offices: [
    {
      label: "Rajasthan Registration",
      kind: "Registered office",
      gstin: "08IIPPP7537C1ZO",
      address:
        "Shop No. SS-53, Rajdhani Krishi Mandi, Sikar Road, Kukar Kheda, Jaipur, Rajasthan — 302013",
    },
    {
      label: "Delhi Registration",
      kind: "Corporate office",
      gstin: "07IIPPP7537C1ZQ",
      address:
        "Ground Floor, 6670, BALMIKI MANDIR, Nabi Karim Road, Nabi Karim, New Delhi, Central Delhi, Delhi — 110055",
    },
  ],

  // Social profiles. Only URLs that are set render an icon — no dead icons.
  // PLACEHOLDER — fill in real profile URLs, e.g. "https://www.instagram.com/…".
  social: {
    facebook: null,
    instagram: null,
    youtube: null,
    linkedin: null,
    x: null,
  },

  // App-store badges are intentionally NOT rendered: no apps exist yet.
  // When they do, uncomment and the footer "Download app" slot appears.
  // appStores: {
  //   googlePlay: "https://play.google.com/store/apps/details?id=…",
  //   appStore: "https://apps.apple.com/in/app/…",
  // },

  // PLACEHOLDER — default PIN shown in "Deliver to" until the shopper sets one.
  // null shows "Select PIN".
  defaultPin: null,

  delivery: {
    // PLACEHOLDER — shown after a shopper checks a PIN on a product page.
    // Do not promise dates/ETAs here unless they are operationally true.
    coverageMessage:
      "Delivery availability and charges for this PIN are confirmed when you place your order.",
    // PLACEHOLDER — shown in the cart price breakdown for delivery.
    cartDeliveryLabel: "Calculated at checkout",
    // PLACEHOLDER — one-line dispatch/coverage claim used in benefit cards.
    dispatchClaim: "Dispatch to serviceable PIN codes across India through courier and transport partners.",
    // PLACEHOLDER — set to a rupee amount (e.g. 999) to advertise free shipping
    // above that order value. null = not advertised anywhere.
    freeShippingThreshold: null,
  },

  // PLACEHOLDER — short return / replacement policy line shown in Help areas.
  returnPolicy:
    "For return or replacement queries, contact our helpline with your order ID.",

  // Label disclaimer shown in "Safety & usage" on every product page.
  labelDisclaimer:
    "Always read and follow the packet, label or manual supplied with the product. Use only as the manufacturer directs. Keep away from children, food and animal feed.",

  // Trust bar items (home page). `icon` is a key resolved in
  // components/shop/TrustBar.jsx. PLACEHOLDER — edit wording to match ops.
  trust: [
    { icon: "shield", title: "Genuine products", text: "From leading seed, trap and machinery brands" },
    { icon: "label", title: "Licensed agri-inputs marketplace", text: "Sealed manufacturer packs" },
    { icon: "upi", title: "Secure UPI payments", text: "UPI via PayU" },
    { icon: "phone", title: "Helpline", text: HELPLINE_HOURS },
  ],

  // Certifications shown in the strip above the footer. ONLY add certifications
  // the business actually holds (artwork lives in /public/assets/images).
  // `enabled: false` hides an entry without deleting it.
  certifications: [
    {
      id: "iso",
      name: "ISO certified",
      detail: "Certificate no. 305023041314Q",
      image: "/assets/images/iso-logo.png",
      href: "/quality-assurance",
      enabled: true,
    },
    {
      id: "zed",
      name: "ZED certified",
      detail: "Zero Defect Zero Effect (MSME)",
      image: "/assets/images/zed-logo.png",
      href: "/quality-assurance",
      enabled: true,
    },
    // Example of how to add a real one once obtained:
    // { id: "bis", name: "BIS licence", detail: "Lic. no. …", image: "/assets/images/bis.png", href: "/quality-assurance", enabled: false },
  ],
  // Agri-input trade licences held by the business (state seed sale licence,
  // shop & establishment, etc.). Rendered on the About page and in the company
  // profile PDF ONLY when filled — leave empty until the owner supplies the
  // real numbers. Shape:
  //   { authority: "Directorate of Agriculture, Rajasthan", number: "…", scope: "Seeds (retail)", validTill: "YYYY-MM-DD" }
  licences: [],

  // Factual chips next to the certifications. `icon` keys: factory, upi, receipt, shield, phone.
  trustChips: [
    { icon: "shield", text: "Licensed agri-inputs marketplace" },
    { icon: "upi", text: "Secure UPI via PayU" },
    { icon: "receipt", text: "GST invoice" },
  ],

  // Payment methods that are actually live in checkout.
  payments: ["UPI via PayU"],

  // -------------------------------------------------------------------------
  // Offers ticker (home page, under the header). Only enabled items render.
  // Keep items FACTUAL — they are shown to every visitor. To add a real sale:
  //   { text: "Monsoon sale: 10% off all sprayers till 31 July", href: "/c/farm-machinery/sprayers", icon: "tag", enabled: true },
  // `icon` keys: sprout, upi, building, tag, package, truck, phone.
  // Only advertise what is in the catalogue: seeds, traps & repellents, farm machinery.
  // -------------------------------------------------------------------------
  offersSiteWide: false, // true shows the ticker on every page, false = home only
  offers: [
    { text: "Genuine products from Syngenta, Namdhari Seeds, East West, Bayer, Barrix, KisanKraft & more", href: "/products", icon: "sprout", enabled: true },
    { text: "Pay securely with UPI via PayU", href: "/payment-policy", icon: "upi", enabled: true },
    { text: "Bulk seeds, sprayers, tarpaulins & equipment for institutions — request a quote", href: "/products/institutional", icon: "building", enabled: true },
    { text: "Shop products under ₹500", href: "/search?max=500&sort=popularity", icon: "tag", enabled: true },
    { text: "Seeds, traps & repellents and farm machinery online — every pack size", href: "/products", icon: "package", enabled: true },
  ],

  // -------------------------------------------------------------------------
  // Promotional carousel (home page). Only enabled slides render.
  // theme: "green" | "harvest" | "earth"
  // art:   "pest" | "growth" | "seeds" | "sprayer" | "tarpaulin" | "tools" | "warehouse"
  // badge: optional short label ("SALE", "-20%") — renders ONLY when set.
  // -------------------------------------------------------------------------
  promotions: [
    {
      id: "under-500",
      title: "Under ₹500 picks",
      subtitle: "Products priced under ₹500 across every category.",
      cta: "Shop under ₹500",
      href: "/search?max=500&sort=popularity",
      theme: "harvest",
      art: "growth",
      enabled: true,
    },
    {
      id: "seeds",
      title: "Seeds by crop",
      subtitle: "Vegetable, fruit, flower and field seeds from established seed companies.",
      cta: "Shop seeds",
      href: "/c/seeds",
      theme: "green",
      art: "seeds",
      enabled: true,
    },
    {
      id: "traps-lures",
      title: "Traps, lures & repellents",
      subtitle: "Pheromone lures, sticky traps and animal repellents — chemical-free crop care.",
      cta: "Shop traps & lures",
      href: "/c/traps-and-repellents/traps-and-lures",
      theme: "harvest",
      art: "pest",
      enabled: true,
    },
    {
      id: "sprayers",
      title: "Sprayers for every farm",
      subtitle: "Knapsack, battery and power sprayers by brand and tank size.",
      cta: "Shop sprayers",
      href: "/c/farm-machinery/sprayers",
      theme: "green",
      art: "sprayer",
      enabled: true,
    },
    {
      id: "tarpaulins",
      title: "Tarpaulins, mulches & nets",
      subtitle: "HDPE tarpaulins, mulch film, shade nets and crop covers by size.",
      cta: "Shop tarpaulins",
      href: "/c/farm-machinery/tarpaulin",
      theme: "earth",
      art: "tarpaulin",
      enabled: true,
    },
    {
      id: "machinery",
      title: "Tools & equipment",
      subtitle: "Brush cutters, tillers, hand tools, pumps and irrigation gear.",
      cta: "Shop farm machinery",
      href: "/c/farm-machinery",
      theme: "green",
      art: "tools",
      enabled: true,
    },
    {
      id: "bulk",
      title: "Bulk buying for institutions",
      subtitle: "Bulk seeds, sprayers, tarpaulins and equipment — quotes on request.",
      cta: "Get a quote",
      href: "/products/institutional",
      theme: "earth",
      art: "warehouse",
      enabled: true,
    },
  ],

  // -------------------------------------------------------------------------
  // Legal & policy values. Every number/date here is a business decision —
  // the policy pages render these values verbatim.
  // -------------------------------------------------------------------------
  legal: {
    // PLACEHOLDER — Corporate Identification Number. null hides the CIN line.
    cin: null,
    // "Last updated" date shown on every policy page (ISO date).
    policyLastUpdated: "2026-10-07",
    // PLACEHOLDER — courts that have jurisdiction (defaults to the registered office).
    jurisdiction: { city: "Jaipur", state: "Rajasthan" },
    // Grievance Officer under the Consumer Protection (E-Commerce) Rules, 2020
    // and the IT Rules (shown on the grievance, privacy and terms pages and in the footer).
    grievanceOfficer: {
      name: "Shubham Kumar",
      designation: "Grievance Officer",
      credentials: "Retd. Officer, State Agro Dept.",
      email: "ct.ashok@suryaenter.in",
      phone: { display: "+91 9650300157", tel: "+919650300157", hours: HELPLINE_HOURS },
    },
    // PLACEHOLDER — address for IP / copyright takedown notices.
    takedownEmail: EMAIL,
  },
  policies: {
    shipping: {
      // PLACEHOLDER — describe the delivery footprint honestly.
      serviceableAreas:
        "We ship to serviceable PIN codes across India through our courier and transport partners. Serviceability for your PIN is confirmed when you place your order.",
      // PLACEHOLDER — typical time from payment confirmation to dispatch.
      dispatchWindow: "2–4 working days",
      // PLACEHOLDER — how delivery charges are communicated.
      charges: "Delivery charges, if any, depend on the destination PIN and the weight/volume of the order and are confirmed when you place your order.",
      // PLACEHOLDER — locations that cannot be served or need extra time (ODA note).
      restrictedAreas:
        "Remote, hilly, island and out-of-delivery-area (ODA) PIN codes may take longer or may not be serviceable for bulky consignments.",
    },
    returns: {
      // PLACEHOLDER — days from delivery within which a claim must be raised.
      claimWindowDays: 7,
      // PLACEHOLDER — refund timeline after a claim is approved.
      refundTimeline: "7–10 working days",
    },
    cancellation: {
      // PLACEHOLDER — until when a paid order can be cancelled.
      window: "until the order is dispatched",
    },
    payment: {
      // Matches the UPI intent expiry used by checkout (30 minutes).
      pendingWindowMinutes: 30,
      // PLACEHOLDER — bank/UPI auto-reversal timeline for failed debits.
      autoReversalTimeline: "5–7 working days",
    },
    grievance: {
      // Statutory: acknowledge within 48 hours, resolve within one month.
      acknowledgementHours: 48,
      resolutionDays: 30,
    },
    bulk: {
      // PLACEHOLDER — minimum order value for institutional pricing (₹). null = not stated.
      minOrderValue: null,
      // PLACEHOLDER — how long a quotation stays valid.
      quoteValidityDays: 15,
      // PLACEHOLDER — credit terms offered to institutional buyers.
      creditTerms: "Advance payment unless credit terms are agreed in writing.",
    },
    cookies: {
      // PLACEHOLDER — set true once an analytics tool (e.g. GA4) is installed.
      usesAnalytics: false,
    },
  },
};

export const telHref = `tel:${SITE.helpline.tel}`;
export const mailHref = `mailto:${SITE.email}`;
export const whatsappHref = SITE.whatsapp ? `https://wa.me/${SITE.whatsapp}` : null;

// "7 October 2026" from an ISO date string.
export const formatPolicyDate = (iso = SITE.legal.policyLastUpdated) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
