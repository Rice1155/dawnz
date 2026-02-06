'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  BookOpen,
  Loader2,
  ArrowLeft,
  Plus,
  Check,
  Calendar,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type TrendingPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

type Book = {
  key: string
  title: string
  authors: string[]
  year: number | null
  coverUrl: string | null
  coverUrls?: string[]
  editionCount: number
}

export default function TrendingPage() {
  const router = useRouter()
  const [period, setPeriod] = useState<TrendingPeriod>('daily')
  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTrending()
  }, [period])

  const fetchTrending = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/books/trending?period=${period}&limit=50`)
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setBooks(data.books || [])
    } catch (error) {
      console.error('Error fetching trending:', error)
      toast.error('Failed to load trending books')
    } finally {
      setIsLoading(false)
    }
  }

  const periods: { id: TrendingPeriod; label: string; icon: typeof Clock }[] = [
    { id: 'daily', label: 'Today', icon: Clock },
    { id: 'weekly', label: 'This Week', icon: Calendar },
    { id: 'monthly', label: 'This Month', icon: Calendar },
    { id: 'yearly', label: 'This Year', icon: Calendar },
  ]

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
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-primary" />
          Trending Books
        </h1>
        <p className="text-muted-foreground">
          Discover what readers are excited about right now
        </p>
      </div>

      {/* Period filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={cn(
              'px-4 py-2 rounded-lg font-body text-sm transition-all duration-200 border cursor-pointer',
              period === p.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Books grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {books.map((book, index) => (
            <BookCard key={book.key} book={book} rank={index + 1} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">No trending books found</p>
        </div>
      )}
    </div>
  )
}

function BookCard({ book, rank }: { book: Book; rank: number }) {
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
        {/* Rank badge */}
        <div className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
          {rank}
        </div>

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
