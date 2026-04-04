import type {
  OrderResponse,
  ProductListResponse,
  QuoteRequestItem,
  QuoteResponse,
  StorefrontResponse,
} from './storefront'

const API_BASE = '/api'
type FetchProductsParams = {
  department: string
  q: string
  sort: string
}

async function readJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init)

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`

    try {
      const payload = (await response.json()) as { error?: string }
      if (payload.error) {
        message = payload.error
      }
    } catch {
      // Ignore JSON parsing failures and keep the generic message.
    }

    throw new Error(message)
  }

  return (await response.json()) as T
}

export function fetchStorefront(signal?: AbortSignal) {
  return readJson<StorefrontResponse>(`${API_BASE}/storefront`, { signal })
}

export function fetchProducts(params: FetchProductsParams, signal?: AbortSignal) {
  const searchParams = new URLSearchParams({
    department: params.department,
    q: params.q,
    sort: params.sort,
  })

  return readJson<ProductListResponse>(`${API_BASE}/products?${searchParams.toString()}`, {
    signal,
  })
}

export function requestBagQuote(items: QuoteRequestItem[], signal?: AbortSignal) {
  return readJson<QuoteResponse>(`${API_BASE}/orders/quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items }),
    signal,
  })
}

export function createOrder(items: QuoteRequestItem[], signal?: AbortSignal) {
  return readJson<OrderResponse>(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items }),
    signal,
  })
}
