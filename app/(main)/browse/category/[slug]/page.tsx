'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Loader2,
  ArrowLeft,
  Plus,
  Check,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type SortOption = 'editions' | 'old' | 'new' | 'rating'

type Book = {
  key: string
  title: string
  authors: string[]
  year: number | null
  coverUrl: string | null
  coverUrls?: string[]
  editionCount: number
}

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [categoryName, setCategoryName] = useState('')
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [sort, setSort] = useState<SortOption>('editions')
  const limit = 40

  useEffect(() => {
    fetchBooks()
  }, [slug, sort, offset])

  const fetchBooks = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/books/category?category=${slug}&limit=${limit}&offset=${offset}&sort=${sort}`
      )
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setBooks(data.books || [])
      setCategoryName(data.categoryName || slug.replace(/_/g, ' '))
      setTotal(data.total || 0)
      setHasMore(data.hasMore || false)
    } catch (error) {
      console.error('Error fetching category books:', error)
      toast.error('Failed to load books')
    } finally {
      setIsLoading(false)
    }
  }

  const sortOptions: { id: SortOption; label: string }[] = [
    { id: 'editions', label: 'Most Popular' },
    { id: 'new', label: 'Newest First' },
    { id: 'old', label: 'Oldest First' },
    { id: 'rating', label: 'Highest Rated' },
  ]

  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort)
    setOffset(0)
  }

  const handleNextPage = () => {
    if (hasMore) {
      setOffset(offset + limit)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - limit))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/browse"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Browse
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2 capitalize">
          {categoryName || slug.replace(/_/g, ' ')}
        </h1>
        <p className="text-muted-foreground">
          {total > 0
            ? `Explore ${total.toLocaleString()} books in this category`
            : 'Loading books...'}
        </p>
      </div>

      {/* Sort controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap gap-2">
          {sortOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSortChange(option.id)}
              className={cn(
                'px-4 py-2 rounded-lg font-body text-sm transition-all duration-200 border cursor-pointer',
                sort === option.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {total > 0 && (
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}-{Math.min(offset + limit, total)} of{' '}
            {total.toLocaleString()}
          </p>
        )}
      </div>

      {/* Books grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : books.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {books.map((book) => (
              <BookCard key={book.key} book={book} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <Button
                variant="outline"
                onClick={handlePrevPage}
                disabled={offset === 0}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={!hasMore}
                className="gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">No books found in this category</p>
        </div>
      )}
    </div>
  )
}

function BookCard({ book }: { book: Book }) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isAdded, setIsAdded] = useState(false)
  const [coverIndex, setCoverIndex] = useState(0)
  const [coverFailed, setCoverFailed] = useState(false)

  const coverUrls = [book.coverUrl, ...(book.coverUrls || [])].filter(Boolean) as string[]
  const currentCoverUrl = coverUrls[coverIndex]
  const authorName = book.authors?.join(', ') || 'Unknown Author'
  const bookUrl = `/book/${encodeURIComponent(book.key)}`

  const handleCoverError = () => {
    if (coverIndex < coverUrls.length - 1) {
      setCoverIndex(coverIndex + 1)
    } else {
      setCoverFailed(true)
    }
  }

  const handleCoverLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
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

        {/* Hover overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30 flex flex-col justify-end p-3 transition-opacity duration-200',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <h4 className="font-display text-sm font-semibold text-white leading-tight mb-0.5 line-clamp-2">
            {book.title}
          </h4>
          <p className="text-xs text-white/70 mb-3 truncate">by {authorName}</p>
          <Button
            size="sm"
            className={cn(
              'w-full transition-all',
              isAdded ? 'bg-green-600 hover:bg-green-600' : 'bg-primary hover:bg-primary/90'
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
      {book.year && <p className="text-xs text-muted-foreground/60">{book.year}</p>}
    </Link>
  )
}
