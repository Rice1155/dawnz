'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  Loader2,
  BookOpen,
  TrendingUp,
  Sparkles,
  Filter,
  ChevronRight,
  Plus,
  X,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Featured/Staff picks (curated selection)
const featuredBooks = [
  { key: '/works/OL20965973W', title: 'The Midnight Library', author: 'Matt Haig', cover: 'https://covers.openlibrary.org/b/isbn/9780525559474-L.jpg', year: 2020 },
  { key: '/works/OL17930368W', title: 'Atomic Habits', author: 'James Clear', cover: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg', year: 2018 },
  { key: '/works/OL18766691W', title: 'Where the Crawdads Sing', author: 'Delia Owens', cover: 'https://covers.openlibrary.org/b/isbn/9780735219090-L.jpg', year: 2018 },
  { key: '/works/OL21745884W', title: 'Project Hail Mary', author: 'Andy Weir', cover: 'https://covers.openlibrary.org/b/isbn/9780593135204-L.jpg', year: 2021 },
  { key: '/works/OL18203673W', title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid', cover: 'https://covers.openlibrary.org/b/isbn/9781501161933-L.jpg', year: 2017 },
]

// Genre categories that link to dynamic category pages
const genres = [
  { id: 'fiction', name: 'Fiction', slug: 'fiction' },
  { id: 'mystery', name: 'Mystery & Thriller', slug: 'mystery' },
  { id: 'romance', name: 'Romance', slug: 'romance' },
  { id: 'science_fiction', name: 'Science Fiction', slug: 'science_fiction' },
  { id: 'fantasy', name: 'Fantasy', slug: 'fantasy' },
  { id: 'horror', name: 'Horror', slug: 'horror' },
  { id: 'biography', name: 'Biography', slug: 'biography' },
  { id: 'history', name: 'History', slug: 'history' },
  { id: 'self-help', name: 'Self-Help', slug: 'self-help' },
  { id: 'business', name: 'Business', slug: 'business' },
  { id: 'young_adult', name: 'Young Adult', slug: 'young_adult' },
  { id: 'classics', name: 'Classics', slug: 'classics' },
]

type Book = {
  key: string
  title: string
  author?: string
  authors?: string[]
  cover?: string | null
  coverUrl?: string | null
  coverUrls?: string[] // Fallback cover URLs
  year?: number | null
}

type BookSection = {
  id: string
  title: string
  icon: typeof TrendingUp
  slug: string
  books: Book[]
  isLoading: boolean
}

export default function BrowsePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Book[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [trendingBooks, setTrendingBooks] = useState<Book[]>([])
  const [isTrendingLoading, setIsTrendingLoading] = useState(true)

  // Additional book sections
  const [classicsBooks, setClassicsBooks] = useState<Book[]>([])
  const [isClassicsLoading, setIsClassicsLoading] = useState(true)
  const [fantasyBooks, setFantasyBooks] = useState<Book[]>([])
  const [isFantasyLoading, setIsFantasyLoading] = useState(true)
  const [mysteryBooks, setMysteryBooks] = useState<Book[]>([])
  const [isMysteryLoading, setIsMysteryLoading] = useState(true)
  const [sciFiBooks, setSciFiBooks] = useState<Book[]>([])
  const [isSciFiLoading, setIsSciFiLoading] = useState(true)
  const [romanceBooks, setRomanceBooks] = useState<Book[]>([])
  const [isRomanceLoading, setIsRomanceLoading] = useState(true)
  const [biographyBooks, setBiographyBooks] = useState<Book[]>([])
  const [isBiographyLoading, setIsBiographyLoading] = useState(true)

  // Fetch all book sections on mount
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await fetch('/api/books/trending?period=daily&limit=10')
        if (response.ok) {
          const data = await response.json()
          setTrendingBooks(data.books || [])
        }
      } catch (error) {
        console.error('Error fetching trending:', error)
      } finally {
        setIsTrendingLoading(false)
      }
    }

    const fetchCategory = async (
      category: string,
      setBooks: (books: Book[]) => void,
      setLoading: (loading: boolean) => void
    ) => {
      try {
        const response = await fetch(`/api/books/category?category=${category}&limit=10&sort=editions`)
        if (response.ok) {
          const data = await response.json()
          setBooks(data.books || [])
        }
      } catch (error) {
        console.error(`Error fetching ${category}:`, error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrending()
    fetchCategory('classics', setClassicsBooks, setIsClassicsLoading)
    fetchCategory('fantasy', setFantasyBooks, setIsFantasyLoading)
    fetchCategory('mystery', setMysteryBooks, setIsMysteryLoading)
    fetchCategory('science_fiction', setSciFiBooks, setIsSciFiLoading)
    fetchCategory('romance', setRomanceBooks, setIsRomanceLoading)
    fetchCategory('biography', setBiographyBooks, setIsBiographyLoading)
  }, [])

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery
    if (!searchTerm.trim()) return

    setIsSearching(true)
    setHasSearched(true)

    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(searchTerm)}&limit=20`)

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      setSearchResults(data.books || [])
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Failed to search books. Please try again.')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setHasSearched(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
          Discover Your Next Read
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Search millions of books or browse our curated collections to find something that speaks to you.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by title, author, or ISBN..."
            className="h-14 text-lg bg-card border-border focus:border-primary pl-12 pr-32"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-24 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Button
            onClick={() => handleSearch()}
            disabled={isSearching || !searchQuery.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Search'
            )}
          </Button>
        </div>
      </div>

      {/* Search Results */}
      {hasSearched && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-semibold">
              {isSearching ? 'Searching...' : `Results for "${searchQuery}"`}
            </h2>
            <button
              onClick={clearSearch}
              className="text-sm text-primary hover:text-primary/80 cursor-pointer"
            >
              Clear search
            </button>
          </div>

          {isSearching ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {searchResults.map((book) => (
                <BookCard key={book.key} book={book} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No books found. Try a different search term.</p>
            </div>
          )}
        </section>
      )}

      {/* Browse by Genre */}
      {!hasSearched && (
        <>
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Browse by Genre
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              {genres.map((genre) => (
                <Link
                  key={genre.id}
                  href={`/browse/category/${genre.slug}`}
                  className="px-4 py-2 rounded-lg font-body text-sm transition-all duration-200 border bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card/80"
                >
                  {genre.name}
                </Link>
              ))}
            </div>
          </section>

          {/* Trending Now */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Trending Now
              </h2>
              <Link
                href="/browse/trending"
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
              >
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {isTrendingLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : trendingBooks.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {trendingBooks.map((book) => (
                  <BookCard key={book.key} book={book} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Unable to load trending books
              </div>
            )}
          </section>

          {/* Staff Picks */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Staff Picks
              </h2>
              <Link
                href="/browse/staff-picks"
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
              >
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {featuredBooks.map((book) => (
                <BookCard key={book.key} book={book} />
              ))}
            </div>
          </section>

          {/* Classics */}
          <BookSection
            title="Timeless Classics"
            slug="classics"
            books={classicsBooks}
            isLoading={isClassicsLoading}
            icon="📚"
          />

          {/* Fantasy */}
          <BookSection
            title="Fantasy Adventures"
            slug="fantasy"
            books={fantasyBooks}
            isLoading={isFantasyLoading}
            icon="🐉"
          />

          {/* Mystery & Thriller */}
          <BookSection
            title="Mystery & Thriller"
            slug="mystery"
            books={mysteryBooks}
            isLoading={isMysteryLoading}
            icon="🔍"
          />

          {/* Science Fiction */}
          <BookSection
            title="Science Fiction"
            slug="science_fiction"
            books={sciFiBooks}
            isLoading={isSciFiLoading}
            icon="🚀"
          />

          {/* Romance */}
          <BookSection
            title="Romance"
            slug="romance"
            books={romanceBooks}
            isLoading={isRomanceLoading}
            icon="💕"
          />

          {/* Biography */}
          <BookSection
            title="Biography & Memoir"
            slug="biography"
            books={biographyBooks}
            isLoading={isBiographyLoading}
            icon="👤"
          />

          {/* Personalized Recommendations CTA */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border border-primary/20 p-8 text-center">
            <div className="relative z-10">
              <Sparkles className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-display text-2xl font-bold mb-2">
                Get Personalized Recommendations
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Based on your reading history and preferences, we'll suggest books you'll love.
              </p>
              <Button className="bg-primary hover:bg-primary/90">
                View My Recommendations
              </Button>
            </div>
            <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -left-16 -top-16 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
          </section>
        </>
      )}
    </div>
  )
}

function BookSection({
  title,
  slug,
  books,
  isLoading,
  icon,
}: {
  title: string
  slug: string
  books: Book[]
  isLoading: boolean
  icon: string
}) {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          {title}
        </h2>
        <Link
          href={`/browse/category/${slug}`}
          className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
        >
          View all <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {books.map((book) => (
            <BookCard key={book.key} book={book} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Unable to load books
        </div>
      )}
    </section>
  )
}

function BookCard({ book }: { book: Book }) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isAdded, setIsAdded] = useState(false)
  const [coverIndex, setCoverIndex] = useState(0)
  const [coverFailed, setCoverFailed] = useState(false)

  // Build list of cover URLs to try
  const coverUrls = [
    book.cover,
    book.coverUrl,
    ...(book.coverUrls || []),
  ].filter(Boolean) as string[]

  const currentCoverUrl = coverUrls[coverIndex]
  const authorName = book.author || book.authors?.join(', ') || 'Unknown Author'

  // Handle cover load error - try next URL
  const handleCoverError = () => {
    if (coverIndex < coverUrls.length - 1) {
      setCoverIndex(coverIndex + 1)
    } else {
      setCoverFailed(true)
    }
  }

  // Check if loaded image is valid (not a tiny placeholder)
  const handleCoverLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    // Open Library returns 1x1 pixel for missing covers
    if (img.naturalWidth < 10 || img.naturalHeight < 10) {
      handleCoverError()
    }
  }

  const handleAddToShelf = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsAdding(true)
    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openLibraryKey: book.key,
          addToLibrary: true,
          status: 'want_to_read',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 401) {
          toast.error('Please log in to add books to your shelf')
          router.push('/login')
          return
        }
        throw new Error(data.error || 'Failed to add book')
      }

      setIsAdded(true)
      toast.success(`"${book.title}" added to your shelf!`)
    } catch (error: any) {
      console.error('Error adding book:', error)
      toast.error(error.message || 'Failed to add book')
    } finally {
      setIsAdding(false)
    }
  }

  // Encode the Open Library key for use in URL
  const bookUrl = `/book/${encodeURIComponent(book.key)}`

  return (
    <Link
      href={bookUrl}
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-3 book-shadow bg-muted">
        {currentCoverUrl && !coverFailed ? (
          <img
            src={currentCoverUrl}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={handleCoverError}
            onLoad={handleCoverLoad}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <BookOpen className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        {/* Quick add overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30 flex flex-col justify-end p-3 transition-opacity duration-200',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <h4 className="font-display text-sm font-semibold text-white leading-tight mb-0.5 line-clamp-2">
            {book.title}
          </h4>
          <p className="text-xs text-white/70 mb-3 truncate">
            by {authorName}
          </p>
          <Button
            size="sm"
            className={cn(
              'w-full transition-all',
              isAdded
                ? 'bg-green-600 hover:bg-green-600'
                : 'bg-primary hover:bg-primary/90'
            )}
            onClick={handleAddToShelf}
            disabled={isAdding || isAdded}
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isAdded ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Added
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Add to Shelf
              </>
            )}
          </Button>
        </div>
      </div>
      <h3 className="font-display text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
        {book.title}
      </h3>
      <p className="text-xs text-muted-foreground truncate">{authorName}</p>
      {book.year && (
        <p className="text-xs text-muted-foreground/60">{book.year}</p>
      )}
    </Link>
  )
}
