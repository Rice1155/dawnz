// Google Books API integration
// Docs: https://developers.google.com/books/docs/v1/using

const BASE_URL = 'https://www.googleapis.com/books/v1'

export type GoogleBookVolume = {
  id: string
  volumeInfo: {
    title: string
    subtitle?: string
    authors?: string[]
    publisher?: string
    publishedDate?: string
    description?: string
    industryIdentifiers?: Array<{
      type: string
      identifier: string
    }>
    pageCount?: number
    categories?: string[]
    averageRating?: number
    ratingsCount?: number
    imageLinks?: {
      smallThumbnail?: string
      thumbnail?: string
      small?: string
      medium?: string
      large?: string
      extraLarge?: string
    }
    language?: string
    previewLink?: string
    infoLink?: string
  }
}

export type GoogleBooksSearchResponse = {
  kind: string
  totalItems: number
  items?: GoogleBookVolume[]
}

export type BookResult = {
  key: string
  title: string
  authors: string[]
  year: number | null
  coverUrl: string | null
  pageCount: number | null
  description?: string | null
  publisher?: string | null
  isbn13?: string | null
  isbn10?: string | null
  categories?: string[]
  rating?: number | null
  ratingsCount?: number | null
}

// Get high-quality cover URL from Google Books
function getCoverUrl(imageLinks?: GoogleBookVolume['volumeInfo']['imageLinks']): string | null {
  if (!imageLinks) return null

  // Prefer larger images, remove edge curl effect by replacing zoom parameter
  const url = imageLinks.extraLarge
    || imageLinks.large
    || imageLinks.medium
    || imageLinks.thumbnail
    || imageLinks.smallThumbnail

  if (!url) return null

  // Upgrade to higher quality and remove curl effect
  return url
    .replace('http://', 'https://')
    .replace('&edge=curl', '')
    .replace('zoom=1', 'zoom=2')
}

// Extract ISBN from industry identifiers
function getISBN(identifiers?: GoogleBookVolume['volumeInfo']['industryIdentifiers']): { isbn13: string | null, isbn10: string | null } {
  if (!identifiers) return { isbn13: null, isbn10: null }

  const isbn13 = identifiers.find(i => i.type === 'ISBN_13')?.identifier || null
  const isbn10 = identifiers.find(i => i.type === 'ISBN_10')?.identifier || null

  return { isbn13, isbn10 }
}

// Extract year from published date
function extractYear(publishedDate?: string): number | null {
  if (!publishedDate) return null
  const match = publishedDate.match(/(\d{4})/)
  return match ? parseInt(match[1]) : null
}

// Search for books
export async function searchBooks(
  query: string,
  options: {
    limit?: number
    startIndex?: number
    orderBy?: 'relevance' | 'newest'
  } = {}
): Promise<{
  results: BookResult[]
  total: number
}> {
  const { limit = 20, startIndex = 0, orderBy = 'relevance' } = options

  const params = new URLSearchParams({
    q: query,
    maxResults: Math.min(limit, 40).toString(),
    startIndex: startIndex.toString(),
    orderBy,
    printType: 'books',
  })

  const response = await fetch(`${BASE_URL}/volumes?${params}`)

  if (!response.ok) {
    throw new Error(`Google Books search failed: ${response.statusText}`)
  }

  const data: GoogleBooksSearchResponse = await response.json()

  const results: BookResult[] = (data.items || []).map(volume => {
    const { isbn13, isbn10 } = getISBN(volume.volumeInfo.industryIdentifiers)

    return {
      key: volume.id,
      title: volume.volumeInfo.title,
      authors: volume.volumeInfo.authors || [],
      year: extractYear(volume.volumeInfo.publishedDate),
      coverUrl: getCoverUrl(volume.volumeInfo.imageLinks),
      pageCount: volume.volumeInfo.pageCount || null,
      description: volume.volumeInfo.description || null,
      publisher: volume.volumeInfo.publisher || null,
      isbn13,
      isbn10,
      categories: volume.volumeInfo.categories || [],
      rating: volume.volumeInfo.averageRating || null,
      ratingsCount: volume.volumeInfo.ratingsCount || null,
    }
  })

  return {
    results,
    total: data.totalItems || 0,
  }
}

// Get book details by Google Books ID
export async function getBook(bookId: string): Promise<BookResult | null> {
  const response = await fetch(`${BASE_URL}/volumes/${bookId}`)

  if (!response.ok) {
    if (response.status === 404) return null
    throw new Error(`Google Books fetch failed: ${response.statusText}`)
  }

  const volume: GoogleBookVolume = await response.json()
  const { isbn13, isbn10 } = getISBN(volume.volumeInfo.industryIdentifiers)

  return {
    key: volume.id,
    title: volume.volumeInfo.title,
    authors: volume.volumeInfo.authors || [],
    year: extractYear(volume.volumeInfo.publishedDate),
    coverUrl: getCoverUrl(volume.volumeInfo.imageLinks),
    pageCount: volume.volumeInfo.pageCount || null,
    description: volume.volumeInfo.description || null,
    publisher: volume.volumeInfo.publisher || null,
    isbn13,
    isbn10,
    categories: volume.volumeInfo.categories || [],
    rating: volume.volumeInfo.averageRating || null,
    ratingsCount: volume.volumeInfo.ratingsCount || null,
  }
}

// Search by ISBN
export async function searchByISBN(isbn: string): Promise<BookResult | null> {
  const { results } = await searchBooks(`isbn:${isbn}`, { limit: 1 })
  return results[0] || null
}

// Search by title and author for more accurate results
export async function searchByTitleAndAuthor(
  title: string,
  author?: string
): Promise<BookResult[]> {
  let query = `intitle:${title}`
  if (author) {
    query += `+inauthor:${author}`
  }

  const { results } = await searchBooks(query, { limit: 10 })
  return results
}

// Get books by category/subject
export async function getBooksByCategory(
  category: string,
  options: {
    limit?: number
    startIndex?: number
    orderBy?: 'relevance' | 'newest'
  } = {}
): Promise<{
  results: BookResult[]
  total: number
}> {
  return searchBooks(`subject:${category}`, options)
}

// Get newest books (useful for "trending" or "new releases")
export async function getNewestBooks(
  query: string = '',
  limit: number = 20
): Promise<BookResult[]> {
  const searchQuery = query || 'fiction'
  const { results } = await searchBooks(searchQuery, {
    limit,
    orderBy: 'newest'
  })
  return results
}
