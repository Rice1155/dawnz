// Multi-source book cover fetching
// Tries multiple sources to find the best available cover

const OPEN_LIBRARY_COVERS = 'https://covers.openlibrary.org'
const ABEBOOKS_COVERS = 'https://pictures.abebooks.com/isbn'

export type CoverSize = 'S' | 'M' | 'L'

// Cover URL generators for different sources
export const coverSources = {
  // Open Library by ISBN
  openLibraryIsbn: (isbn: string, size: CoverSize = 'L') =>
    `${OPEN_LIBRARY_COVERS}/b/isbn/${isbn}-${size}.jpg`,

  // Open Library by cover ID
  openLibraryCoverId: (coverId: number, size: CoverSize = 'L') =>
    `${OPEN_LIBRARY_COVERS}/b/id/${coverId}-${size}.jpg`,

  // AbeBooks (usually has good quality covers)
  abeBooks: (isbn: string) =>
    `${ABEBOOKS_COVERS}/${isbn}-L.jpg`,
}

// Check if a cover URL returns a valid image (not a placeholder or 404)
async function isValidCover(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })

    // Check if response is OK
    if (!response.ok) return false

    // Check content type is an image
    const contentType = response.headers.get('content-type')
    if (!contentType?.startsWith('image/')) return false

    // Check content length (Open Library returns a 1x1 pixel for missing covers)
    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength) < 1000) return false

    return true
  } catch {
    return false
  }
}

// Find the best ISBN from a list (prefer ISBN-13, then ISBN-10, prefer English editions)
function selectBestIsbn(isbns: string[]): { isbn13: string | null; isbn10: string | null } {
  if (!isbns || isbns.length === 0) {
    return { isbn13: null, isbn10: null }
  }

  // Common English publisher prefixes (US: 978-0, 978-1, UK: 978-0)
  const englishPrefixes = ['9780', '9781', '0', '1']

  const isbn13s = isbns.filter(isbn => isbn.length === 13)
  const isbn10s = isbns.filter(isbn => isbn.length === 10)

  // Try to find English ISBN-13 first
  const englishIsbn13 = isbn13s.find(isbn =>
    englishPrefixes.some(prefix => isbn.startsWith(prefix))
  )

  // Try to find English ISBN-10
  const englishIsbn10 = isbn10s.find(isbn =>
    englishPrefixes.some(prefix => isbn.startsWith(prefix))
  )

  return {
    isbn13: englishIsbn13 || isbn13s[0] || null,
    isbn10: englishIsbn10 || isbn10s[0] || null,
  }
}

// Get the best cover URL by trying multiple sources
// This is a synchronous version that returns the URL to try (for speed)
// The browser will handle the fallback via onerror
export function getBestCoverUrl(options: {
  isbns?: string[]
  coverId?: number
  size?: CoverSize
}): string | null {
  const { isbns, coverId, size = 'L' } = options
  const { isbn13, isbn10 } = selectBestIsbn(isbns || [])

  // Priority: English ISBN-13 > English ISBN-10 > Cover ID > Any ISBN
  if (isbn13) {
    return coverSources.openLibraryIsbn(isbn13, size)
  }

  if (isbn10) {
    return coverSources.openLibraryIsbn(isbn10, size)
  }

  if (coverId) {
    return coverSources.openLibraryCoverId(coverId, size)
  }

  return null
}

// Get multiple cover URLs to try (for client-side fallback)
export function getCoverUrlsToTry(options: {
  isbns?: string[]
  coverId?: number
  size?: CoverSize
}): string[] {
  const { isbns, coverId, size = 'L' } = options
  const { isbn13, isbn10 } = selectBestIsbn(isbns || [])
  const urls: string[] = []

  // Add URLs in priority order
  if (isbn13) {
    urls.push(coverSources.openLibraryIsbn(isbn13, size))
    urls.push(coverSources.abeBooks(isbn13))
  }

  if (isbn10) {
    urls.push(coverSources.openLibraryIsbn(isbn10, size))
    urls.push(coverSources.abeBooks(isbn10))
  }

  if (coverId) {
    urls.push(coverSources.openLibraryCoverId(coverId, size))
  }

  // Deduplicate
  return [...new Set(urls)]
}

// Async version that validates covers (slower but more accurate)
export async function getBestValidCoverUrl(options: {
  isbns?: string[]
  coverId?: number
  size?: CoverSize
}): Promise<string | null> {
  const urlsToTry = getCoverUrlsToTry(options)

  for (const url of urlsToTry) {
    if (await isValidCover(url)) {
      return url
    }
  }

  return null
}
