export type DepartmentId =
  | 'gold'
  | 'silver'
  | 'diamond'
  | 'bridal'
  | 'heritage'
  | 'everyday'
  | 'gifts'

export type Department = {
  id: DepartmentId
  label: string
  blurb: string
  stat: string
  accent: string
}

export type Product = {
  id: string
  name: string
  brand: string
  department: DepartmentId
  price: number
  originalPrice?: number
  rating: number
  reviewCount: number
  badge?: string
  description: string
  highlights: string[]
  delivery: string
  inventoryMessage: string
  inventoryTone: 'ok' | 'low'
  isCertified: boolean
  dealPercent?: number
  purity: string
  origin: string
  palette: [string, string, string]
  spotlight: string
}

export type ServiceHighlight = {
  label: string
  value: string
  copy: string
}

export type Collection = {
  title: string
  copy: string
  cta: string
  accent: string
}

export type CheckoutStep = {
  step: string
  title: string
  copy: string
}

export type FooterColumn = {
  title: string
  links: string[]
}

export const navigationLinks = [
  { label: 'Collections', anchor: 'deals' },
  { label: 'Catalog', anchor: 'catalog' },
  { label: 'Certified', anchor: 'certified' },
  { label: 'Checkout', anchor: 'checkout' },
] as const

export const trendingSearches = [
  'तिलहरी',
  'sunko chura',
  'diamond ring',
  'chaandi payal',
  'jhumka set',
] as const

export const departments: Department[] = [
  {
    id: 'gold',
    label: 'Gold Jewellery',
    blurb: '22K-inspired necklaces, bangles, bridal pieces, and festive gold edits for Nepali celebrations.',
    stat: '916 and 22K favourites',
    accent: '#c79a1b',
  },
  {
    id: 'silver',
    label: 'Silver Jewellery',
    blurb: '925 silver payal, kada, and daily-wear classics crafted for gifting and everyday styling.',
    stat: '925 sterling pieces',
    accent: '#8893a2',
  },
  {
    id: 'diamond',
    label: 'Diamond Jewellery',
    blurb: 'Certified diamond rings, studs, and elegant gifting styles with fine gold settings.',
    stat: 'Certified fine jewellery',
    accent: '#6d79c8',
  },
  {
    id: 'bridal',
    label: 'Bridal Sets',
    blurb: 'Statement tilhari, pote layering, wedding sets, and heirloom looks for the full bridal wardrobe.',
    stat: 'Made for weddings',
    accent: '#8f1f45',
  },
  {
    id: 'heritage',
    label: 'Heritage Newa',
    blurb: 'Newari-inspired silhouettes, jantar lockets, temple motifs, and rich ceremonial detailing.',
    stat: 'Patan craft influence',
    accent: '#9f4a1d',
  },
  {
    id: 'everyday',
    label: 'Everyday Elegance',
    blurb: 'Lightweight necklaces, studs, rings, and polished essentials that work from office to evening.',
    stat: 'Daily-wear best sellers',
    accent: '#7f5f52',
  },
  {
    id: 'gifts',
    label: 'Gifting',
    blurb: 'Thoughtful jewellery pieces for birthdays, engagements, anniversaries, Teej, and festive gifting.',
    stat: 'Gifts under NPR 50k',
    accent: '#c04f67',
  },
]

export const serviceHighlights: ServiceHighlight[] = [
  {
    label: 'Nepal-wide delivery',
    value: 'Insured shipping across Nepal',
    copy: 'Kathmandu Valley orders can move fastest while nationwide dispatch includes insured packaging and careful handling.',
  },
  {
    label: 'Purity assurance',
    value: '916 gold, 925 silver, certified diamonds',
    copy: 'Every featured piece clearly states purity, stone type, and workmanship so buyers can shop with confidence.',
  },
  {
    label: 'Flexible payment',
    value: 'eSewa, Khalti, cards, and transfer',
    copy: 'Checkout is tailored for Nepali buyers with familiar wallet options, bank transfer support, and card payments.',
  },
  {
    label: 'Bridal support',
    value: 'Custom sizing and wedding consults',
    copy: 'High-value bridal orders can be confirmed with sizing guidance, video consults, and made-to-order finishing.',
  },
]

export const editorialCollections: Collection[] = [
  {
    title: 'Teej Gold Edit',
    copy: 'Sunko chura, layered necklaces, and vibrant celebration pieces chosen for Teej dressing.',
    cta: 'Shop festive gold pieces',
    accent: '#8f1841',
  },
  {
    title: 'Bridal Tilhari and Jantar',
    copy: 'Statement wedding jewellery blending classic Nepali bridal silhouettes with refined finishing.',
    cta: 'Explore bridal heirlooms',
    accent: '#b6811c',
  },
  {
    title: 'Diamond Gifts Under NPR 50,000',
    copy: 'Elegant rings, studs, and keepsake jewellery for anniversaries, engagements, and milestone gifting.',
    cta: 'See gift-ready fine jewellery',
    accent: '#6b73c9',
  },
]

export const checkoutSteps: CheckoutStep[] = [
  {
    step: '01',
    title: 'Select purity, style, and size',
    copy: 'Each product view highlights metal purity, craftsmanship notes, and wearable fit before adding a piece to the bag.',
  },
  {
    step: '02',
    title: 'Confirm insured Nepal delivery',
    copy: 'Customers review dispatch speed for Kathmandu Valley, nationwide courier coverage, and high-value order handling.',
  },
  {
    step: '03',
    title: 'Pay securely and receive confirmation',
    copy: 'Checkout is designed for Nepali shoppers using eSewa, Khalti, cards, or transfer with instant order confirmation.',
  },
]

export const footerColumns: FooterColumn[] = [
  {
    title: 'Shop',
    links: ['Gold Jewellery', 'Silver Jewellery', 'Diamond Jewellery', 'Bridal Sets'],
  },
  {
    title: 'Support',
    links: ['Size Guide', 'Delivery', 'Exchange Policy', 'Jewellery Care'],
  },
  {
    title: 'Company',
    links: ['About Nyra', 'Custom Orders', 'Visit Showroom', 'Contact'],
  },
]

export const products: Product[] = [
  {
    id: 'nyra-tilhari-bridal-set',
    name: 'Nyra Bridal Tilhari Set',
    brand: 'Nyra Signature',
    department: 'bridal',
    price: 248000,
    originalPrice: 272000,
    rating: 4.9,
    reviewCount: 184,
    badge: 'Bridal bestseller',
    description:
      'A statement bridal tilhari with lush pote layering, engraved locket work, and ceremonial presence made for wedding dressing.',
    highlights: ['Layered pote strands', 'Grand bridal locket', 'Custom length finishing'],
    delivery: 'Insured Kathmandu Valley delivery in 24 hours',
    inventoryMessage: 'Made to order in 3 days',
    inventoryTone: 'low',
    isCertified: true,
    dealPercent: 9,
    purity: '22K gold finish',
    origin: 'Kathmandu atelier',
    palette: ['#3a1322', '#9c2d55', '#f0c56a'],
    spotlight: 'Bridal icon',
  },
  {
    id: 'nyra-lakshmi-jantar-necklace',
    name: 'Lakshmi Jantar Necklace',
    brand: 'Nyra Heritage',
    department: 'heritage',
    price: 189500,
    originalPrice: 214000,
    rating: 4.8,
    reviewCount: 132,
    badge: 'Heritage favourite',
    description:
      'A rich jantar-style necklace inspired by ceremonial Newa jewellery with temple motifs and heirloom character.',
    highlights: ['Temple-inspired detailing', 'Rich statement silhouette', 'Wedding and puja ready'],
    delivery: 'Insured delivery across Nepal',
    inventoryMessage: 'Only 4 pieces available',
    inventoryTone: 'low',
    isCertified: true,
    dealPercent: 11,
    purity: '22K gold finish',
    origin: 'Patan craft line',
    palette: ['#29120f', '#8e4b25', '#f5c96b'],
    spotlight: 'Heirloom craft',
  },
  {
    id: 'nyra-sunko-chura-duo',
    name: 'Sunko Chura Pair',
    brand: 'Nyra Gold',
    department: 'gold',
    price: 96500,
    originalPrice: 109000,
    rating: 4.7,
    reviewCount: 268,
    badge: 'Teej edit',
    description:
      'A polished pair of gold bangles with engraved texture and a balanced everyday-to-festive profile.',
    highlights: ['Pair of festive bangles', 'Comfort-fit inner curve', 'Classic engraved texture'],
    delivery: 'Valley pickup or insured dispatch',
    inventoryMessage: 'In stock',
    inventoryTone: 'ok',
    isCertified: true,
    dealPercent: 11,
    purity: '916 hallmark gold',
    origin: 'New Road gold line',
    palette: ['#2c1a0d', '#9f6d14', '#f3d98a'],
    spotlight: 'Festive shine',
  },
  {
    id: 'nyra-pote-chandrahaar-set',
    name: 'Pote Chandrahaar Set',
    brand: 'Nyra Bridal',
    department: 'bridal',
    price: 32500,
    originalPrice: 38900,
    rating: 4.6,
    reviewCount: 341,
    badge: 'Wedding favourite',
    description:
      'A graceful pote and chandrahaar pairing that adds color, layering, and bridal softness to ceremonial looks.',
    highlights: ['Bridal pote layers', 'Gold-toned clasp finishing', 'Easy festive styling'],
    delivery: 'Dispatches in 24 to 48 hours',
    inventoryMessage: 'In stock',
    inventoryTone: 'ok',
    isCertified: false,
    dealPercent: 16,
    purity: 'Gold-plated bridal set',
    origin: 'Kathmandu festive studio',
    palette: ['#3a0f1f', '#8a2744', '#ffce74'],
    spotlight: 'Ceremony glow',
  },
  {
    id: 'nyra-heera-solitaire-ring',
    name: 'Heera Solitaire Ring',
    brand: 'Nyra Fine',
    department: 'diamond',
    price: 84500,
    originalPrice: 92500,
    rating: 4.8,
    reviewCount: 118,
    badge: 'Engagement pick',
    description:
      'A refined solitaire ring set for intimate proposals, polished gifting, and clean everyday luxury.',
    highlights: ['Minimal solitaire profile', 'Elegant claw setting', 'Comfort band interior'],
    delivery: 'Insured fine-jewellery delivery',
    inventoryMessage: 'In stock',
    inventoryTone: 'ok',
    isCertified: true,
    dealPercent: 9,
    purity: '18K gold with certified diamond',
    origin: 'Lalitpur fine setting',
    palette: ['#182040', '#5664a5', '#efe5ca'],
    spotlight: 'Proposal piece',
  },
  {
    id: 'nyra-rose-diamond-nathiya',
    name: 'Rose Diamond Nathiya',
    brand: 'Nyra Fine',
    department: 'gifts',
    price: 27900,
    originalPrice: 32500,
    rating: 4.6,
    reviewCount: 87,
    badge: 'Gift ready',
    description:
      'A delicate nathiya with rose-cut sparkle designed for festive dressing, gifting, and understated glamour.',
    highlights: ['Soft floral setting', 'Lightweight wear', 'Elegant festive profile'],
    delivery: 'Insured dispatch within Nepal',
    inventoryMessage: 'In stock',
    inventoryTone: 'ok',
    isCertified: true,
    dealPercent: 14,
    purity: '18K gold with diamond accents',
    origin: 'Kathmandu fine line',
    palette: ['#2f1624', '#8e4e71', '#f0c98d'],
    spotlight: 'Soft sparkle',
  },
  {
    id: 'nyra-chaandi-payal-pair',
    name: 'Chaandi Payal Pair',
    brand: 'Nyra Silver',
    department: 'silver',
    price: 14900,
    originalPrice: 17900,
    rating: 4.7,
    reviewCount: 412,
    badge: 'Daily wear',
    description:
      'Sterling silver payal with a fluid drape and clean handcrafted detail for gifting or personal everyday styling.',
    highlights: ['Sterling silver pair', 'Comfortable clasp design', 'Light musical movement'],
    delivery: 'Ships nationwide with insured packaging',
    inventoryMessage: 'In stock',
    inventoryTone: 'ok',
    isCertified: true,
    dealPercent: 17,
    purity: '925 sterling silver',
    origin: 'Bhaktapur silver workshop',
    palette: ['#1a1f2d', '#7b8797', '#e8e9ee'],
    spotlight: 'Daily silver',
  },
  {
    id: 'nyra-chaandi-kada-engraved',
    name: 'Engraved Silver Kada',
    brand: 'Nyra Silver',
    department: 'silver',
    price: 19800,
    originalPrice: 22900,
    rating: 4.5,
    reviewCount: 204,
    badge: 'Handcrafted',
    description:
      'A bold silver kada with engraved borders that layers beautifully with watches or other daily silver pieces.',
    highlights: ['Clean handcrafted groove', 'Statement daily wear', 'Secure polished fit'],
    delivery: 'Dispatched in 48 hours',
    inventoryMessage: 'Only 6 left in stock',
    inventoryTone: 'low',
    isCertified: true,
    dealPercent: 14,
    purity: '925 sterling silver',
    origin: 'Patan silver studio',
    palette: ['#1b2330', '#6d7480', '#d5d8df'],
    spotlight: 'Solid silver',
  },
  {
    id: 'nyra-jhumka-karnaphool',
    name: 'Jhumka Karnaphool Set',
    brand: 'Nyra Heritage',
    department: 'heritage',
    price: 58500,
    originalPrice: 64800,
    rating: 4.7,
    reviewCount: 176,
    badge: 'Cultural edit',
    description:
      'Traditional jhumka and karnaphool styling with ceremonial depth for weddings, Teej, and family celebrations.',
    highlights: ['Rich dome jhumka shape', 'Classic karnaphool framing', 'Festive statement finish'],
    delivery: 'Insured express dispatch available',
    inventoryMessage: 'In stock',
    inventoryTone: 'ok',
    isCertified: true,
    dealPercent: 10,
    purity: '916 hallmark gold',
    origin: 'Patan heritage collection',
    palette: ['#2f180d', '#8b5624', '#f6d37b'],
    spotlight: 'Cultural classic',
  },
  {
    id: 'nyra-everyday-diamond-studs',
    name: 'Everyday Diamond Studs',
    brand: 'Nyra Fine',
    department: 'everyday',
    price: 43900,
    originalPrice: 48900,
    rating: 4.8,
    reviewCount: 193,
    badge: 'Office to evening',
    description:
      'Minimal diamond studs that stay elegant all day and transition easily from workwear to occasion dressing.',
    highlights: ['Lightweight stud design', 'Comfort lock backing', 'Refined everyday sparkle'],
    delivery: 'Insured fine-jewellery dispatch',
    inventoryMessage: 'In stock',
    inventoryTone: 'ok',
    isCertified: true,
    dealPercent: 10,
    purity: '18K gold with certified diamond',
    origin: 'Lalitpur polished line',
    palette: ['#1d2032', '#666ea1', '#ead9c3'],
    spotlight: 'Daily sparkle',
  },
  {
    id: 'nyra-gold-mangalsutra',
    name: 'Minimal Gold Mangalsutra',
    brand: 'Nyra Gold',
    department: 'everyday',
    price: 72300,
    originalPrice: 79900,
    rating: 4.6,
    reviewCount: 154,
    badge: 'Modern classic',
    description:
      'A lighter mangalsutra silhouette for everyday wear with elegant black bead balance and polished gold detailing.',
    highlights: ['Modern minimal profile', 'Comfortable chain weight', 'Daily wear finish'],
    delivery: 'Insured delivery across Nepal',
    inventoryMessage: 'In stock',
    inventoryTone: 'ok',
    isCertified: true,
    dealPercent: 9,
    purity: '916 hallmark gold',
    origin: 'Kathmandu gold atelier',
    palette: ['#24140c', '#7b551b', '#edc86b'],
    spotlight: 'Modern vow',
  },
  {
    id: 'nyra-silver-panjeb-ghungru',
    name: 'Silver Panjeb Ghungru Anklet',
    brand: 'Nyra Silver',
    department: 'gifts',
    price: 12600,
    originalPrice: 14900,
    rating: 4.5,
    reviewCount: 278,
    badge: 'Giftable',
    description:
      'A playful silver panjeb with subtle ghungru detailing, designed for festive styling and thoughtful gifting.',
    highlights: ['Soft ghungru accents', 'Light festive wear', 'Easy gift option'],
    delivery: 'Dispatches in 24 hours',
    inventoryMessage: 'In stock',
    inventoryTone: 'ok',
    isCertified: true,
    dealPercent: 15,
    purity: '925 sterling silver',
    origin: 'Bhaktapur gifting line',
    palette: ['#1d2331', '#7b8695', '#ece7e2'],
    spotlight: 'Playful silver',
  },
  {
    id: 'nyra-custom-bridal-maharani-set',
    name: 'Custom Maharani Bridal Set',
    brand: 'Nyra Signature',
    department: 'bridal',
    price: 345000,
    originalPrice: 379000,
    rating: 4.9,
    reviewCount: 61,
    badge: 'Made for weddings',
    description:
      'A full bridal jewellery statement set with layered necklaces, earrings, tikka styling, and custom consultation support.',
    highlights: ['Full bridal coordination', 'Custom sizing consult', 'Wedding-day impact'],
    delivery: 'White-glove insured delivery',
    inventoryMessage: 'Custom order window open',
    inventoryTone: 'low',
    isCertified: true,
    dealPercent: 9,
    purity: '22K bridal finish',
    origin: 'Kathmandu signature bridal atelier',
    palette: ['#360f20', '#7e2147', '#f1bf65'],
    spotlight: 'Wedding hero',
  },
  {
    id: 'nyra-minimal-gold-chain',
    name: 'Minimal Gold Chain',
    brand: 'Nyra Gold',
    department: 'gold',
    price: 52900,
    originalPrice: 57900,
    rating: 4.7,
    reviewCount: 223,
    badge: 'Everyday gold',
    description:
      'A polished lightweight gold chain made for layering, pendants, and clean daily wear styling.',
    highlights: ['Layer-friendly length', 'Smooth gold finish', 'Easy everyday styling'],
    delivery: 'Insured dispatch in 24 to 48 hours',
    inventoryMessage: 'In stock',
    inventoryTone: 'ok',
    isCertified: true,
    dealPercent: 9,
    purity: '916 hallmark gold',
    origin: 'New Road essentials line',
    palette: ['#22150d', '#866022', '#f5d587'],
    spotlight: 'Layer it',
  },
]
