// ============================================================
// BADDIE STRANDS — Store Data
// Edit this file to update products, delivery zones,
// testimonials, quiz questions, and knowledge content.
// This file is loaded by index.html via <script src="data.js">
// ============================================================

const STORE_DATA = {

  // ── PRODUCTS ───────────────────────────────────────────────
  // To add a product: copy any object below, give it a new id,
  // fill in the details, and it will appear on the site instantly.
  // For `image`: use a local filename (e.g. "my-wig.jpg") placed
  // in the same folder, or a full https:// URL.

  products: [
    {
      id: 1,
      name: "Remy Velvet Closure Wig",
      type: "Closure Wig",
      category: "wigs",           // "wigs" | "bundles" | "extensions"
      price: 85000,
      oldPrice: 110000,           // set to null if no sale price
      currency: "₦",
      lengths: ['12"','14"','16"','18"','20"','22"','24"'],
      colors: ["#1a1008","#3d2b1f","#6b3a2a","#c8a96e"],
      colorNames: ["Jet Black","Dark Brown","Auburn","Blonde"],
      rating: 4.9,
      reviews: 142,
      stock: 15,
      hot: true,                  // shows "Bestseller" badge
      new: false,                 // shows "New In" badge
      image: "1001017209.jpg",    // your actual product photo
      description: "100% virgin Remy human hair. Silky smooth texture, full cuticle intact, tangle-free. 5×5 HD lace closure that melts seamlessly into your skin. Perfect for beginners and professionals alike.",
      features: [
        "100% Virgin Human Hair",
        "HD Lace Closure",
        "Pre-plucked Hairline",
        "Bleached Knots",
        "180% Density",
        "Can be bleached & dyed"
      ]
    },
    {
      id: 2,
      name: "Brazilian Body Wave Bundle",
      type: "Bundle Deal",
      category: "bundles",
      price: 65000,
      oldPrice: null,
      currency: "₦",
      lengths: ['10"','12"','14"','16"','18"','20"'],
      colors: ["#1a1008","#3d2b1f","#c8a96e"],
      colorNames: ["Natural Black","Dark Brown","Honey Blonde"],
      rating: 4.8,
      reviews: 87,
      stock: 28,
      hot: false,
      new: true,
      image: "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&q=80",
      description: "Luxurious Brazilian body wave bundles with a natural bounce and flow. Double-wefted for fullness, zero shedding. The wave pattern holds beautifully whether wet or dry.",
      features: [
        "Brazilian Virgin Hair",
        "Double Wefted",
        "Zero Shedding",
        "Natural Wave Pattern",
        "Can be heat styled",
        "3 bundles recommended for full look"
      ]
    },
    {
      id: 3,
      name: "Deep Wave Frontal Wig",
      type: "Frontal Wig",
      category: "wigs",
      price: 120000,
      oldPrice: 145000,
      currency: "₦",
      lengths: ['14"','16"','18"','20"','22"','24"','26"'],
      colors: ["#1a1008","#2b1d0e"],
      colorNames: ["Jet Black","Off Black"],
      rating: 5.0,
      reviews: 63,
      stock: 8,
      hot: true,
      new: false,
      image: "https://images.unsplash.com/photo-1530519729491-aea5b51d1ee1?w=600&q=80",
      description: "Stunning deep wave pattern with a 13×6 HD lace frontal. Creates a natural-looking hairline from ear to ear. The deep, defined curls add incredible volume and drama.",
      features: [
        "13×6 HD Lace Frontal",
        "Deep Wave Pattern",
        "Ear-to-ear Coverage",
        "Pre-bleached Knots",
        "200% Density",
        "Glueless installation option"
      ]
    },
    {
      id: 4,
      name: "Kinky Coily 4C Afro Wig",
      type: "Afro Wig",
      category: "wigs",
      price: 95000,
      oldPrice: null,
      currency: "₦",
      lengths: ['10"','12"','14"','16"'],
      colors: ["#1a1008","#2b1505","#6b3a2a"],
      colorNames: ["Natural Black","Dark Espresso","Reddish Brown"],
      rating: 4.7,
      reviews: 54,
      stock: 12,
      hot: false,
      new: true,
      image: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=600&q=80",
      description: "Authentic 4C coily texture crafted from virgin African hair. Celebrate your roots with unmatched realism and a hairline that disappears into your skin.",
      features: [
        "Authentic 4C Texture",
        "Virgin African Hair",
        "Lace Front",
        "Protective Style",
        "No Heat Needed",
        "Afrocentric Design"
      ]
    },
    {
      id: 5,
      name: "Bone Straight Silky Wig",
      type: "Bone Straight",
      category: "wigs",
      price: 78000,
      oldPrice: 92000,
      currency: "₦",
      lengths: ['14"','16"','18"','20"','22"','24"','28"'],
      colors: ["#1a1008","#2b1d0e","#f5d5a0"],
      colorNames: ["Jet Black","Off Black","Platinum"],
      rating: 4.9,
      reviews: 118,
      stock: 20,
      hot: true,
      new: false,
      image: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=600&q=80",
      description: "The sleekest, glossiest bone straight wig on the market. Light as air, zero frizz, razor-flat from root to tip. HD lace that vanishes on all skin tones.",
      features: [
        "Bone Straight",
        "Mirror Shine",
        "HD Lace",
        "Zero Frizz",
        "Can be curled",
        "Pre-plucked"
      ]
    },
    {
      id: 6,
      name: "Water Wave Glueless Wig",
      type: "Glueless Wig",
      category: "wigs",
      price: 88000,
      oldPrice: 105000,
      currency: "₦",
      lengths: ['14"','16"','18"','20"','22"'],
      colors: ["#1a1008","#2b1d0e","#3d2b1f"],
      colorNames: ["Jet Black","Off Black","Dark Brown"],
      rating: 4.9,
      reviews: 89,
      stock: 14,
      hot: true,
      new: false,
      image: "https://images.unsplash.com/photo-1489980557514-251d61e3eeb6?w=600&q=80",
      description: "Put it on in 60 seconds — no glue, no tape, no mess. Adjustable band and combs that secure it firmly all day. The water wave texture is playful yet polished.",
      features: [
        "Glueless Installation",
        "Adjustable Band + Combs",
        "60-Second Install",
        "Water Wave Texture",
        "Beginner-Friendly",
        "Protects Natural Hair"
      ]
    },
    {
      id: 7,
      name: "Highlight Ombre Bundle Set",
      type: "Coloured Bundles",
      category: "bundles",
      price: 92000,
      oldPrice: null,
      currency: "₦",
      lengths: ['14"','16"','18"','20"'],
      colors: ["#c8a96e","#8b5e3c","#f5d5a0"],
      colorNames: ["Honey Ombre","Caramel Ombre","Ash Ombre"],
      rating: 4.8,
      reviews: 47,
      stock: 9,
      hot: false,
      new: true,
      image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&q=80",
      description: "Pre-coloured ombre highlight bundles by our in-house colour artists. Beautifully blended tones from root to tip. The colour without the chemical damage.",
      features: [
        "Pre-Coloured",
        "Professional Ombre Blend",
        "Zero Chemical Damage",
        "Balayage Effect",
        "Instant Colour Pop",
        "Heat-resistant colour"
      ]
    },
    {
      id: 8,
      name: "Ponytail Extension Wrap",
      type: "Ponytail Extension",
      category: "extensions",
      price: 32000,
      oldPrice: 38000,
      currency: "₦",
      lengths: ['14"','18"','22"','26"'],
      colors: ["#1a1008","#3d2b1f","#c8a96e","#f5d5a0"],
      colorNames: ["Jet Black","Dark Brown","Honey Blonde","Platinum"],
      rating: 4.6,
      reviews: 55,
      stock: 40,
      hot: false,
      new: false,
      image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80",
      description: "The perfect sleek high pony or low bun in minutes. Wrap-around design means no clips, no damage. The drawstring system creates a tight, natural-looking base.",
      features: [
        "Wrap-Around Design",
        "Drawstring System",
        "No Clips / No Damage",
        "Sleek or Curly Option",
        "Easy to style",
        "Match any outfit"
      ]
    },
    {
      id: 9,
      name: "Clip-In Volume Extensions",
      type: "Clip-In Extensions",
      category: "extensions",
      price: 28000,
      oldPrice: null,
      currency: "₦",
      lengths: ['14"','16"','18"','20"'],
      colors: ["#1a1008","#3d2b1f","#6b3a2a"],
      colorNames: ["Jet Black","Dark Brown","Auburn"],
      rating: 4.5,
      reviews: 38,
      stock: 50,
      hot: false,
      new: false,
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80",
      description: "Add instant length and volume in minutes. Premium clip-in extensions with strong, comfortable clips that hold all day without slipping.",
      features: [
        "Easy Clip-In",
        "Instant Volume",
        "Strong Clips",
        "Blends Naturally",
        "Reusable",
        "Heat-safe up to 180°C"
      ]
    },
    {
      id: 10,
      name: "Malaysian Straight Bundle",
      type: "Bundle Deal",
      category: "bundles",
      price: 55000,
      oldPrice: null,
      currency: "₦",
      lengths: ['10"','12"','14"','16"','18"'],
      colors: ["#1a1008","#3d2b1f"],
      colorNames: ["Natural Black","Dark Brown"],
      rating: 4.6,
      reviews: 44,
      stock: 35,
      hot: false,
      new: false,
      image: "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=600&q=80",
      description: "Premium Malaysian straight hair known for its natural lustre and incredible softness. Minimal shedding, maximum impact.",
      features: [
        "Malaysian Virgin Hair",
        "Natural Lustre",
        "Low Shedding",
        "Straight Pattern",
        "Can be styled",
        "3–4 bundles for full head"
      ]
    },
    {
      id: 11,
      name: "Loose Deep Wave Wig",
      type: "Loose Wave Wig",
      category: "wigs",
      price: 98000,
      oldPrice: 115000,
      currency: "₦",
      lengths: ['14"','16"','18"','20"','22"'],
      colors: ["#1a1008","#3d2b1f","#c8a96e"],
      colorNames: ["Natural Black","Dark Brown","Honey"],
      rating: 4.8,
      reviews: 72,
      stock: 11,
      hot: false,
      new: true,
      image: "https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=600&q=80",
      description: "The perfect blend of loose waves and deep curls. Voluminous, romantic, and effortlessly glamorous. HD lace that disappears on all skin tones.",
      features: [
        "Loose Deep Pattern",
        "Full Volume",
        "HD Lace",
        "Pre-plucked",
        "Glueless option",
        "Beginner-friendly"
      ]
    },
    {
      id: 12,
      name: "U-Part Human Hair Wig",
      type: "U-Part Wig",
      category: "wigs",
      price: 68000,
      oldPrice: null,
      currency: "₦",
      lengths: ['14"','16"','18"','20"','22"'],
      colors: ["#1a1008","#2b1d0e"],
      colorNames: ["Natural Black","Off Black"],
      rating: 4.7,
      reviews: 28,
      stock: 16,
      hot: false,
      new: false,
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80",
      description: "Blends your natural hair through the U-shaped opening for the most undetectable, seamless look. Perfect for natural hair lovers who want to protect while looking polished.",
      features: [
        "Blends Natural Hair",
        "Most Undetectable Look",
        "U-Shaped Opening",
        "Clips & Combs Included",
        "Protective Style",
        "No Lace Required"
      ]
    }
  ],


  // ── KNOWLEDGE HUB ─────────────────────────────────────────
  knowledge: {
    basics: [
      {
        num: "01",
        title: "Know Your Hair Type",
        body: "From 1A to 4C — understanding your curl pattern, porosity, and density is the first step. High porosity hair absorbs moisture fast but loses it just as quickly. Low porosity needs heat to open the cuticle. Knowing this changes everything.",
        link: "Explore Hair Types"
      },
      {
        num: "02",
        title: "Virgin vs Remy Hair",
        body: "Virgin hair has never been chemically processed — it is the purest form. Remy hair means the cuticles are aligned in one direction, preventing tangling. All Baddie Strands products are virgin AND Remy — never settle for less.",
        link: "Learn the Difference"
      },
      {
        num: "03",
        title: "Lace Types Explained",
        body: "HD lace is the thinnest, most transparent — it disappears on all skin tones. 13×4 covers ear-to-ear, 13×6 adds depth for parting, 360 lace covers the full perimeter. Choose based on your styling needs.",
        link: "Compare Lace Types"
      },
      {
        num: "04",
        title: "Density Guide",
        body: "Density is how full the wig looks. 150% is natural and light. 180% is full and glamorous. 200% is the maximum — dramatic, show-stopping volume. Choose based on your lifestyle and the look you want.",
        link: "Find Your Density"
      },
      {
        num: "05",
        title: "Reading Hair Length",
        body: "Hair is measured in its straightened state. A 20\" straight wig hits mid-back. A 20\" curly wig may appear much shorter due to shrinkage. Always account for your texture when choosing length.",
        link: "Length Visual Guide"
      },
      {
        num: "06",
        title: "Cap Construction",
        body: "The cap is the foundation. Machine-made caps are budget-friendly but less breathable. Hand-tied caps move more naturally. Glueless caps have adjustable bands for a secure no-glue fit. Choose based on comfort and activity level.",
        link: "Cap Types Guide"
      }
    ],

    care: {
      "Washing": [
        { title: "Detangle Before Washing",    body: "Always detangle from tips to roots using a wide-tooth comb or your fingers. Never start from the root — you will cause unnecessary breakage and matting." },
        { title: "Use Sulphate-Free Shampoo",  body: "Sulphates strip the hair of natural oils. Use a moisturising, sulphate-free shampoo diluted slightly in warm water for a gentle, even cleanse." },
        { title: "Wash in Downward Strokes",   body: "Work the shampoo gently downward, following the direction of the cuticle. Never scrub in circular motions — this causes frizz and tangling." },
        { title: "Deep Condition Every Wash",  body: "Apply conditioner from mid-shaft to ends. Leave for 15–30 minutes under a plastic cap. Human hair needs this external moisture since it no longer receives natural scalp oils." },
        { title: "Rinse with Cool Water",      body: "Always finish with a cool water rinse. Cold water closes the cuticle, sealing in moisture and locking in that mirror shine." },
        { title: "Air Dry or Low Heat",        body: "Pat gently with a microfibre towel — never rub. Air dry on a wig stand or use a blow dryer on the lowest heat setting with a diffuser." }
      ],
      "Styling": [
        { title: "Always Use Heat Protectant",         body: "Even if the hair is heat resistant, apply a thermal protectant spray before any heat styling. This preserves the integrity of the hair and extends its lifespan significantly." },
        { title: "Flat Iron at the Right Temperature", body: "For fine or coloured hair, use 150–180°C. For thick, coarse hair, go up to 220°C. Never exceed 230°C. Use professional-grade flat irons for smooth, even results." },
        { title: "Curl with a Wand, Set with Cool Air",body: "After curling, let each curl cool completely before releasing — this sets the curl for all-day hold. Hit with cool air from a dryer to lock them in place." },
        { title: "Avoid Alcohol-Based Products",       body: "Many hairsprays and styling gels contain drying alcohols. Check the label for ethanol or isopropyl alcohol — these will dry out and damage your hair over time." }
      ],
      "Storage": [
        { title: "Always Store on a Wig Stand",  body: "A wig stand maintains the shape of the cap and prevents the hair from being crushed or tangled. Invest in a quality mannequin head or collapsible wig stand." },
        { title: "Silk or Satin-Lined Bags",     body: "When travelling, place your wig in a silk or satin bag. Cotton absorbs moisture and causes frizz. Silk preserves moisture and keeps the cuticle smooth." },
        { title: "Detangle Before Storing",      body: "Never put a wig away tangled. Always finger-detangle or brush through before storage. Tangles worsen over time and become much harder to remove later." },
        { title: "Avoid Direct Sunlight",        body: "UV rays fade colour and weaken the hair shaft. Store wigs away from windows. If in the sun for extended periods, use a UV protectant hair spray." }
      ],
      "Maintenance": [
        { title: "Refresh Between Washes",    body: "Spritz your hair lightly with water and scrunch to revive curls or waves. Add a light leave-in conditioner or serum for shine and frizz control between wash days." },
        { title: "Moisturise Weekly",         body: "Use the LOC method: Liquid (water), Oil (argan or jojoba), then Cream (shea butter or leave-in conditioner). This locks moisture in for longer periods." },
        { title: "Trim Ends Every 3 Months",  body: "Even human hair gets split ends with regular heat and manipulation. A small trim every 3 months keeps ends healthy, bouncy, and tangle-free." },
        { title: "Sleep on Silk or Satin",    body: "Cotton pillowcases cause friction, frizz, and breakage while you sleep. Switch to a silk pillowcase, or use a silk bonnet when sleeping. Your hair will thank you." }
      ]
    }
  },


  // ── TESTIMONIALS ──────────────────────────────────────────
  // Add more by copying any object below.
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
      body: "Fast delivery to Enugu, beautiful packaging — the wig was wrapped so carefully. The 4C afro wig is everything I wanted. Finally a store that celebrates African texture.",
      name: "Chidinma E.",
      location: "Enugu, Nigeria",
      stars: 5,
      avatar: "C"
    },
    {
      body: "Ordered the deep wave wig and it arrived quickly. Communication was smooth and professional. Best customer experience in the hair game.",
      name: "Blessing A.",
      location: "Port Harcourt, Nigeria",
      stars: 5,
      avatar: "B"
    },
    {
      body: "I did their hair quiz and they helped me pick the perfect wig for my face shape and lifestyle. That personal touch is why they are the best in the business.",
      name: "Precious N.",
      location: "Ibadan, Nigeria",
      stars: 5,
      avatar: "P"
    }
  ],


  // ── HAIR QUIZ ─────────────────────────────────────────────
  // 5 questions. Each has exactly 4 options.
  // The quiz logic in index.html uses answer index 2 (texture)
  // and index 4 (budget) for product matching.
  quiz: [
    {
      q: "What is your lifestyle like?",
      options: [
        "Very active — gym, sports, outdoor",
        "Office life — sleek and professional",
        "Social butterfly — events and parties",
        "Stay-at-home — comfort first"
      ]
    },
    {
      q: "How much styling time do you have daily?",
      options: [
        "5 minutes max",
        "10–20 minutes",
        "30+ minutes",
        "I love styling — no limit"
      ]
    },
    {
      q: "What is your preferred hair texture?",
      options: [
        "Straight and sleek",
        "Wavy and natural",
        "Curly and bouncy",
        "Coily and natural"
      ]
    },
    {
      q: "What is your priority?",
      options: [
        "Undetectable lace look",
        "Maximum volume",
        "Long-lasting durability",
        "Easy maintenance"
      ]
    },
    {
      q: "What is your approximate budget?",
      options: [
        "Under ₦50,000",
        "₦50,000 – ₦80,000",
        "₦80,000 – ₦120,000",
        "Price is no object"
      ]
    }
  ]

};


// ── DELIVERY ZONES ────────────────────────────────────────────
// Shown on the Delivery page.
// Update prices and times here as needed.

const DELIVERY = {
  // Nationwide only for now. International shipping is not offered yet.
  local: [
    { zone: "Abuja (same day)",      price: "₦1,500",        time: "3–6 hours" },
    { zone: "Abuja environs",        price: "₦2,000",        time: "Same day"  },
    { zone: "Lagos & South-West",    price: "₦2,500",        time: "1–2 days"  },
    { zone: "South-South & East",    price: "₦3,000",        time: "1–3 days"  },
    { zone: "North",                 price: "₦3,500",        time: "2–4 days"  }
  ]
};

// Delivery time shown at checkout, keyed by fee.
const DELIVERY_TIMES = { 1500: "3–6 hours", 2000: "Same day", 2500: "1–2 days", 3000: "1–3 days", 3500: "2–4 days" };


// ── DELIVERY FEES (used by checkout to calculate totals) ──────
// Keys must match the option values in the State dropdown exactly.

const DELIVERY_FEES = {
  'FCT – Abuja': 1500,
  'Nasarawa':    2000,
  'Niger':       2500,
  'Lagos':       2500,
  'Ogun':        2500,
  'Oyo':         2500,
  'Osun':        2500,
  'Ondo':        2500,
  'Ekiti':       2500,
  'Kwara':       2500,
  'Delta':       3000,
  'Edo':         3000,
  'Rivers':      3000,
  'Cross River': 3000,
  'Akwa Ibom':   3000,
  'Bayelsa':     3000,
  'Anambra':     3000,
  'Imo':         3000,
  'Abia':        3000,
  'Enugu':       3000,
  'Ebonyi':      3000,
  'Benue':       3000,
  'Kogi':        3000,
  'Kaduna':      3500,
  'Kano':        3500,
  'Katsina':     3500,
  'Sokoto':      3500,
  'Zamfara':     3500,
  'Kebbi':       3500,
  'Jigawa':      3500,
  'Gombe':       3500,
  'Bauchi':      3500,
  'Borno':       3500,
  'Yobe':        3500,
  'Taraba':      3500,
  'Adamawa':     3500,
  'Plateau':     3500,
};
