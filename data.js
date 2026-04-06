// ============================================
// BADDIE STRANDS — Product & Content Data
// ============================================

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
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80",
      images: [
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80",
        "https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=600&q=80"
      ],
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
      image: "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&q=80",
      images: ["https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&q=80"],
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
      image: "https://images.unsplash.com/photo-1530519729491-aea5b51d1ee1?w=600&q=80",
      images: ["https://images.unsplash.com/photo-1530519729491-aea5b51d1ee1?w=600&q=80"],
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
      image: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=600&q=80",
      images: ["https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=600&q=80"],
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
      image: "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&q=80",
      images: ["https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&q=80"],
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
      image: "https://images.unsplash.com/photo-1499557354967-2b2d8910bcca?w=600&q=80",
      images: ["https://images.unsplash.com/photo-1499557354967-2b2d8910bcca?w=600&q=80"],
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
      image: "https://images.unsplash.com/photo-1586116104126-7b8e839d5b9f?w=600&q=80",
      images: ["https://images.unsplash.com/photo-1586116104126-7b8e839d5b9f?w=600&q=80"],
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
      image: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=600&q=80",
      images: ["https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=600&q=80"],
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
      image: "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=600&q=80",
      images: ["https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=600&q=80"],
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
      image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&q=80",
      images: ["https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&q=80"],
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
      image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80",
      images: ["https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80"],
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
      image: "https://images.unsplash.com/photo-1489980557514-251d61e3eeb6?w=600&q=80",
      images: ["https://images.unsplash.com/photo-1489980557514-251d61e3eeb6?w=600&q=80"],
      description: "The U-part wig blends your own natural hair through the U-shaped opening for the most undetectable, seamless look. Great for natural hair ladies who want to protect while looking polished.",
      features: ["Blends Your Natural Hair", "Most Undetectable Look", "U-Shaped Opening", "Clips & Combs Included", "Protective Style", "No Lace Required"]
    }
  ],

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
        body: "Virgin hair has never been chemically processed — it's the purest form. Remy hair means the cuticles are all aligned in one direction, preventing tangling. All Baddie Strands products are virgin AND Remy — never settle for less.",
        link: "Learn the Difference"
      },
      {
        num: "03",
        title: "Lace Types Explained",
        body: "HD lace is the thinnest, most transparent — it disappears on all skin tones. Regular lace is thicker but more durable. 13×4 covers ear-to-ear, 13×6 adds depth for parting, 360 lace covers the full perimeter.",
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
        body: "Hair is measured in its straightened state. A 20\" straight wig hits the mid-back. A 20\" curly wig may appear much shorter due to shrinkage. Always account for your texture when choosing length.",
        link: "Length Visual Guide"
      },
      {
        num: "06",
        title: "Cap Construction",
        body: "The cap is the foundation. Machine-made caps are budget-friendly but less breathable. Hand-tied caps move more naturally. Glueless caps have adjustable bands. Choose your cap based on comfort, lifestyle, and activity level.",
        link: "Cap Types Guide"
      }
    ],
    care: {
      "Washing": [
        { title: "Detangle Before Washing", body: "Always detangle from tips to roots using a wide-tooth comb or your fingers. Never start from the root — you will cause unnecessary breakage and matting." },
        { title: "Use Sulphate-Free Shampoo", body: "Sulphates strip the hair of natural oils. For human hair extensions, use a moisturising, sulphate-free shampoo. Dilute it slightly in a bowl of warm water for an even, gentle cleanse." },
        { title: "Wash in Downward Strokes", body: "Work the shampoo gently downward, following the direction of the cuticle. Never scrub or rub in circular motions — this causes frizz and tangling." },
        { title: "Deep Condition Every Wash", body: "Apply a rich conditioner from mid-shaft to ends. Leave for 15–30 minutes under a plastic cap. Human hair doesn't receive natural oils from a scalp, so it needs this external moisture." },
        { title: "Rinse with Cool Water", body: "Always finish with a cool water rinse. Cold water closes the cuticle, sealing in moisture and locking in that mirror shine." },
        { title: "Air Dry or Low Heat", body: "Pat gently with a microfibre towel — never rub. Air dry on a wig stand or use a blow dryer on the lowest heat setting with a diffuser attachment." }
      ],
      "Styling": [
        { title: "Always Use Heat Protectant", body: "Even if the hair is heat resistant, apply a thermal protectant spray before any heat styling. This preserves the integrity of the hair and extends its lifespan significantly." },
        { title: "Flat Iron at the Right Temperature", body: "For fine or coloured hair, use 150–180°C. For thick, coarse hair, go up to 220°C. Never exceed 230°C. Use professional-grade flat irons for smooth, even results." },
        { title: "Curl with a Wand, Set with Cool Air", body: "After curling, let each curl cool completely in your hand before releasing — this sets the curl for all-day hold. Hit with cool air from a dryer to lock them in place." },
        { title: "Avoid Alcohol-Based Products", body: "Many hairsprays and styling gels contain drying alcohols. Check the label for ethanol or isopropyl alcohol as one of the first ingredients — these will dry out and damage your hair." }
      ],
      "Storage": [
        { title: "Always Store on a Wig Stand", body: "A wig stand maintains the shape of the cap and prevents the hair from being crushed or tangled. Invest in a quality mannequin head or collapsible wig stand." },
        { title: "Silk or Satin-Lined Bags", body: "When travelling or storing a wig for a long time, place it in a silk or satin bag. Cotton absorbs moisture and causes frizz. Silk preserves moisture and keeps the cuticle smooth." },
        { title: "Detangle Before Storing", body: "Never put a wig away tangled. Always finger-detangle or brush through before storage. Tangles worsen over time and become much harder to remove later." },
        { title: "Avoid Direct Sunlight", body: "UV rays fade colour and weaken the hair shaft. Store wigs away from windows or sunlight. If you must be in the sun for extended periods, use a UV protectant hair spray." }
      ],
      "Maintenance": [
        { title: "Refresh Between Washes with Water Spray", body: "Spritz your hair lightly with water and scrunch to revive curls or waves. Add a light leave-in conditioner or hair serum for shine and frizz control." },
        { title: "Moisturise Weekly", body: "Use the LOC or LCO method: Layer Liquid (water), Oil (argan, jojoba, or castor), then Cream (shea butter, leave-in). This locks moisture in for longer periods." },
        { title: "Trim Ends Every 3 Months", body: "Even human hair gets split ends with regular heat and manipulation. A small trim every 3 months keeps the ends healthy, bouncy, and tangle-free." },
        { title: "Sleep on Silk or Satin", body: "Cotton pillowcases cause friction, frizz, and breakage while you sleep. Switch to a silk or satin pillowcase, or use a silk bonnet when sleeping. Your hair will thank you." }
      ]
    }
  },

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

  quiz: [
    {
      q: "What's your lifestyle like?",
      options: ["Very active — gym, sports, outdoor", "Office life — sleek and professional", "Social butterfly — events and parties", "Stay-at-home — comfort first"]
    },
    {
      q: "How much styling time do you have daily?",
      options: ["5 minutes max", "10–20 minutes", "30+ minutes", "I love styling — unlimited!"]
    },
    {
      q: "What's your preferred hair texture?",
      options: ["Straight and sleek", "Wavy and natural", "Curly and bouncy", "Coily and natural"]
    },
    {
      q: "What's your priority?",
      options: ["Undetectable lace look", "Maximum volume", "Long-lasting durability", "Easy maintenance"]
    },
    {
      q: "What's your approximate budget?",
      options: ["Under ₦50,000", "₦50,000 – ₦80,000", "₦80,000 – ₦120,000", "Price is no object"]
    }
  ]
};

// Delivery zones
const DELIVERY = {
  local: [
    { zone: "Lagos (Same-Day)", price: "₦2,000", time: "3–5 hours" },
    { zone: "Lagos (Standard)", price: "₦1,500", time: "24 hours" },
    { zone: "Abuja", price: "₦3,500", time: "1–2 days" },
    { zone: "Port Harcourt", price: "₦3,000", time: "1–2 days" },
    { zone: "Ibadan", price: "₦2,500", time: "1–2 days" },
    { zone: "Other Nigerian States", price: "₦3,500–₦5,000", time: "2–4 days" }
  ],
  international: [
    { zone: "UK & Europe", price: "From $35", time: "5–10 business days" },
    { zone: "USA & Canada", price: "From $40", time: "7–14 business days" },
    { zone: "West Africa", price: "From ₦15,000", time: "5–10 business days" },
    { zone: "Rest of Africa", price: "From $30", time: "7–14 business days" }
  ]
};

if (typeof module !== 'undefined') module.exports = { STORE_DATA, DELIVERY };
