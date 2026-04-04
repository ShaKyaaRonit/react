import { randomUUID } from 'node:crypto'
import { loadDatabase } from './database.mjs'

const allowedSortOptions = new Set(['featured', 'price-low', 'price-high', 'rating', 'deal'])

function compareProducts(left, right, sortOption) {
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

function getSearchHaystack(product) {
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

export function getStorefrontData() {
  return loadDatabase()
}

export function getProducts(query = {}) {
  const database = loadDatabase()
  const department = typeof query.department === 'string' ? query.department : 'all'
  const searchTerm = typeof query.q === 'string' ? query.q.trim().toLowerCase() : ''
  const sortOption =
    typeof query.sort === 'string' && allowedSortOptions.has(query.sort)
      ? query.sort
      : 'featured'

  return [...database.products]
    .filter((product) => {
      if (department !== 'all' && product.department !== department) {
        return false
      }

      if (!searchTerm) {
        return true
      }

      return getSearchHaystack(product).includes(searchTerm)
    })
    .sort((left, right) => compareProducts(left, right, sortOption))
}

export function getProductById(productId) {
  const database = loadDatabase()
  return database.products.find((product) => product.id === productId) ?? null
}

function sanitizeQuoteItems(items) {
  if (!Array.isArray(items)) {
    throw new Error('Quote request must include an items array.')
  }

  return items
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const productId = typeof item.productId === 'string' ? item.productId : ''
      const quantity = Number(item.quantity)

      if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
        return null
      }

      return { productId, quantity }
    })
    .filter(Boolean)
}

export function buildQuote(items) {
  const database = loadDatabase()
  const productsById = new Map(database.products.map((product) => [product.id, product]))
  const sanitizedItems = sanitizeQuoteItems(items)

  const lines = sanitizedItems.map((item) => {
    const product = productsById.get(item.productId)

    if (!product) {
      throw new Error(`Product "${item.productId}" was not found in the dummy database.`)
    }

    return {
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
      lineTotal: product.price * item.quantity,
      savings: product.originalPrice
        ? (product.originalPrice - product.price) * item.quantity
        : 0,
    }
  })

  const itemCount = lines.reduce((total, line) => total + line.quantity, 0)
  const subtotal = lines.reduce((total, line) => total + line.lineTotal, 0)
  const savings = lines.reduce((total, line) => total + line.savings, 0)
  const shipping =
    itemCount === 0
      ? 0
      : subtotal >= database.settings.freeInsuredShippingThreshold
        ? 0
        : database.settings.standardInsuredShipping
  const vat = Math.round(subtotal * database.settings.vatRate)
  const total = subtotal + shipping + vat
  const freeShippingRemaining = Math.max(0, database.settings.freeInsuredShippingThreshold - subtotal)
  const shippingProgress = Math.min(
    100,
    (subtotal / database.settings.freeInsuredShippingThreshold) * 100,
  )

  return {
    currency: database.settings.currency,
    lines: lines.map(({ savings: _ignored, ...line }) => line),
    summary: {
      itemCount,
      subtotal,
      shipping,
      vat,
      total,
      savings,
      freeShippingRemaining,
      shippingProgress,
    },
  }
}

export function createOrder(items) {
  const quote = buildQuote(items)

  return {
    orderId: `NYR-${randomUUID().slice(0, 8).toUpperCase()}`,
    status: 'created',
    createdAt: new Date().toISOString(),
    summary: quote.summary,
  }
}
