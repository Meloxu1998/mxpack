export const site = {
  name: 'MXPACKPRO',
  domain: 'https://mxpackpro.com',
  email: 'meloxu98@gmail.com',
  phone: '+86 155 2116 3050',
  phoneHref: '+8615521163050',
  whatsapp: '447704644465',
  company: 'Foshan Xumelo Technology Co., Ltd.',
  location: 'Foshan, China'
};

export const nav = [
  { label: 'Products', href: 'products.html', items: [
    ['All Packaging', 'products.html'],
    ['Takeout Food Boxes', 'takeaway-food-boxes.html'],
    ['Burger Boxes', 'burger-boxes.html'],
    ['Pizza Boxes', 'pizza-boxes.html'],
    ['Bakery & Cake Boxes', 'bakery-cake-boxes.html'],
    ['Paper Bags', 'custom-paper-bags.html']
  ]},
  { label: 'Solutions', href: 'solutions.html', items: [
    ['Restaurants & Takeaway', 'restaurant-takeaway-packaging.html'],
    ['Catering & Events', 'catering-event-packaging.html'],
    ['Food Brands & Retail', 'food-brand-retail-packaging.html'],
    ['Low MOQ for Startups', 'low-moq-startups.html'],
    ['Enterprise Projects', 'enterprise-packaging.html']
  ]},
  { label: 'Custom Packaging', href: 'custom-packaging.html', items: [
    ['How Custom Packaging Works', 'custom-packaging.html'],
    ['Materials & Food Safety', 'materials-food-safety.html'],
    ['Printing & Artwork', 'custom-packaging.html#printing'],
    ['Samples & Prototyping', 'custom-packaging.html#samples'],
    ['Request a Dieline', 'get-a-quote.html']
  ]},
  { label: 'Resources', href: 'resources.html', items: [
    ['Resource Center', 'resources.html'],
    ['Packaging Buying Guide', 'packaging-buying-guide.html'],
    ['MOQ & Pricing Guide', 'moq-pricing-guide.html'],
    ['Materials Guide', 'materials-food-safety.html'],
    ['Frequently Asked Questions', 'faq.html']
  ]},
  { label: 'Company', href: 'about-us.html', items: [
    ['About MX PACK', 'about-us.html'],
    ['How We Work', 'about-us.html#process'],
    ['Quality Approach', 'about-us.html#quality'],
    ['Contact Us', 'get-a-quote.html'],
    ['FAQ', 'faq.html']
  ]}
];

export const products = [
  {
    slug: 'burger-boxes',
    name: 'Clamshell Burger Boxes',
    shortName: 'Burger Boxes',
    image: 'products/clamshell-burger-box.webp',
    description: 'Secure, grease-resistant clamshell packaging for burgers, sandwiches and hot takeaway meals.',
    material: 'Kraft or white food-grade paperboard',
    structure: 'Clamshell with locking tabs',
    coating: 'Grease-resistant barrier options',
    use: ['Burgers', 'Sandwiches', 'Chicken', 'Loaded meals']
  },
  {
    slug: 'takeaway-food-boxes',
    name: 'Fold-Top Takeout Boxes',
    shortName: 'Takeout Boxes',
    image: 'products/fold-top-takeout-box.webp',
    description: 'Space-efficient folding cartons for noodles, rice dishes, snacks and takeaway service.',
    material: 'Kraft or white food-grade paperboard',
    structure: 'Fold-top carton with interlocking flaps',
    coating: 'PE or water-based barrier by project',
    use: ['Noodles', 'Rice dishes', 'Snacks', 'Deli meals']
  },
  {
    slug: 'pizza-boxes',
    name: 'Custom Pizza Boxes',
    shortName: 'Pizza Boxes',
    image: 'products/pizza-box.webp',
    description: 'Strong, stackable corrugated boxes for hot pizza, flat foods and delivery orders.',
    material: 'Food-contact corrugated board',
    structure: 'Flat-pack folding pizza carton',
    coating: 'Uncoated or grease-resistant options',
    use: ['Pizza', 'Flatbreads', 'Pastries', 'Sharing meals']
  },
  {
    slug: 'custom-paper-bags',
    name: 'Custom Paper Bags',
    shortName: 'Paper Bags',
    image: 'home/category-paper-bag.webp',
    description: 'Branded kraft and white paper bags for takeaway, retail food and delivery orders.',
    material: 'Kraft or white paper',
    structure: 'Twisted or flat handle construction',
    coating: 'Uncoated; specialty finishes by project',
    use: ['Takeaway', 'Bakery', 'Retail', 'Catering']
  },
  {
    slug: 'bakery-cake-boxes',
    name: 'Bakery & Cake Boxes',
    shortName: 'Bakery Boxes',
    image: 'home/category-custom-packaging.webp',
    description: 'Presentation-focused boxes with window, handle and insert options for desserts and cakes.',
    material: 'Food-grade paperboard or corrugated board',
    structure: 'Folding, window or handled formats',
    coating: 'Food-contact and grease-resistant options',
    use: ['Cakes', 'Pastries', 'Desserts', 'Gift sets']
  }
];

export const solutions = [
  { slug: 'restaurant-takeaway-packaging', name: 'Restaurants & Takeaway', icon: 'sandwich', description: 'Reliable packaging for dine-out, takeaway and delivery workflows.' },
  { slug: 'catering-event-packaging', name: 'Catering & Events', icon: 'shopping-bag', description: 'Professional packaging for platters, events and prepared meal service.' },
  { slug: 'food-brand-retail-packaging', name: 'Food Brands & Retail', icon: 'store', description: 'Branded packaging developed for shelf presence and repeat purchase.' },
  { slug: 'low-moq-startups', name: 'Startups & New Brands', icon: 'rocket', description: 'Low-MOQ support to test formats, sizes and artwork before scaling.' },
  { slug: 'enterprise-packaging', name: 'Enterprise Projects', icon: 'building-2', description: 'Project coordination, quality control and repeat-order support at scale.' }
];

export const articles = [
  {
    slug: 'packaging-buying-guide',
    type: 'Buying guide',
    title: 'How to Choose the Right Takeout Box for Your Menu',
    description: 'Compare structure, material, barrier and size so every menu item travels well.',
    image: 'products/products-hero-packaging-range.webp'
  },
  {
    slug: 'moq-pricing-guide',
    type: 'Cost planning',
    title: 'What Determines the Price of Custom Food Packaging?',
    description: 'Understand how size, structure, material, print coverage and quantity affect price.',
    image: 'home/category-custom-packaging.webp'
  },
  {
    slug: 'materials-food-safety',
    type: 'Materials guide',
    title: 'Food Packaging Materials: Kraft, White Board and Corrugated',
    description: 'A practical comparison of common paper-based packaging materials and barriers.',
    image: 'home/packaging-group.webp'
  }
];
