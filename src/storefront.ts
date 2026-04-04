export type DepartmentId =
  | 'gold'
  | 'silver'
  | 'diamond'
  | 'bridal'
  | 'heritage'
  | 'everyday'
  | 'gifts'

export type NavigationLink = {
  label: string
  anchor: string
}

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

export type StoreSettings = {
  currency: 'NPR'
  vatRate: number
  freeInsuredShippingThreshold: number
  standardInsuredShipping: number
}

export type StorefrontResponse = {
  navigationLinks: NavigationLink[]
  trendingSearches: string[]
  departments: Department[]
  serviceHighlights: ServiceHighlight[]
  editorialCollections: Collection[]
  checkoutSteps: CheckoutStep[]
  footerColumns: FooterColumn[]
  products: Product[]
  settings: StoreSettings
}

export type ProductListResponse = {
  items: Product[]
}

export type QuoteRequestItem = {
  productId: string
  quantity: number
}

export type QuoteLine = {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export type QuoteSummary = {
  itemCount: number
  subtotal: number
  shipping: number
  vat: number
  total: number
  savings: number
  freeShippingRemaining: number
  shippingProgress: number
}

export type QuoteResponse = {
  currency: 'NPR'
  lines: QuoteLine[]
  summary: QuoteSummary
}

export type OrderResponse = {
  orderId: string
  status: 'created'
  createdAt: string
  summary: QuoteSummary
}
