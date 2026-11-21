// ============================================================
// BADDIE STRANDS — Store data
// Products, texture chapters, stylist, answers, reviews, delivery.
// Edit this file to update what the shop shows.
//
// Product fields
//   id        unique number — never reuse a deleted id
//   category  "wigs" | "bundles" | "extensions"
//   price     naira, number only          oldPrice  null if not on sale
//   hot       true = Bestseller           new       true = New in
//   lengths   sizes offered               colors / colorNames  shades offered
//   tone      backdrop colour for this piece in the showroom
//   texture   how the hair moves: bone, straight, body, loose, water,
//             deep, curly or coily. The site draws the hair from this.
//   ombre     true = shades blend from dark roots into the colour
//   image     optional photo: a file name in this folder or an https://
//             link. Leave "" and the site shows the drawn hair instead.
// ============================================================

const STORE_DATA = {
  products: [
    {
      id: 1,
      name: "Remy Velvet Closure Wig",
      type: "Closure Wig",
      category: "wigs",
      price: 85000,
      oldPrice: 110000,
      currency: "₦",
      lengths: ["12\"", "14\"", "16\"", "18\"", "20\"", "22\"", "24\""],
      colors: ["#1a1008", "#3d2b1f", "#6b3a2a", "#c8a96e", "#f5d5a0"],
      colorNames: ["Jet Black", "Dark Brown", "Auburn", "Blonde", "Ash Blonde"],
      rating: 4.9,
      reviews: 142,
      stock: 15,
      hot: true,
      new: false,
      tone: "#7A1E46",
      texture: "straight",
      image: "",
      description: "100% virgin Remy human hair. Silky smooth texture, full cuticle intact, tangle-free. Comes with a 5×5 HD lace closure that melts seamlessly into your skin. Perfect for beginners and professionals alike.",
      features: ["100% Virgin Human Hair", "HD Lace Closure", "Pre-plucked Hairline", "Bleached Knots", "180% Density", "Can be bleached & dyed"]
    },
    {
      id: 2,
      name: "Brazilian Body Wave Bundle",
      type: "Bundle Deal",
      category: "bundles",
      price: 65000,
      oldPrice: null,
      currency: "₦",
      lengths: ["10\"", "12\"", "14\"", "16\"", "18\"", "20\""],
      colors: ["#1a1008", "#3d2b1f", "#c8a96e"],
      colorNames: ["Natural Black", "Dark Brown", "Honey Blonde"],
      rating: 4.8,
      reviews: 87,
      stock: 28,
      hot: false,
      new: true,
      tone: "#A6652F",
      texture: "body",
      image: "",
      description: "Luxurious Brazilian body wave bundles with a natural bounce and flow. Double-wefted for fullness, zero shedding. The wave pattern holds beautifully whether wet or dry.",
      features: ["Brazilian Virgin Hair", "Double Wefted", "Zero Shedding", "Natural Wave Pattern", "Can be heat styled", "3 bundles recommended for full look"]
    },
    {
      id: 3,
      name: "Deep Wave Frontal Wig",
      type: "Frontal Wig",
      category: "wigs",
      price: 120000,
      oldPrice: 145000,
      currency: "₦",
      lengths: ["14\"", "16\"", "18\"", "20\"", "22\"", "24\"", "26\""],
      colors: ["#1a1008", "#2b1d0e"],
      colorNames: ["Jet Black", "Off Black"],
      rating: 5.0,
      reviews: 63,
      stock: 8,
      hot: true,
      new: false,
      tone: "#1F5A5E",
      texture: "deep",
      image: "",
      description: "Stunning deep wave pattern with a 13×6 HD lace frontal. Creates a natural-looking hairline from ear to ear. The deep, defined curls add incredible volume and drama.",
      features: ["13×6 HD Lace Frontal", "Deep Wave Pattern", "Ear-to-ear Coverage", "Pre-bleached Knots", "200% Density", "Glueless installation option"]
    },
    {
      id: 4,
      name: "Kinky Coily 4C Afro Wig",
      type: "Afro Wig",
      category: "wigs",
      price: 95000,
      oldPrice: null,
      currency: "₦",
      lengths: ["10\"", "12\"", "14\"", "16\""],
      colors: ["#1a1008", "#2b1505", "#6b3a2a"],
      colorNames: ["Natural Black", "Dark Espresso", "Reddish Brown"],
      rating: 4.7,
      reviews: 54,
      stock: 12,
      hot: false,
      new: true,
      tone: "#4E5B2A",
      texture: "coily",
      image: "",
      description: "Celebrate your roots with this authentic 4C coily texture wig. Crafted from virgin African hair, it mimics the natural Afro texture perfectly. Celebrate your African heritage with unmatched realism.",
      features: ["Authentic 4C Texture", "Virgin African Hair", "Lace Front", "Protective Style", "No Heat Needed", "Afrocentric Design"]
    },
    {
      id: 5,
      name: "Straight Silky Bone Straight",
      type: "Bone Straight Wig",
      category: "wigs",
      price: 78000,
      oldPrice: 90000,
      currency: "₦",
      lengths: ["16\"", "18\"", "20\"", "22\"", "24\"", "26\"", "28\"", "30\""],
      colors: ["#1a1008", "#f5d5a0", "#e8cc99", "#c8a96e"],
      colorNames: ["Jet Black", "Platinum Blonde", "Ash Blonde", "Honey Blonde"],
      rating: 4.9,
      reviews: 198,
      stock: 22,
      hot: true,
      new: false,
      tone: "#2B3A55",
      texture: "bone",
      image: "",
      description: "Ultra-sleek bone straight hair with a mirror-like shine. The smoothest, silkiest straight hair we carry. Stays perfectly straight in humidity. A Baddie Strands bestseller.",
      features: ["Super Straight Texture", "Anti-Humidity Coating", "Mirror-like Shine", "HD Lace", "Beginner Friendly", "Heat Resistant up to 230°C"]
    },
    {
      id: 6,
      name: "Loose Deep Wave Clip-Ins",
      type: "Clip-In Extensions",
      category: "extensions",
      price: 45000,
      oldPrice: null,
      currency: "₦",
      lengths: ["14\"", "16\"", "18\"", "20\"", "22\""],
      colors: ["#1a1008", "#3d2b1f", "#c8a96e"],
      colorNames: ["Jet Black", "Dark Brown", "Honey Blonde"],
      rating: 4.6,
      reviews: 41,
      stock: 35,
      hot: false,
      new: false,
      tone: "#B5533C",
      texture: "water",
      image: "",
      description: "Full set of 7-piece loose deep wave clip-in extensions. Perfect for adding length and volume instantly. Easy DIY installation, no salon needed. Safe for natural hair.",
      features: ["7-Piece Full Set", "Strong Snap Clips", "Blend with Natural Hair", "No Damage", "Reusable 12+ months", "Salon-quality finish"]
    },
    {
      id: 7,
      name: "HD Lace Curly Bob Wig",
      type: "Bob Wig",
      category: "wigs",
      price: 72000,
      oldPrice: 85000,
      currency: "₦",
      lengths: ["8\"", "10\"", "12\"", "14\""],
      colors: ["#1a1008", "#6b3a2a", "#c8a96e"],
      colorNames: ["Jet Black", "Auburn", "Honey Blonde"],
      rating: 4.8,
      reviews: 76,
      stock: 10,
      hot: false,
      new: true,
      tone: "#A3245C",
      texture: "curly",
      image: "",
      description: "Chic and modern curly bob wig with an HD lace front that disappears into your skin. The curl pattern is defined, bouncy, and holds its shape without frizz. Bold meets elegant.",
      features: ["Curly Bob Style", "HD Undetectable Lace", "Pre-styled", "Frizz-resistant", "Easy Maintenance", "Day-to-night versatile"]
    },
    {
      id: 8,
      name: "Peruvian Loose Wave Bundle",
      type: "Bundle Deal",
      category: "bundles",
      price: 58000,
      oldPrice: null,
      currency: "₦",
      lengths: ["10\"", "12\"", "14\"", "16\"", "18\"", "20\""],
      colors: ["#1a1008", "#3d2b1f"],
      colorNames: ["Natural Black", "Dark Brown"],
      rating: 4.7,
      reviews: 32,
      stock: 18,
      hot: false,
      new: false,
      tone: "#A9842C",
      texture: "loose",
      image: "",
      description: "Peruvian loose wave bundles with the perfect blend of straight and wavy. Extremely soft texture, minimal shedding. The natural lustre of Peruvian hair is unmatched.",
      features: ["Peruvian Virgin Hair", "Loose Wave Pattern", "Natural Lustre", "Low Shedding", "Can be curled", "3-4 bundles for full head"]
    },
    {
      id: 9,
      name: "Water Wave Glueless Wig",
      type: "Glueless Wig",
      category: "wigs",
      price: 88000,
      oldPrice: 105000,
      currency: "₦",
      lengths: ["14\"", "16\"", "18\"", "20\"", "22\"", "24\""],
      colors: ["#1a1008", "#2b1d0e", "#3d2b1f"],
      colorNames: ["Jet Black", "Off Black", "Dark Brown"],
      rating: 4.9,
      reviews: 89,
      stock: 14,
      hot: true,
      new: false,
      tone: "#2C5F8A",
      texture: "water",
      image: "",
      description: "Put it on in 60 seconds, no glue, no tape, no mess. This glueless water wave wig features an adjustable band and combs that secure it firmly. The water wave texture is playful yet polished.",
      features: ["Glueless Installation", "Adjustable Band + Combs", "60-Second Install", "Water Wave Texture", "Beginner-Friendly", "Protects Natural Hair"]
    },
    {
      id: 10,
      name: "Highlight Ombre Bundle Set",
      type: "Coloured Bundles",
      category: "bundles",
      price: 92000,
      oldPrice: null,
      currency: "₦",
      lengths: ["14\"", "16\"", "18\"", "20\""],
      colors: ["#c8a96e", "#8b5e3c", "#f5d5a0"],
      colorNames: ["Honey Ombre", "Caramel Ombre", "Ash Ombre"],
      rating: 4.8,
      reviews: 47,
      stock: 9,
      hot: false,
      new: true,
      tone: "#C0862A",
      texture: "body",
      ombre: true,
      image: "",
      description: "Pre-coloured ombre highlight bundles by our in-house colour artists. Beautifully blended tones from root to tip. You get the colour without the chemical damage.",
      features: ["Pre-Coloured", "Professional Ombre Blend", "Zero Chemical Damage to Your Hair", "Balayage Effect", "Instant Colour Pop", "Heat-resistant colour"]
    },
    {
      id: 11,
      name: "Ponytail Extension Wrap",
      type: "Ponytail Extension",
      category: "extensions",
      price: 32000,
      oldPrice: 38000,
      currency: "₦",
      lengths: ["14\"", "18\"", "22\"", "26\""],
      colors: ["#1a1008", "#3d2b1f", "#c8a96e", "#f5d5a0"],
      colorNames: ["Jet Black", "Dark Brown", "Honey Blonde", "Platinum"],
      rating: 4.6,
      reviews: 55,
      stock: 40,
      hot: false,
      new: false,
      tone: "#7D6BA8",
      texture: "straight",
      image: "",
      description: "Achieve the perfect sleek high pony or low bun in minutes. Wrap-around design means no clips, no damage. The drawstring system creates a tight, natural-looking base.",
      features: ["Wrap-Around Design", "Drawstring System", "No Clips / No Damage", "Sleek or Curly Option", "Match any outfit", "Easy to style"]
    },
    {
      id: 12,
      name: "U-Part Human Hair Wig",
      type: "U-Part Wig",
      category: "wigs",
      price: 68000,
      oldPrice: null,
      currency: "₦",
      lengths: ["14\"", "16\"", "18\"", "20\"", "22\""],
      colors: ["#1a1008", "#2b1d0e"],
      colorNames: ["Natural Black", "Off Black"],
      rating: 4.7,
      reviews: 28,
      stock: 16,
      hot: false,
      new: false,
      tone: "#6B4A3A",
      texture: "straight",
      image: "",
      description: "The U-part wig blends your own natural hair through the U-shaped opening for the most undetectable, seamless look. Great for natural hair ladies who want to protect while looking polished.",
      features: ["Blends Your Natural Hair", "Most Undetectable Look", "U-Shaped Opening", "Clips & Combs Included", "Protective Style", "No Lace Required"]
    }
  ],

  testimonials: [
    {
      body: "I've bought from so many hair vendors and Baddie Strands is on a different level. My closure wig has been through everything — gym, beach, sweat — and it still looks brand new three months later.",
      name: "Adaeze O.",
      location: "Lagos, Nigeria",
      stars: 5,
      avatar: "A"
    },
    {
      body: "The quality of their bone straight wig left me speechless. People on the street thought it was my natural hair. The lace literally disappears. Nothing compares.",
      name: "Fatima K.",
      location: "Abuja, Nigeria",
      stars: 5,
      avatar: "F"
    },
    {
      body: "Fast delivery to Enugu, great packaging — the wig was wrapped so carefully. The 4C afro wig is everything I wanted. Finally a store that celebrates African texture!",
      name: "Chidinma E.",
      location: "Enugu, Nigeria",
      stars: 5,
      avatar: "C"
    },
    {
      body: "I ordered the deep wave wig and it arrived within 24 hours in Lagos. The communication was so smooth via WhatsApp. Best customer experience in the hair game.",
      name: "Blessing A.",
      location: "Port Harcourt, Nigeria",
      stars: 5,
      avatar: "B"
    },
    {
      body: "As a UK-based Nigerian, I was nervous about international delivery. They kept me updated throughout. Wig arrived beautifully, worth every penny. I'm a customer for life.",
      name: "Toyin M.",
      location: "London, UK",
      stars: 5,
      avatar: "T"
    },
    {
      body: "I did their hair quiz and they helped me pick the perfect wig for my face shape and lifestyle. That personal touch — that's why they're the best in the business.",
      name: "Precious N.",
      location: "Ibadan, Nigeria",
      stars: 5,
      avatar: "P"
    }
  ],

  // ── THE FOUR TEXTURES (the scroll story on the homepage) ───
  // product: the id shown with the chapter; shade: which of its shades.
  chapters: [
    { texture: "bone", title: "Bone straight", line: "Heavy, sleek and mirror-shiny. It stays straight even when Abuja turns humid.", product: 5, shade: 0, bg: "#6F0A3A", ink: "#F6E2D3" },
    { texture: "body", title: "Body wave", line: "Soft S-waves with bounce. The \u201cI woke up like this\u201d texture.", product: 2, shade: 2, bg: "#1C4448", ink: "#F6E2D3" },
    { texture: "deep", title: "Deep wave", line: "Tight, defined ripples and serious volume. For when you want the room to notice.", product: 3, shade: 0, bg: "#C0D2CC", ink: "#230B06" },
    { texture: "coily", title: "Kinky coily", line: "4C texture that blends with your own. Your roots, celebrated.", product: 4, shade: 0, bg: "#DDA63A", ink: "#230B06" }
  ],

  // ── THE STYLIST ("Find your crown") ─────────────────────────
  stylist: {
    moves: [
      { id: "sleek", label: "Sleek and straight", textures: ["bone", "straight"], show: "bone" },
      { id: "waves", label: "Soft waves", textures: ["body", "loose", "water"], show: "body" },
      { id: "curls", label: "Defined curls", textures: ["deep", "curly"], show: "deep" },
      { id: "coils", label: "Coily, like mine", textures: ["coily"], show: "coily" }
    ],
    kinds: [
      { id: "wigs", label: "A wig I can just put on" },
      { id: "bundles", label: "Bundles for my stylist" },
      { id: "extensions", label: "A quick add-on" },
      { id: "any", label: "Surprise me" }
    ]
  },

  // ── LENGTH GUIDE ───────────────────────────────────────────
  // Where straight hair of each length falls on a 5ft 5in frame.
  lengthGuide: [
    { upTo: 9, label: "chin" }, { upTo: 11, label: "neck" }, { upTo: 13, label: "shoulders" },
    { upTo: 15, label: "just past the shoulders" }, { upTo: 17, label: "armpits" }, { upTo: 19, label: "bra strap" },
    { upTo: 21, label: "mid-back" }, { upTo: 23, label: "lower back" }, { upTo: 25, label: "waist" },
    { upTo: 27, label: "hips" }, { upTo: 29, label: "tailbone" }, { upTo: 99, label: "below the hips" }
  ],

  // ── ANSWERS ("Ask us anything") ────────────────────────────
  // Delivery answers are written from DELIVERY below, so they stay in step.
  faq: [
    { group: "Delivery", q: "How fast can I get it?", a: "@delivery-local" },
    { group: "Delivery", q: "Do you ship outside Nigeria?", a: "@delivery-intl" },
    { group: "The hair", q: "Virgin or Remy, what\u2019s the difference?", a: "Virgin hair has never been chemically processed. Remy means the cuticles all run the same way, so it doesn\u2019t tangle. Everything we sell is both." },
    { group: "The hair", q: "Which lace should I go for?", a: "HD lace is the thinnest and disappears on every skin tone. Regular lace is a little thicker and lasts longer. A 13\u00d74 frontal covers ear to ear, 13\u00d76 gives you more room to part, and 360 lace goes all the way round." },
    { group: "The hair", q: "How full should it be?", a: "That\u2019s density. 150% looks natural and light, 180% is full and glamorous, and 200% is maximum volume. Pick for the look you want and how much weight you\u2019re happy to carry." },
    { group: "The hair", q: "Why does my curly unit look shorter?", a: "Length is measured with the hair pulled straight. A 20\u2033 straight unit reaches mid-back; a 20\u2033 curly one sits higher because of shrinkage. The stylist above shows you where each length lands." },
    { group: "The hair", q: "Which cap is right for me?", a: "Machine-made caps cost less but breathe less. Hand-tied caps move more naturally. Glueless caps have an adjustable band and combs, so you can put them on in about a minute." },
    { group: "Care", q: "How do I wash it?", a: "Detangle from the ends up first. Use a sulphate-free shampoo in downward strokes, never circles. Deep condition for 15 to 30 minutes, rinse with cool water to seal the cuticle, then pat dry and let it air-dry on a stand." },
    { group: "Care", q: "Can I use heat on it?", a: "Yes. Always use a heat protectant. Keep fine or coloured hair at 150\u2013180\u00b0C and never go above 230\u00b0C. Let curls cool in your hand before you let go, then set them with cool air." },
    { group: "Care", q: "How do I keep it soft between washes?", a: "Spritz with water and a little leave-in. Once a week, layer water, then oil, then cream. Trim the ends every three months, and sleep on silk or satin." },
    { group: "Care", q: "How should I store it?", a: "On a wig stand, detangled, out of direct sun. When you travel, use a silk or satin bag. Cotton pulls moisture out." },
    { group: "Ordering", q: "How do I pay?", a: "By card through Paystack, or by bank transfer. If neither suits you, place the order and finish it with us on WhatsApp." },
    { group: "Ordering", q: "Can you get something you don\u2019t list?", a: "Often, yes. Tell us the length, texture and shade in the box below and we\u2019ll reply within two hours." }
  ]
};

// ── DELIVERY ZONES (shown in the delivery section) ───────────
// days: [soonest, latest] in days from dispatch. 0 = same day.
const DELIVERY = {
  local: [
    { zone: "Abuja (same-day)", price: "₦1,500", time: "3–6 hours", days: [0, 0] },
    { zone: "Abuja environs", price: "₦2,000", time: "Same day", days: [0, 0] },
    { zone: "Lagos", price: "₦2,500", time: "1–2 days", days: [1, 2] },
    { zone: "Port Harcourt", price: "₦3,000", time: "1–2 days", days: [1, 2] },
    { zone: "Other Nigerian states", price: "₦3,000–₦3,500", time: "2–4 days", days: [2, 4] }
  ],
  international: [
    { zone: "UK & Europe", price: "From $35", time: "5–10 business days", days: [5, 10] },
    { zone: "USA & Canada", price: "From $40", time: "7–14 business days", days: [7, 14] },
    { zone: "West Africa", price: "From ₦15,000", time: "5–10 business days", days: [5, 10] },
    { zone: "Rest of Africa", price: "From $30", time: "7–14 business days", days: [7, 14] }
  ]
};

// ── DELIVERY FEES (₦, used by checkout to work out totals) ───
// Keys are the states offered in the checkout form.
const DELIVERY_FEES = {
  'FCT – Abuja': 1500, 'Nasarawa': 2000, 'Niger': 2500,
  'Lagos': 2500, 'Ogun': 2500, 'Oyo': 2500, 'Osun': 2500,
  'Ondo': 2500, 'Ekiti': 2500, 'Kwara': 2500,
  'Delta': 3000, 'Edo': 3000, 'Rivers': 3000, 'Cross River': 3000,
  'Akwa Ibom': 3000, 'Bayelsa': 3000, 'Anambra': 3000, 'Imo': 3000,
  'Abia': 3000, 'Enugu': 3000, 'Ebonyi': 3000, 'Benue': 3000, 'Kogi': 3000,
  'Kaduna': 3500, 'Kano': 3500, 'Katsina': 3500, 'Sokoto': 3500,
  'Zamfara': 3500, 'Kebbi': 3500, 'Jigawa': 3500, 'Gombe': 3500,
  'Bauchi': 3500, 'Borno': 3500, 'Yobe': 3500, 'Taraba': 3500,
  'Adamawa': 3500, 'Plateau': 3500
};
const DELIVERY_FEE_DEFAULT = 3500;

if (typeof module !== 'undefined') module.exports = { STORE_DATA, DELIVERY, DELIVERY_FEES };
