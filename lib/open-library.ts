// Open Library API integration
// Docs: https://openlibrary.org/developers/api

const BASE_URL = 'https://openlibrary.org'
const COVERS_URL = 'https://covers.openlibrary.org'

export type OpenLibrarySearchResult = {
  key: string // e.g., "/works/OL45804W"
  title: string
  author_name?: string[]
  first_publish_year?: number
  cover_i?: number // cover ID
  isbn?: string[]
  subject?: string[]
  language?: string[]
  edition_count?: number
  number_of_pages_median?: number
}

export type OpenLibraryWork = {
  key: string
  title: string
  description?: string | { value: string }
  covers?: number[]
  subjects?: string[]
  subject_places?: string[]
  subject_times?: string[]
  authors?: Array<{ author: { key: string } }>
}

export type OpenLibraryEdition = {
  key: string
  title: string
  isbn_13?: string[]
  isbn_10?: string[]
  number_of_pages?: number
  publishers?: string[]
  publish_date?: string
  covers?: number[]
  languages?: Array<{ key: string }>
}

export type OpenLibraryAuthor = {
  key: string
  name: string
  bio?: string | { value: string }
  photos?: number[]
}

export type BookData = {
  openLibraryKey: string
  title: string
  authors: string[]
  description: string | null
  coverSmall: string | null
  coverMedium: string | null
  coverLarge: string | null
  publishedDate: string | null
  publisher: string | null
  pageCount: number | null
  genres: string[]
  subjects: string[]
  isbn13: string | null
  isbn10: string | null
  language: string
}

// Get cover URL from cover ID
export function getCoverUrl(coverId: number | undefined, size: 'S' | 'M' | 'L' = 'M'): string | null {
  if (!coverId) return null
  return `${COVERS_URL}/b/id/${coverId}-${size}.jpg`
}

// Get cover URL from ISBN
export function getCoverUrlByIsbn(isbn: string, size: 'S' | 'M' | 'L' = 'M'): string {
  return `${COVERS_URL}/b/isbn/${isbn}-${size}.jpg`
}

// Search for books
export async function searchBooks(
  query: string,
  options: {
    limit?: number
    offset?: number
    fields?: string[]
  } = {}
): Promise<{
  results: OpenLibrarySearchResult[]
  total: number
  offset: number
}> {
  const { limit = 20, offset = 0 } = options

  const fields = [
    'key',
    'title',
    'author_name',
    'first_publish_year',
    'cover_i',
    'isbn',
    'subject',
    'language',
    'edition_count',
    'number_of_pages_median',
  ].join(',')

  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
    offset: offset.toString(),
    fields,
  })

  const response = await fetch(`${BASE_URL}/search.json?${params}`)

  if (!response.ok) {
    throw new Error(`Open Library search failed: ${response.statusText}`)
  }

  const data = await response.json()

  return {
    results: data.docs || [],
    total: data.numFound || 0,
    offset: data.start || 0,
  }
}

// Get work details by key (e.g., "/works/OL45804W")
export async function getWork(workKey: string): Promise<OpenLibraryWork> {
  const key = workKey.startsWith('/works/') ? workKey : `/works/${workKey}`

  const response = await fetch(`${BASE_URL}${key}.json`)

  if (!response.ok) {
    throw new Error(`Failed to fetch work: ${response.statusText}`)
  }

  return response.json()
}

// Get edition details by key
export async function getEdition(editionKey: string): Promise<OpenLibraryEdition> {
  const key = editionKey.startsWith('/books/') ? editionKey : `/books/${editionKey}`

  const response = await fetch(`${BASE_URL}${key}.json`)

  if (!response.ok) {
    throw new Error(`Failed to fetch edition: ${response.statusText}`)
  }

  return response.json()
}

// Get author details
export async function getAuthor(authorKey: string): Promise<OpenLibraryAuthor> {
  const key = authorKey.startsWith('/authors/') ? authorKey : `/authors/${authorKey}`

  const response = await fetch(`${BASE_URL}${key}.json`)

  if (!response.ok) {
    throw new Error(`Failed to fetch author: ${response.statusText}`)
  }

  return response.json()
}

// Get editions for a work
export async function getWorkEditions(
  workKey: string,
  limit: number = 10
): Promise<OpenLibraryEdition[]> {
  const key = workKey.startsWith('/works/') ? workKey : `/works/${workKey}`

  const response = await fetch(`${BASE_URL}${key}/editions.json?limit=${limit}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch editions: ${response.statusText}`)
  }

  const data = await response.json()
  return data.entries || []
}

// Trending book entry from Open Library
export type TrendingWork = {
  key: string
  title: string
  author_key?: string[]
  author_name?: string[]
  cover_i?: number
  first_publish_year?: number
  edition_count?: number
}

// Get trending books
export async function getTrendingBooks(
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily',
  limit: number = 20
): Promise<TrendingWork[]> {
  const response = await fetch(`${BASE_URL}/trending/${type}.json?limit=${limit}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch trending books: ${response.statusText}`)
  }

  const data = await response.json()
  return data.works || []
}

// Subject work entry
export type SubjectWork = {
  key: string
  title: string
  authors?: Array<{ key: string; name: string }>
  cover_id?: number
  first_publish_year?: number
  edition_count?: number
  availability?: {
    is_readable?: boolean
  }
}

// Get books by subject/genre
export async function getSubjectBooks(
  subject: string,
  options: {
    limit?: number
    offset?: number
    sort?: 'editions' | 'old' | 'new' | 'rating'
  } = {}
): Promise<{
  works: SubjectWork[]
  work_count: number
  name: string
}> {
  const { limit = 20, offset = 0, sort = 'editions' } = options
  const subjectSlug = subject.toLowerCase().replace(/\s+/g, '_')

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  })

  // Only add sort if not default
  if (sort !== 'editions') {
    params.set('sort', sort)
  }

  const response = await fetch(`${BASE_URL}/subjects/${subjectSlug}.json?${params}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch subject books: ${response.statusText}`)
  }

  const data = await response.json()
  return {
    works: data.works || [],
    work_count: data.work_count || 0,
    name: data.name || subject,
  }
}

// Popular subjects/genres
export const POPULAR_SUBJECTS = [
  { id: 'fiction', name: 'Fiction', icon: 'book' },
  { id: 'mystery', name: 'Mystery & Thriller', icon: 'search' },
  { id: 'romance', name: 'Romance', icon: 'heart' },
  { id: 'science_fiction', name: 'Science Fiction', icon: 'rocket' },
  { id: 'fantasy', name: 'Fantasy', icon: 'sparkles' },
  { id: 'horror', name: 'Horror', icon: 'skull' },
  { id: 'biography', name: 'Biography', icon: 'user' },
  { id: 'history', name: 'History', icon: 'clock' },
  { id: 'self-help', name: 'Self-Help', icon: 'lightbulb' },
  { id: 'business', name: 'Business', icon: 'briefcase' },
  { id: 'philosophy', name: 'Philosophy', icon: 'brain' },
  { id: 'poetry', name: 'Poetry', icon: 'feather' },
  { id: 'young_adult', name: 'Young Adult', icon: 'users' },
  { id: 'children', name: 'Children\'s Books', icon: 'baby' },
  { id: 'classics', name: 'Classics', icon: 'bookmark' },
  { id: 'literary_fiction', name: 'Literary Fiction', icon: 'book-open' },
]

// Helper to extract description text
function extractDescription(desc: string | { value: string } | undefined): string | null {
  if (!desc) return null
  if (typeof desc === 'string') return desc
  if (typeof desc === 'object' && 'value' in desc) return desc.value
  return null
}

// Fetch complete book data from a search result
export async function getBookData(searchResult: OpenLibrarySearchResult): Promise<BookData> {
  const workKey = searchResult.key

  // Fetch work details for description
  let work: OpenLibraryWork | null = null
  try {
    work = await getWork(workKey)
  } catch (error) {
    console.error('Failed to fetch work details:', error)
  }

  // Try to get the best edition with ISBN and page count
  let edition: OpenLibraryEdition | null = null
  try {
    const editions = await getWorkEditions(workKey, 5)
    // Prefer editions with ISBN-13 and page count
    edition = editions.find(e => e.isbn_13?.length && e.number_of_pages)
      || editions.find(e => e.isbn_13?.length)
      || editions.find(e => e.number_of_pages)
      || editions[0]
      || null
  } catch (error) {
    console.error('Failed to fetch editions:', error)
  }

  // Get cover ID - prefer from search result, then work, then edition
  const coverId = searchResult.cover_i || work?.covers?.[0] || edition?.covers?.[0]

  // Extract subjects/genres
  const subjects = [
    ...(searchResult.subject || []),
    ...(work?.subjects || []),
  ].slice(0, 20)

  // Common genre keywords to extract from subjects
  const genreKeywords = [
    'fiction', 'non-fiction', 'nonfiction', 'mystery', 'thriller', 'romance',
    'fantasy', 'science fiction', 'horror', 'biography', 'memoir', 'history',
    'self-help', 'business', 'philosophy', 'poetry', 'drama', 'adventure',
    'young adult', 'children', 'classic', 'literary fiction', 'historical fiction',
  ]

  const genres = subjects
    .filter(s => genreKeywords.some(g => s.toLowerCase().includes(g)))
    .slice(0, 5)

  return {
    openLibraryKey: workKey,
    title: searchResult.title,
    authors: searchResult.author_name || [],
    description: extractDescription(work?.description),
    coverSmall: getCoverUrl(coverId, 'S'),
    coverMedium: getCoverUrl(coverId, 'M'),
    coverLarge: getCoverUrl(coverId, 'L'),
    publishedDate: searchResult.first_publish_year?.toString() || edition?.publish_date || null,
    publisher: edition?.publishers?.[0] || null,
    pageCount: searchResult.number_of_pages_median || edition?.number_of_pages || null,
    genres,
    subjects: subjects.slice(0, 10),
    isbn13: edition?.isbn_13?.[0] || searchResult.isbn?.find(i => i.length === 13) || null,
    isbn10: edition?.isbn_10?.[0] || searchResult.isbn?.find(i => i.length === 10) || null,
    language: searchResult.language?.[0] || 'en',
  }
}

// Search and return formatted book data
export async function searchBooksFormatted(
  query: string,
  limit: number = 20
): Promise<Array<{
  key: string
  title: string
  authors: string[]
  year: number | null
  coverUrl: string | null
  pageCount: number | null
}>> {
  const { results } = await searchBooks(query, { limit })

  return results.map(result => ({
    key: result.key,
    title: result.title,
    authors: result.author_name || [],
    year: result.first_publish_year || null,
    coverUrl: getCoverUrl(result.cover_i, 'L'),
    pageCount: result.number_of_pages_median || null,
  }))
}
