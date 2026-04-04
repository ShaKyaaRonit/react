import { startTransition, useDeferredValue, useEffect, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import './App.css'
import nyraLogo from './assets/nyra-logo.png'
import { createOrder, fetchProducts, fetchStorefront, requestBagQuote } from './api'
import type {
  DepartmentId,
  Product,
  QuoteRequestItem,
  QuoteResponse,
  QuoteSummary,
  StoreSettings,
  StorefrontResponse,
} from './storefront'

type DepartmentFilter = DepartmentId | 'all'
type SortOption = 'featured' | 'price-low' | 'price-high' | 'rating' | 'deal'
type LoadState = 'loading' | 'ready' | 'error'
type BagRecord = Record<string, number>
type BagLine = {
  product: Product
  quantity: number
}

type ProductArtProps = {
  product: Product
  variant?: 'card' | 'showcase'
}

type ProductCardProps = {
  product: Product
  departmentLabel: string
  isSelected: boolean
  onSelect: (productId: string) => void
  onAddToBag: (productId: string) => void
}

type PageStateProps = {
  title: string
  copy: string
  actionLabel?: string
  onAction?: () => void
}

const BAG_STORAGE_KEY = 'nyra-jewellery.bag.v1'
const EMPTY_SUMMARY: QuoteSummary = {
  itemCount: 0,
  subtotal: 0,
  shipping: 0,
  vat: 0,
  total: 0,
  savings: 0,
  freeShippingRemaining: 0,
  shippingProgress: 0,
}

const priceFormatter = new Intl.NumberFormat('en-NP', {
  style: 'currency',
  currency: 'NPR',
  maximumFractionDigits: 0,
})

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'featured', label: 'Curated first' },
  { value: 'deal', label: 'Best offers' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'price-high', label: 'Price: high to low' },
]

function isBagRecord(value: unknown): value is BagRecord {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  return Object.values(value as Record<string, unknown>).every(
    (entry) => typeof entry === 'number' && Number.isFinite(entry) && entry >= 0,
  )
}

function readStoredBag(): BagRecord {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const storedBag = window.localStorage.getItem(BAG_STORAGE_KEY)

    if (!storedBag) {
      return {}
    }

    const parsed = JSON.parse(storedBag) as unknown

    if (isBagRecord(parsed)) {
      return parsed
    }
  } catch {
    return {}
  }

  return {}
}

function formatPrice(value: number) {
  return priceFormatter.format(value)
}

function getDiscountAmount(product: Product) {
  if (!product.originalPrice) {
    return 0
  }

  return product.originalPrice - product.price
}

function getSearchHaystack(product: Product) {
  return [
    product.name,
    product.brand,
    product.description,
    product.purity,
    product.origin,
    product.delivery,
    ...product.highlights,
  ]
    .join(' ')
    .toLowerCase()
}

function compareProducts(left: Product, right: Product, sortOption: SortOption) {
  if (sortOption === 'price-low') {
    return left.price - right.price
  }

  if (sortOption === 'price-high') {
    return right.price - left.price
  }

  if (sortOption === 'rating') {
    return right.rating - left.rating || right.reviewCount - left.reviewCount
  }

  if (sortOption === 'deal') {
    return (right.dealPercent ?? 0) - (left.dealPercent ?? 0) || right.rating - left.rating
  }

  return (
    Number(right.isCertified) - Number(left.isCertified) ||
    (right.dealPercent ?? 0) - (left.dealPercent ?? 0) ||
    right.rating - left.rating
  )
}

function buildBagLines(bag: BagRecord, catalog: Product[]): BagLine[] {
  return Object.entries(bag)
    .map(([productId, quantity]) => {
      const product = catalog.find((item) => item.id === productId)

      if (!product || quantity <= 0) {
        return null
      }

      return {
        product,
        quantity,
      }
    })
    .filter((line): line is BagLine => line !== null)
}

function buildFallbackSummary(bagLines: BagLine[], settings: StoreSettings | null): QuoteSummary {
  if (!settings) {
    return EMPTY_SUMMARY
  }

  const itemCount = bagLines.reduce((total, line) => total + line.quantity, 0)
  const subtotal = bagLines.reduce((total, line) => total + line.product.price * line.quantity, 0)
  const savings = bagLines.reduce(
    (total, line) => total + getDiscountAmount(line.product) * line.quantity,
    0,
  )
  const shipping =
    itemCount === 0
      ? 0
      : subtotal >= settings.freeInsuredShippingThreshold
        ? 0
        : settings.standardInsuredShipping
  const vat = Math.round(subtotal * settings.vatRate)
  const total = subtotal + shipping + vat
  const freeShippingRemaining = Math.max(0, settings.freeInsuredShippingThreshold - subtotal)
  const shippingProgress = Math.min(100, (subtotal / settings.freeInsuredShippingThreshold) * 100)

  return {
    itemCount,
    subtotal,
    shipping,
    vat,
    total,
    savings,
    freeShippingRemaining,
    shippingProgress,
  }
}

function createQuoteItems(bag: BagRecord): QuoteRequestItem[] {
  return Object.entries(bag)
    .filter(([, quantity]) => quantity > 0)
    .map(([productId, quantity]) => ({
      productId,
      quantity,
    }))
}

function ProductArt({ product, variant = 'card' }: ProductArtProps) {
  const artStyles = {
    '--product-start': product.palette[0],
    '--product-end': product.palette[1],
    '--product-glow': product.palette[2],
  } as CSSProperties

  return (
    <div className={`product-art product-art--${variant}`} style={artStyles}>
      <img className="product-art__watermark" src={nyraLogo} alt="" aria-hidden="true" />
      <div className="product-art__halo" />
      <div className="product-art__jewel" />
      <div className="product-art__base" />
      <span className="product-art__label">{product.spotlight}</span>
      <span className="product-art__purity">{product.purity}</span>
    </div>
  )
}

function RatingRow({
  rating,
  reviewCount,
}: {
  rating: number
  reviewCount: number
}) {
  const roundedRating = Math.round(rating)

  return (
    <div className="rating-row" aria-label={`${rating} out of 5 stars from ${reviewCount} reviews`}>
      <div className="rating-row__stars" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index} className={index < roundedRating ? 'is-filled' : ''}>
            ★
          </span>
        ))}
      </div>
      <span className="rating-row__value">{rating.toFixed(1)}</span>
      <span className="rating-row__count">({reviewCount.toLocaleString()} reviews)</span>
    </div>
  )
}

function ProductCard({
  product,
  departmentLabel,
  isSelected,
  onSelect,
  onAddToBag,
}: ProductCardProps) {
  const savings = getDiscountAmount(product)

  return (
    <article className={`product-card ${isSelected ? 'is-selected' : ''}`}>
      <button type="button" className="product-card__visual" onClick={() => onSelect(product.id)}>
        <ProductArt product={product} />
      </button>

      <div className="product-card__content">
        <div className="product-card__top">
          <div>
            <p className="product-card__brand">{product.brand}</p>
            <h3 className="product-card__title">{product.name}</h3>
          </div>
          {product.badge ? <span className="product-card__badge">{product.badge}</span> : null}
        </div>

        <p className="product-card__description">{product.description}</p>

        <div className="product-card__chips">
          <span className="product-chip">{departmentLabel}</span>
          {product.highlights.slice(0, 2).map((highlight) => (
            <span key={highlight} className="product-chip product-chip--soft">
              {highlight}
            </span>
          ))}
        </div>

        <RatingRow rating={product.rating} reviewCount={product.reviewCount} />

        <div className="product-card__pricing">
          <div className="product-card__price-group">
            <strong>{formatPrice(product.price)}</strong>
            {product.originalPrice ? <span>{formatPrice(product.originalPrice)}</span> : null}
          </div>
          {savings > 0 ? <span className="product-card__savings">Save {formatPrice(savings)}</span> : null}
        </div>

        <div className="product-card__meta">
          <span>{product.purity}</span>
          <span>{product.origin}</span>
          <span>{product.delivery}</span>
        </div>

        <div className="product-card__footer">
          <span className={`stock-pill ${product.inventoryTone === 'low' ? 'is-low' : ''}`}>
            {product.inventoryMessage}
          </span>
          {product.isCertified ? <span className="certified-pill">Certified</span> : null}
        </div>

        <div className="product-card__actions">
          <button type="button" className="button button--ghost" onClick={() => onSelect(product.id)}>
            View details
          </button>
          <button type="button" className="button button--primary" onClick={() => onAddToBag(product.id)}>
            Add to bag
          </button>
        </div>
      </div>
    </article>
  )
}

function PageState({ title, copy, actionLabel, onAction }: PageStateProps) {
  return (
    <div className="page-state">
      <div className="page-state__panel">
        <img src={nyraLogo} alt="Nyra logo" />
        <h1>{title}</h1>
        <p>{copy}</p>
        {actionLabel && onAction ? (
          <button type="button" className="button button--primary" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState<SortOption>('featured')
  const [activeDepartment, setActiveDepartment] = useState<DepartmentFilter>('all')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [bag, setBag] = useState<BagRecord>(() => readStoredBag())
  const [isBagOpen, setBagOpen] = useState(false)
  const [storefront, setStorefront] = useState<StorefrontResponse | null>(null)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([])
  const [isCatalogLoading, setCatalogLoading] = useState(false)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [isQuoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [isCheckingOut, setCheckingOut] = useState(false)
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null)

  const deferredSearchQuery = useDeferredValue(searchQuery.trim().toLowerCase())

  useEffect(() => {
    const controller = new AbortController()

    setLoadState('loading')
    setLoadError(null)

    fetchStorefront(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) {
          return
        }

        startTransition(() => {
          setStorefront(data)
          setCatalogProducts(data.products)
          setLoadState('ready')
        })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        setLoadState('error')
        setLoadError(error instanceof Error ? error.message : 'Unable to load storefront data.')
      })

    return () => controller.abort()
  }, [reloadToken])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(BAG_STORAGE_KEY, JSON.stringify(bag))
  }, [bag])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    document.body.classList.toggle('has-overlay', isBagOpen)

    return () => {
      document.body.classList.remove('has-overlay')
    }
  }, [isBagOpen])

  const navigationLinks = storefront?.navigationLinks ?? []
  const trendingSearches = storefront?.trendingSearches ?? []
  const departments = storefront?.departments ?? []
  const serviceHighlights = storefront?.serviceHighlights ?? []
  const editorialCollections = storefront?.editorialCollections ?? []
  const checkoutSteps = storefront?.checkoutSteps ?? []
  const footerColumns = storefront?.footerColumns ?? []
  const allProducts = storefront?.products ?? []
  const settings = storefront?.settings ?? null

  const departmentMap = new Map(departments.map((department) => [department.id, department]))

  const departmentFilters: Array<{
    id: DepartmentFilter
    label: string
    blurb: string
  }> = [
    {
      id: 'all',
      label: 'All collections',
      blurb: 'Browse Nyra across gold, silver, diamond, bridal, heritage, gifting, and everyday Nepali jewellery.',
    },
    ...departments.map((department) => ({
      id: department.id,
      label: department.label,
      blurb: department.blurb,
    })),
  ]

  const fallbackProducts = [...allProducts]
    .filter((product) => {
      const matchesDepartment =
        activeDepartment === 'all' ? true : product.department === activeDepartment

      if (!matchesDepartment) {
        return false
      }

      if (!deferredSearchQuery) {
        return true
      }

      return getSearchHaystack(product).includes(deferredSearchQuery)
    })
    .sort((left, right) => compareProducts(left, right, sortOption))

  const filteredProducts = catalogError ? fallbackProducts : catalogProducts

  useEffect(() => {
    if (!storefront) {
      return
    }

    const controller = new AbortController()

    setCatalogLoading(true)
    setCatalogError(null)

    fetchProducts(
      {
        department: activeDepartment,
        q: deferredSearchQuery,
        sort: sortOption,
      },
      controller.signal,
    )
      .then((payload) => {
        if (!controller.signal.aborted) {
          setCatalogProducts(payload.items)
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        setCatalogError(
          error instanceof Error ? error.message : 'Unable to load catalog results from the backend.',
        )
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setCatalogLoading(false)
        }
      })

    return () => controller.abort()
  }, [activeDepartment, deferredSearchQuery, sortOption, storefront])

  useEffect(() => {
    if (filteredProducts.length === 0) {
      return
    }

    const selectedProductStillVisible = filteredProducts.some(
      (product) => product.id === selectedProductId,
    )

    if (!selectedProductId || !selectedProductStillVisible) {
      setSelectedProductId(filteredProducts[0].id)
    }
  }, [filteredProducts, selectedProductId])

  const bagLines = buildBagLines(bag, allProducts)

  useEffect(() => {
    if (!storefront) {
      return
    }

    const quoteItems = createQuoteItems(bag)

    if (quoteItems.length === 0) {
      setQuote({
        currency: settings?.currency ?? 'NPR',
        lines: [],
        summary: EMPTY_SUMMARY,
      })
      setQuoteError(null)
      setQuoteLoading(false)
      return
    }

    const controller = new AbortController()

    setQuoteLoading(true)
    setQuoteError(null)

    requestBagQuote(quoteItems, controller.signal)
      .then((payload) => {
        if (!controller.signal.aborted) {
          setQuote(payload)
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        setQuoteError(error instanceof Error ? error.message : 'Unable to quote the current bag.')
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setQuoteLoading(false)
        }
      })

    return () => controller.abort()
  }, [bag, settings?.currency, storefront])

  const fallbackSummary = buildFallbackSummary(bagLines, settings)
  const activeSummary = quote?.summary ?? fallbackSummary
  const bagItemCount = activeSummary.itemCount
  const selectedProduct =
    filteredProducts.length === 0
      ? undefined
      : filteredProducts.find((product) => product.id === selectedProductId) ?? filteredProducts[0]

  const selectedDepartment =
    selectedProduct ? departmentMap.get(selectedProduct.department) : undefined

  const activeDepartmentMeta =
    activeDepartment === 'all'
      ? departmentFilters[0]
      : departmentFilters.find((department) => department.id === activeDepartment) ?? departmentFilters[0]

  const featuredDepartments = departments.slice(0, 4)
  const topDeals = [...allProducts]
    .sort((left, right) => compareProducts(left, right, 'deal'))
    .slice(0, 2)
  const recommendations = allProducts
    .filter((product) => !bag[product.id])
    .sort((left, right) => compareProducts(left, right, 'featured'))
    .slice(0, 2)

  function retryLoad() {
    setReloadToken((currentValue) => currentValue + 1)
  }

  function handleAddToBag(productId: string) {
    setCheckoutMessage(null)
    setBag((currentBag) => ({
      ...currentBag,
      [productId]: (currentBag[productId] ?? 0) + 1,
    }))
    setBagOpen(true)
  }

  function handleQuantityChange(productId: string, delta: number) {
    setCheckoutMessage(null)
    setBag((currentBag) => {
      const nextQuantity = (currentBag[productId] ?? 0) + delta

      if (nextQuantity <= 0) {
        const nextBag = { ...currentBag }
        delete nextBag[productId]
        return nextBag
      }

      return {
        ...currentBag,
        [productId]: nextQuantity,
      }
    })
  }

  function handleRemoveFromBag(productId: string) {
    setCheckoutMessage(null)
    setBag((currentBag) => {
      const nextBag = { ...currentBag }
      delete nextBag[productId]
      return nextBag
    })
  }

  function handleDepartmentChange(departmentId: DepartmentFilter) {
    startTransition(() => {
      setActiveDepartment(departmentId)
    })
  }

  function handleSortChange(nextSort: SortOption) {
    startTransition(() => {
      setSortOption(nextSort)
    })
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (filteredProducts.length > 0) {
      setSelectedProductId(filteredProducts[0].id)
    }
  }

  function clearFilters() {
    setSearchQuery('')
    handleDepartmentChange('all')
    handleSortChange('featured')
  }

  async function handleCheckout() {
    const orderItems = createQuoteItems(bag)

    if (isCheckingOut || orderItems.length === 0) {
      return
    }

    setCheckingOut(true)
    setCheckoutMessage(null)

    try {
      const order = await createOrder(orderItems)
      setCheckoutMessage(`Order request ${order.orderId} created successfully.`)
      setBag({})
    } catch (error) {
      setCheckoutMessage(error instanceof Error ? error.message : 'Unable to place the order right now.')
    } finally {
      setCheckingOut(false)
    }
  }

  if (loadState === 'loading' && !storefront) {
    return (
      <PageState
        title="Preparing the Nyra collection"
        copy="Loading the latest catalogue, offers, and delivery details for the Nyra storefront."
      />
    )
  }

  if (loadState === 'error' && !storefront) {
    return (
      <PageState
        title="Storefront unavailable"
        copy={loadError ?? 'We could not load the Nyra collection right now. Please try again.'}
        actionLabel="Try again"
        onAction={retryLoad}
      />
    )
  }

  return (
    <>
      <div className="storefront">
        <header className="topbar">
          <div className="topbar__inner">
            <a className="brand-lockup" href="#home" aria-label="Nyra homepage">
              <img className="brand-lockup__image" src={nyraLogo} alt="Nyra logo" />
              <span className="brand-lockup__copy">
                <strong>Nyra</strong>
                <span>Fine jewellery for Nepal</span>
              </span>
            </a>

            <nav className="topbar__nav" aria-label="Primary">
              {navigationLinks.map((item) => (
                <a key={item.label} href={`#${item.anchor}`}>
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="topbar__actions">
              <span className="status-pill">Crafted for Nepal</span>
              <button type="button" className="bag-button" onClick={() => setBagOpen(true)}>
                <span>Bag</span>
                <strong>{bagItemCount}</strong>
              </button>
            </div>
          </div>
        </header>

        <main className="page-shell">
          {quoteError ? (
            <div className="system-banner system-banner--warning">
              Live totals are temporarily refreshing. Displayed pricing is still available.
            </div>
          ) : null}

          {catalogError ? (
            <div className="system-banner system-banner--warning">
              Some collection filters are temporarily limited while the catalogue refreshes.
            </div>
          ) : null}

          {checkoutMessage ? (
            <div className="system-banner system-banner--success">{checkoutMessage}</div>
          ) : null}

          <section className="hero" id="home">
            <div className="hero__copy">
              <p className="section-label">Nyra Signature</p>
              <h1>Elegant gold, silver, and diamond jewellery for Nepal.</h1>
              <p className="hero__description">
                Discover bridal heirlooms, refined daily wear, and gift-ready pieces shaped for
                Nepali celebrations, modern styling, and trusted craftsmanship.
              </p>

              <form className="hero-search" onSubmit={handleSearchSubmit}>
                <label className="sr-only" htmlFor="catalog-search">
                  Search Nyra jewellery
                </label>
                <input
                  id="catalog-search"
                  name="catalog-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search tilhari, sunko chura, diamond ring, chaandi payal..."
                />
                <button type="submit">Search pieces</button>
              </form>

              <div className="hero__actions">
                <a className="button button--primary" href="#catalog">
                  Explore catalogue
                </a>
                <button type="button" className="button button--ghost" onClick={() => setBagOpen(true)}>
                  Open bag
                </button>
              </div>

              <div className="hero__trending">
                <span>Trending searches</span>
                <div className="hero__trend-list">
                  {trendingSearches.map((trend) => (
                    <button
                      key={trend}
                      type="button"
                      className="trend-chip"
                      onClick={() => setSearchQuery(trend)}
                    >
                      {trend}
                    </button>
                  ))}
                </div>
              </div>

              <div className="hero__collections">
                {featuredDepartments.map((department) => (
                  <button
                    key={department.id}
                    type="button"
                    className="hero-collection"
                    style={{ '--collection-accent': department.accent } as CSSProperties}
                    onClick={() => handleDepartmentChange(department.id)}
                  >
                    <strong>{department.label}</strong>
                    <span>{department.stat}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="hero__visual">
              <article className="logo-showcase">
                <img className="logo-showcase__image" src={nyraLogo} alt="Nyra brand logo" />
                <div className="logo-showcase__caption">
                  <span>Heritage meets refinement</span>
                  <strong>
                    A jewellery storefront designed to feel premium, polished, and ready for
                    modern Nepali shoppers.
                  </strong>
                </div>
              </article>
            </div>
          </section>

          <section className="benefits-strip" aria-label="Service highlights">
            {serviceHighlights.map((highlight) => (
              <article key={highlight.label} className="benefit-card">
                <p className="section-label">{highlight.label}</p>
                <h2>{highlight.value}</h2>
                <p>{highlight.copy}</p>
              </article>
            ))}
          </section>

          <section className="catalog-layout">
            <div className="catalog-column">
              <section className="collection-grid" id="deals">
                {editorialCollections.map((collection) => (
                  <article
                    key={collection.title}
                    className="collection-card"
                    style={{ '--card-accent': collection.accent } as CSSProperties}
                  >
                    <p className="section-label">Seasonal edit</p>
                    <h2>{collection.title}</h2>
                    <p>{collection.copy}</p>
                    <span>{collection.cta}</span>
                  </article>
                ))}
              </section>

              <section className="catalog-panel" id="catalog">
                <div className="catalog-panel__top">
                  <div>
                    <p className="section-label">Catalog</p>
                    <h2>{activeDepartmentMeta.label}</h2>
                    <p>{activeDepartmentMeta.blurb}</p>
                  </div>

                  <label className="sort-control">
                    <span>Sort by</span>
                    <select
                      value={sortOption}
                      onChange={(event) => handleSortChange(event.target.value as SortOption)}
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="catalog-panel__toolbar">
                  <p className="catalog-panel__result-copy">
                    Showing {filteredProducts.length} piece{filteredProducts.length === 1 ? '' : 's'}
                    {searchQuery ? ` for "${searchQuery}"` : ''}.
                  </p>
                  <button type="button" className="button button--ghost" onClick={clearFilters}>
                    Reset filters
                  </button>
                </div>

                {isCatalogLoading ? <p className="inline-note">Refreshing collection results...</p> : null}

                <div className="filter-row">
                  {departmentFilters.map((department) => (
                    <button
                      key={department.id}
                      type="button"
                      className={`filter-chip ${activeDepartment === department.id ? 'is-active' : ''}`}
                      onClick={() => handleDepartmentChange(department.id)}
                    >
                      {department.label}
                    </button>
                  ))}
                </div>

                {filteredProducts.length > 0 ? (
                  <div className="product-grid">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        departmentLabel={departmentMap.get(product.department)?.label ?? 'Featured'}
                        isSelected={selectedProductId === product.id}
                        onSelect={setSelectedProductId}
                        onAddToBag={handleAddToBag}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <h3>No jewellery pieces matched your search.</h3>
                    <p>Try a broader term or switch back to the full Nyra collection.</p>
                    <button type="button" className="button button--primary" onClick={clearFilters}>
                      Show all pieces
                    </button>
                  </div>
                )}
              </section>
            </div>

            <aside className="sidebar-column">
              <section className="sidebar-card sidebar-card--feature" id="certified">
                <div className="sidebar-card__header">
                  <div>
                    <p className="section-label">Selected piece</p>
                    <h2>{selectedProduct?.name ?? 'Choose a jewellery piece'}</h2>
                  </div>
                  {selectedProduct?.badge ? (
                    <span className="product-card__badge">{selectedProduct.badge}</span>
                  ) : null}
                </div>

                {selectedProduct ? (
                  <>
                    <ProductArt product={selectedProduct} variant="showcase" />

                    <div className="feature-panel__price">
                      <strong>{formatPrice(selectedProduct.price)}</strong>
                      {selectedProduct.originalPrice ? (
                        <span>{formatPrice(selectedProduct.originalPrice)}</span>
                      ) : null}
                    </div>

                    <RatingRow
                      rating={selectedProduct.rating}
                      reviewCount={selectedProduct.reviewCount}
                    />

                    <p className="feature-panel__description">{selectedProduct.description}</p>

                    <div className="feature-panel__tags">
                      {selectedDepartment ? <span>{selectedDepartment.label}</span> : null}
                      <span>{selectedProduct.purity}</span>
                      <span>{selectedProduct.origin}</span>
                      {selectedProduct.isCertified ? <span>Certified</span> : null}
                    </div>

                    <ul className="feature-panel__list">
                      {selectedProduct.highlights.map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>

                    <p className="feature-panel__delivery">{selectedProduct.delivery}</p>

                    <div className="feature-panel__actions">
                      <button
                        type="button"
                        className="button button--primary button--full"
                        onClick={() => handleAddToBag(selectedProduct.id)}
                      >
                        Add selected piece
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="sidebar-card__empty">Filter reset will restore the featured jewellery view.</p>
                )}
              </section>

              <section className="sidebar-card sidebar-card--summary">
                <div className="sidebar-card__header">
                  <div>
                    <p className="section-label">Bag summary</p>
                    <h2>{bagItemCount} piece{bagItemCount === 1 ? '' : 's'}</h2>
                  </div>
                  <button type="button" className="ghost-link" onClick={() => setBagOpen(true)}>
                    Open bag
                  </button>
                </div>

                <div className="summary-rows">
                  <div>
                    <span>Subtotal</span>
                    <strong>{formatPrice(activeSummary.subtotal)}</strong>
                  </div>
                  <div>
                    <span>Insured shipping</span>
                    <strong>
                      {activeSummary.shipping === 0 ? 'Free' : formatPrice(activeSummary.shipping)}
                    </strong>
                  </div>
                  <div>
                    <span>Estimated VAT</span>
                    <strong>{formatPrice(activeSummary.vat)}</strong>
                  </div>
                  <div>
                    <span>Current savings</span>
                    <strong>{formatPrice(activeSummary.savings)}</strong>
                  </div>
                  <div className="summary-rows__total">
                    <span>Total</span>
                    <strong>{formatPrice(activeSummary.total)}</strong>
                  </div>
                </div>

                <div className="progress-card">
                  <p>
                    {activeSummary.freeShippingRemaining > 0
                      ? `Add ${formatPrice(activeSummary.freeShippingRemaining)} more for free insured shipping.`
                      : 'Your bag already qualifies for free insured shipping.'}
                  </p>
                  <div className="progress-bar" aria-hidden="true">
                    <span style={{ width: `${activeSummary.shippingProgress}%` }} />
                  </div>
                </div>

                {isQuoteLoading ? (
                  <p className="inline-note">Refreshing totals from the backend quote service...</p>
                ) : null}

                <div className="recommendation-stack">
                  {recommendations.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      className="recommendation-row"
                      onClick={() => handleAddToBag(product.id)}
                    >
                      <span>{product.name}</span>
                      <strong>{formatPrice(product.price)}</strong>
                    </button>
                  ))}
                </div>
              </section>

              <section className="sidebar-card sidebar-card--steps" id="checkout">
                <p className="section-label">Purchase flow</p>
                <h2>Designed for confident checkout</h2>
                <div className="checkout-steps">
                  {checkoutSteps.map((step) => (
                    <div key={step.step} className="checkout-step">
                      <span>{step.step}</span>
                      <div>
                        <h3>{step.title}</h3>
                        <p>{step.copy}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="deal-stack">
                  {topDeals.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      className="deal-row"
                      onClick={() => setSelectedProductId(product.id)}
                    >
                      <div>
                        <strong>{product.name}</strong>
                        <span>{product.dealPercent}% off</span>
                      </div>
                      <strong>{formatPrice(product.price)}</strong>
                    </button>
                  ))}
                </div>
              </section>
            </aside>
          </section>
        </main>

        <footer className="footer">
          <div className="footer__brand">
            <img className="footer__logo" src={nyraLogo} alt="Nyra logo" />
            <div>
              <p className="section-label">Nyra</p>
              <h2>Jewellery experience refined for Nepal.</h2>
              <p>
                A premium storefront experience for gold, silver, and diamond collections,
                designed to be elegant today and extensible as the business grows.
              </p>
            </div>
          </div>

          <div className="footer__columns">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3>{column.title}</h3>
                <ul>
                  {column.links.map((link) => (
                    <li key={link}>
                      <a href="#catalog">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </footer>
      </div>

      {isBagOpen ? (
        <div className="bag-overlay" role="presentation" onClick={() => setBagOpen(false)}>
          <aside
            className="bag-drawer"
            aria-label="Shopping bag"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bag-drawer__header">
              <div>
                <p className="section-label">Your bag</p>
                <h2>{bagItemCount} piece{bagItemCount === 1 ? '' : 's'}</h2>
              </div>
              <button type="button" className="ghost-link" onClick={() => setBagOpen(false)}>
                Close
              </button>
            </div>

            {bagLines.length > 0 ? (
              <div className="bag-drawer__content">
                <div className="bag-line-list">
                  {bagLines.map((line) => (
                    <article key={line.product.id} className="bag-line">
                      <ProductArt product={line.product} />
                      <div className="bag-line__copy">
                        <div>
                          <h3>{line.product.name}</h3>
                          <p>{line.product.purity}</p>
                          <span>{line.product.delivery}</span>
                        </div>

                        <strong>{formatPrice(line.product.price * line.quantity)}</strong>

                        <div className="bag-line__controls">
                          <div className="quantity-stepper">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(line.product.id, -1)}
                            >
                              -
                            </button>
                            <span>{line.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(line.product.id, 1)}
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            className="text-button"
                            onClick={() => handleRemoveFromBag(line.product.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="bag-drawer__summary">
                  <div>
                    <span>Subtotal</span>
                    <strong>{formatPrice(activeSummary.subtotal)}</strong>
                  </div>
                  <div>
                    <span>Insured shipping</span>
                    <strong>
                      {activeSummary.shipping === 0 ? 'Free' : formatPrice(activeSummary.shipping)}
                    </strong>
                  </div>
                  <div>
                    <span>Estimated VAT</span>
                    <strong>{formatPrice(activeSummary.vat)}</strong>
                  </div>
                  <div>
                    <span>Savings</span>
                    <strong>{formatPrice(activeSummary.savings)}</strong>
                  </div>
                  <div className="bag-drawer__total">
                    <span>Total</span>
                    <strong>{formatPrice(activeSummary.total)}</strong>
                  </div>
                  <button
                    type="button"
                    className="button button--primary button--full"
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut ? 'Placing order...' : 'Checkout with eSewa / card'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-bag">
                <img src={nyraLogo} alt="Nyra logo" />
                <h3>Your bag is empty.</h3>
                <p>Add a Nyra piece to review pricing, delivery, and checkout details.</p>
              </div>
            )}
          </aside>
        </div>
      ) : null}
    </>
  )
}

export default App
