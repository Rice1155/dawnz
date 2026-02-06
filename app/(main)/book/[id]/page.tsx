'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  BookOpen,
  Star,
  Clock,
  Calendar,
  BookMarked,
  Heart,
  Share2,
  ChevronRight,
  Users,
  MessageSquareQuote,
  Play,
  Check,
  Loader2,
  AlertCircle,
  XCircle,
  Zap,
  PenLine,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuth } from '@/components/providers/auth-provider'

type BookStatus = 'want_to_read' | 'reading' | 'finished' | 'dnf'

type Book = {
  id: string
  open_library_key: string | null
  title: string
  authors: string[]
  description: string | null
  cover_small: string | null
  cover_medium: string | null
  cover_large: string | null
  published_date: string | null
  publisher: string | null
  page_count: number | null
  chapter_count: number | null
  genres: string[]
  subjects: string[]
  isbn13: string | null
  isbn10: string | null
  language: string
}

type UserBook = {
  id: string
  status: BookStatus
  current_page: number
  rating: number | null
  review: string | null
}

type Spark = {
  id: string
  content: string
  quote: string | null
  emoji: string | null
  chapter_number: number | null
  created_at: string
}

type Reflection = {
  id: string
  content: string
  quote: string | null
  emoji: string | null
  tags: string[]
  created_at: string
}

const shelfOptions: { id: BookStatus; label: string; icon: typeof BookMarked }[] = [
  { id: 'want_to_read', label: 'Want to Read', icon: BookMarked },
  { id: 'reading', label: 'Currently Reading', icon: BookOpen },
  { id: 'finished', label: 'Finished', icon: Check },
  { id: 'dnf', label: 'Did Not Finish', icon: XCircle },
]

export default function BookDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()

  const [book, setBook] = useState<Book | null>(null)
  const [userBook, setUserBook] = useState<UserBook | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddingToShelf, setIsAddingToShelf] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [isSavingRating, setIsSavingRating] = useState(false)
  const [bookSparks, setBookSparks] = useState<Spark[]>([])
  const [bookReflections, setBookReflections] = useState<Reflection[]>([])

  const bookId = params.id as string

  useEffect(() => {
    fetchBook()
  }, [bookId])

  useEffect(() => {
    if (userBook?.rating) {
      setUserRating(userBook.rating)
    }
  }, [userBook])

  const fetchBook = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Determine if this is a UUID (database ID) or Open Library key
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookId)
      const isOpenLibraryKey = bookId.startsWith('%2Fworks%2F') || bookId.startsWith('/works/')

      let url: string
      if (isUUID) {
        url = `/api/books?id=${bookId}`
      } else {
        // Decode the Open Library key if it's URL encoded
        const decodedKey = decodeURIComponent(bookId)
        url = `/api/books?openLibraryKey=${encodeURIComponent(decodedKey)}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        if (response.status === 404) {
          setError('Book not found')
        } else {
          throw new Error('Failed to fetch book')
        }
        return
      }

      const data = await response.json()
      setBook(data.book)

      // If user is logged in, check if they have this book and fetch their sparks/reflections
      if (user && data.book?.id) {
        fetchUserBook(data.book.id)
        fetchBookSparksAndReflections(data.book.id)
      }
    } catch (err) {
      console.error('Error fetching book:', err)
      setError('Failed to load book details')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBookSparksAndReflections = async (bookId: string) => {
    try {
      const [sparksRes, reflectionsRes] = await Promise.all([
        fetch(`/api/sparks?bookId=${bookId}&limit=5`),
        fetch(`/api/user-reflections?bookId=${bookId}&limit=5`),
      ])

      if (sparksRes.ok) {
        const data = await sparksRes.json()
        setBookSparks(data.sparks || [])
      }

      if (reflectionsRes.ok) {
        const data = await reflectionsRes.json()
        setBookReflections(data.reflections || [])
      }
    } catch (err) {
      console.error('Error fetching sparks/reflections:', err)
    }
  }

  const fetchUserBook = async (bookId: string) => {
    try {
      const response = await fetch('/api/books/library')
      if (response.ok) {
        const data = await response.json()
        const found = data.userBooks?.find((ub: any) => ub.book_id === bookId)
        if (found) {
          setUserBook({
            id: found.id,
            status: found.status,
            current_page: found.current_page,
            rating: found.rating,
            review: found.review,
          })
        }
      }
    } catch (err) {
      console.error('Error fetching user book:', err)
    }
  }

  const handleAddToShelf = async (status: BookStatus) => {
    if (!user) {
      toast.error('Please sign in to add books to your shelf')
      router.push('/login')
      return
    }

    setIsAddingToShelf(true)

    try {
      if (userBook) {
        // Update existing
        const response = await fetch('/api/books/library', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userBookId: userBook.id,
            status,
          }),
        })

        if (!response.ok) throw new Error('Failed to update')

        setUserBook({ ...userBook, status })
        toast.success('Book updated')
      } else {
        // Add new
        const openLibraryKey = book?.open_library_key || (bookId.includes('works') ? decodeURIComponent(bookId) : null)

        const response = await fetch('/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            openLibraryKey,
            addToLibrary: true,
            status,
          }),
        })

        if (!response.ok) throw new Error('Failed to add')

        const data = await response.json()
        if (data.book) setBook(data.book)
        if (data.userBook) {
          setUserBook({
            id: data.userBook.id,
            status: data.userBook.status,
            current_page: data.userBook.current_page,
            rating: data.userBook.rating,
            review: data.userBook.review,
          })
        }
        toast.success(`Added to ${shelfOptions.find(s => s.id === status)?.label}`)
      }
    } catch (err) {
      console.error('Error:', err)
      toast.error('Failed to update shelf')
    } finally {
      setIsAddingToShelf(false)
    }
  }

  const handleRating = async (rating: number) => {
    if (!user) {
      toast.error('Please sign in to rate books')
      router.push('/login')
      return
    }

    setUserRating(rating)
    setIsSavingRating(true)

    try {
      if (!userBook) {
        // Add to shelf first as 'finished', then save rating
        const openLibraryKey = book?.open_library_key || (bookId.includes('works') ? decodeURIComponent(bookId) : null)

        const response = await fetch('/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            openLibraryKey,
            addToLibrary: true,
            status: 'finished',
            rating,
          }),
        })

        if (!response.ok) throw new Error('Failed to add book')

        const data = await response.json()
        if (data.book) setBook(data.book)
        if (data.userBook) {
          setUserBook({
            id: data.userBook.id,
            status: data.userBook.status,
            current_page: data.userBook.current_page,
            rating: rating,
            review: data.userBook.review,
          })
        }
        toast.success('Rating saved')
      } else {
        // Update existing rating
        const response = await fetch('/api/books/library', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userBookId: userBook.id,
            rating,
          }),
        })

        if (!response.ok) throw new Error('Failed to save rating')

        setUserBook({ ...userBook, rating })
        toast.success('Rating saved')
      }
    } catch (err) {
      console.error('Error saving rating:', err)
      toast.error('Failed to save rating')
      setUserRating(userBook?.rating || 0)
    } finally {
      setIsSavingRating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
        <h2 className="font-display text-2xl font-bold mb-2">{error || 'Book not found'}</h2>
        <p className="text-muted-foreground mb-6">We couldn't find this book.</p>
        <Button asChild>
          <Link href="/browse">Browse Books</Link>
        </Button>
      </div>
    )
  }

  const coverUrl = book.cover_large || book.cover_medium || book.cover_small
  const authorNames = book.authors?.join(', ') || 'Unknown Author'

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/browse" className="hover:text-foreground transition-colors">
          Browse
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground truncate max-w-[200px]">{book.title}</span>
      </nav>

      {/* Main Content */}
      <div className="grid lg:grid-cols-[300px_1fr] gap-8 lg:gap-12">
        {/* Left Column - Cover and Actions */}
        <div className="space-y-6">
          {/* Book Cover */}
          <div className="relative mx-auto lg:mx-0 max-w-[300px]">
            <div className="absolute inset-0 bg-black/30 rounded-lg transform translate-x-3 translate-y-3 blur-lg" />
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden book-shadow bg-muted">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary">
                  <BookOpen className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
            </div>
          </div>

          {/* Add to Shelf */}
          <div className="space-y-2">
            {shelfOptions.map((shelf) => {
              const Icon = shelf.icon
              const isSelected = userBook?.status === shelf.id

              return (
                <button
                  key={shelf.id}
                  onClick={() => handleAddToShelf(shelf.id)}
                  disabled={isAddingToShelf}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg font-body transition-all duration-200 cursor-pointer disabled:opacity-50',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border hover:border-primary/30'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{shelf.label}</span>
                  {isSelected && <Check className="h-4 w-4 ml-auto" />}
                </button>
              )
            })}
          </div>

          {/* Start Reading Button */}
          {userBook && (
            <Button
              asChild
              size="lg"
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Link href={`/book/${book.id}/read`}>
                <Play className="mr-2 h-5 w-5" />
                {userBook.status === 'reading' ? 'Continue Reading' : 'Start Reading'}
              </Link>
            </Button>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-8">
          {/* Title and Author */}
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
              {book.title}
            </h1>
            <p className="text-xl text-muted-foreground">
              by <span className="text-primary">{authorNames}</span>
            </p>
          </div>

          {/* Your Rating */}
          {user && (
            <div className="p-4 rounded-lg bg-card border border-border">
              <p className="text-sm text-muted-foreground mb-2">
                {userRating > 0 ? 'Your Rating' : 'Rate this book'}
              </p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => handleRating(star)}
                    disabled={isSavingRating}
                    className="p-1 transition-transform hover:scale-110 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Star
                      className={cn(
                        'h-7 w-7 transition-colors',
                        star <= (hoverRating || userRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-muted-foreground/30'
                      )}
                    />
                  </button>
                ))}
                {userRating > 0 && (
                  <button
                    onClick={() => handleRating(0)}
                    disabled={isSavingRating}
                    className="ml-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                {isSavingRating && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              </div>
            </div>
          )}

          {/* Book Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {book.page_count && (
              <div className="p-4 rounded-lg bg-card border border-border text-center">
                <BookOpen className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-lg font-semibold">{book.page_count}</p>
                <p className="text-xs text-muted-foreground">Pages</p>
              </div>
            )}
            {book.chapter_count && (
              <div className="p-4 rounded-lg bg-card border border-border text-center">
                <Clock className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-lg font-semibold">{book.chapter_count}</p>
                <p className="text-xs text-muted-foreground">Chapters</p>
              </div>
            )}
            {book.published_date && (
              <div className="p-4 rounded-lg bg-card border border-border text-center">
                <Calendar className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-lg font-semibold">
                  {book.published_date.length === 4
                    ? book.published_date
                    : new Date(book.published_date).getFullYear() || book.published_date}
                </p>
                <p className="text-xs text-muted-foreground">Published</p>
              </div>
            )}
            {book.language && (
              <div className="p-4 rounded-lg bg-card border border-border text-center">
                <MessageSquareQuote className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-lg font-semibold uppercase">{book.language}</p>
                <p className="text-xs text-muted-foreground">Language</p>
              </div>
            )}
          </div>

          {/* Genres */}
          {book.genres && book.genres.length > 0 && (
            <div>
              <h3 className="font-display text-lg font-semibold mb-3">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {[...new Set(book.genres)].map((genre, index) => (
                  <Link
                    key={`${genre}-${index}`}
                    href={`/browse?genre=${encodeURIComponent(genre.toLowerCase())}`}
                    className="px-3 py-1.5 rounded-full bg-secondary text-sm text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    {genre}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {book.description && (
            <div>
              <h3 className="font-display text-lg font-semibold mb-3">About this book</h3>
              <div className="prose prose-sm text-muted-foreground max-w-none">
                {book.description.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 last:mb-0 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Your Sparks & Reflections */}
          {user && (bookSparks.length > 0 || bookReflections.length > 0) && (
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Your Thoughts
                </h3>
                <Link
                  href="/sparks"
                  className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  View all <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Sparks */}
              {bookSparks.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Sparks ({bookSparks.length})
                  </h4>
                  <div className="space-y-2">
                    {bookSparks.slice(0, 3).map((spark) => (
                      <div key={spark.id} className="p-3 rounded-lg bg-secondary/30">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <span>{new Date(spark.created_at).toLocaleDateString()}</span>
                          {spark.chapter_number && <span>· Ch. {spark.chapter_number}</span>}
                          {spark.emoji && <span className="ml-auto">{spark.emoji}</span>}
                        </div>
                        <p className="text-sm">{spark.content}</p>
                        {spark.quote && (
                          <p className="text-xs text-muted-foreground italic mt-1 pl-2 border-l-2 border-primary/30">
                            "{spark.quote}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reflections */}
              {bookReflections.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <PenLine className="h-3 w-3" />
                    Reflections ({bookReflections.length})
                  </h4>
                  <div className="space-y-2">
                    {bookReflections.slice(0, 2).map((reflection) => (
                      <div key={reflection.id} className="p-3 rounded-lg bg-secondary/30">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <span>{new Date(reflection.created_at).toLocaleDateString()}</span>
                          {reflection.emoji && <span className="ml-auto">{reflection.emoji}</span>}
                        </div>
                        <p className="text-sm line-clamp-3">{reflection.content}</p>
                        {reflection.tags && reflection.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {reflection.tags.map((tag) => (
                              <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Write new */}
              <div className="mt-4 pt-4 border-t border-border">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/sparks">
                    <Plus className="h-4 w-4 mr-2" />
                    Write a new spark or reflection
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Subjects */}
          {book.subjects && book.subjects.length > 0 && (
            <div>
              <h3 className="font-display text-lg font-semibold mb-3">Subjects</h3>
              <div className="flex flex-wrap gap-2">
                {[...new Set(book.subjects)].slice(0, 10).map((subject, index) => (
                  <span
                    key={`${subject}-${index}`}
                    className="px-3 py-1.5 rounded-full bg-card border border-border text-sm text-muted-foreground"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Book Details */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-display text-lg font-semibold mb-4">Book Details</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {book.page_count && (
                <div>
                  <dt className="text-muted-foreground">Pages</dt>
                  <dd className="font-medium">{book.page_count.toLocaleString()}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">Language</dt>
                <dd className="font-medium">English</dd>
              </div>
              {book.published_date && (
                <div>
                  <dt className="text-muted-foreground">First Published</dt>
                  <dd className="font-medium">{book.published_date}</dd>
                </div>
              )}
              {book.publisher && (
                <div>
                  <dt className="text-muted-foreground">Publisher</dt>
                  <dd className="font-medium">{book.publisher}</dd>
                </div>
              )}
              {book.isbn13 && (
                <div>
                  <dt className="text-muted-foreground">ISBN-13</dt>
                  <dd className="font-medium font-mono text-xs">{book.isbn13}</dd>
                </div>
              )}
              {book.isbn10 && (
                <div>
                  <dt className="text-muted-foreground">ISBN-10</dt>
                  <dd className="font-medium font-mono text-xs">{book.isbn10}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
