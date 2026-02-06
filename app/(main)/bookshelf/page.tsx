'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  BookMarked,
  CheckCircle2,
  Clock,
  Grid3X3,
  List,
  Search,
  Plus,
  Star,
  MoreVertical,
  Loader2,
  PlayCircle,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuth } from '@/components/providers/auth-provider'

type BookStatus = 'reading' | 'want_to_read' | 'finished'
type ViewType = 'grid' | 'list'

type UserBook = {
  id: string
  user_id: string
  book_id: string
  status: BookStatus
  current_page: number
  current_chapter: number
  rating: number | null
  review: string | null
  started_at: string | null
  finished_at: string | null
  created_at: string
  updated_at: string
  book: {
    id: string
    title: string
    authors: string[]
    cover_small: string | null
    cover_medium: string | null
    page_count: number | null
    genres: string[]
  }
}

const shelfConfig = {
  reading: {
    name: 'Currently Reading',
    icon: BookOpen,
    emptyMessage: 'No books in progress. Start reading something!',
  },
  want_to_read: {
    name: 'Want to Read',
    icon: BookMarked,
    emptyMessage: 'Your reading list is empty. Browse for books to add!',
  },
  finished: {
    name: 'Finished',
    icon: CheckCircle2,
    emptyMessage: 'No finished books yet. Keep reading!',
  },
}

export default function BookshelfPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [activeShelf, setActiveShelf] = useState<BookStatus>('reading')
  const [viewType, setViewType] = useState<ViewType>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [userBooks, setUserBooks] = useState<UserBook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchBooks()
    } else if (!authLoading) {
      setIsLoading(false)
    }
  }, [user, authLoading])

  const fetchBooks = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/books/library')
      if (!response.ok) {
        throw new Error('Failed to fetch books')
      }
      const data = await response.json()
      setUserBooks(data.userBooks || [])
    } catch (error) {
      console.error('Error fetching books:', error)
      toast.error('Failed to load your books')
    } finally {
      setIsLoading(false)
    }
  }

  const updateBookStatus = async (userBookId: string, newStatus: BookStatus) => {
    try {
      const response = await fetch('/api/books/library', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userBookId, status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update book')
      }

      setUserBooks(prev =>
        prev.map(ub =>
          ub.id === userBookId ? { ...ub, status: newStatus } : ub
        )
      )
      toast.success('Book updated')
      setActionMenuOpen(null)
    } catch (error) {
      console.error('Error updating book:', error)
      toast.error('Failed to update book')
    }
  }

  const removeBook = async (userBookId: string) => {
    try {
      const response = await fetch(`/api/books/library?userBookId=${userBookId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove book')
      }

      setUserBooks(prev => prev.filter(ub => ub.id !== userBookId))
      toast.success('Book removed from library')
      setActionMenuOpen(null)
    } catch (error) {
      console.error('Error removing book:', error)
      toast.error('Failed to remove book')
    }
  }

  // Filter books by shelf and search query
  const shelfBooks = userBooks.filter(ub => ub.status === activeShelf)
  const filteredBooks = shelfBooks.filter(ub =>
    ub.book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ub.book.authors.join(', ').toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get books for quick view sections
  const readingBooks = userBooks.filter(ub => ub.status === 'reading')
  const wantToReadBooks = userBooks.filter(ub => ub.status === 'want_to_read')
  const finishedBooks = userBooks.filter(ub => ub.status === 'finished')

  // Count books per shelf
  const shelfCounts = {
    reading: readingBooks.length,
    want_to_read: wantToReadBooks.length,
    finished: finishedBooks.length,
  }

  const totalBooks = userBooks.length

  const getProgress = (userBook: UserBook) => {
    if (!userBook.book.page_count || userBook.book.page_count === 0) return 0
    return Math.round((userBook.current_page / userBook.book.page_count) * 100)
  }

  if (!user && !authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <BookMarked className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
        <h2 className="font-display text-2xl font-bold mb-2">Sign in to see your bookshelf</h2>
        <p className="text-muted-foreground mb-6">Track your reading progress and build your library.</p>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
            My Bookshelf
          </h1>
          <p className="text-muted-foreground">
            {totalBooks} {totalBooks === 1 ? 'book' : 'books'} in your library
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/browse">
            <Plus className="mr-2 h-4 w-4" />
            Add Book
          </Link>
        </Button>
      </div>

      {/* Shelf Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(shelfConfig) as BookStatus[]).map((shelfKey) => {
          const shelf = shelfConfig[shelfKey]
          const Icon = shelf.icon
          const isActive = activeShelf === shelfKey
          const count = shelfCounts[shelfKey]

          return (
            <button
              key={shelfKey}
              onClick={() => setActiveShelf(shelfKey)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-body text-sm transition-all duration-200 cursor-pointer',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{shelf.name}</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs',
                  isActive ? 'bg-primary-foreground/20' : 'bg-secondary'
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your books..."
            className="pl-10 bg-card border-border"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className={cn(
              'border-border',
              viewType === 'grid' && 'bg-secondary'
            )}
            onClick={() => setViewType('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              'border-border',
              viewType === 'list' && 'bg-secondary'
            )}
            onClick={() => setViewType('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick View - Connected Sections with Small Covers */}
      {!isLoading && userBooks.length > 0 && (
        <div className="mb-8 bg-card border border-border rounded-xl overflow-hidden">
          {/* Currently Reading Section */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Currently Reading</h3>
              <span className="text-xs text-muted-foreground">({readingBooks.length})</span>
            </div>
            {readingBooks.length > 0 ? (
              <div className="space-y-2">
                {readingBooks.map(ub => (
                  <Link
                    key={ub.id}
                    href={`/book/${ub.book.id}`}
                    className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors group"
                  >
                    <div className="w-8 h-12 rounded overflow-hidden flex-shrink-0 bg-muted">
                      {ub.book.cover_small || ub.book.cover_medium ? (
                        <img
                          src={ub.book.cover_small || ub.book.cover_medium || ''}
                          alt={ub.book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary">
                          <BookOpen className="h-4 w-4 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block group-hover:text-primary transition-colors">
                        {ub.book.title}
                      </span>
                      <span className="text-xs text-muted-foreground truncate block">
                        {ub.book.authors.join(', ')}
                      </span>
                    </div>
                    {ub.book.page_count && ub.current_page > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {getProgress(ub)}%
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No books currently being read</p>
            )}
          </div>

          {/* Want to Read Section */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <BookMarked className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Want to Read</h3>
              <span className="text-xs text-muted-foreground">({wantToReadBooks.length})</span>
            </div>
            {wantToReadBooks.length > 0 ? (
              <div className="space-y-2">
                {wantToReadBooks.map(ub => (
                  <Link
                    key={ub.id}
                    href={`/book/${ub.book.id}`}
                    className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors group"
                  >
                    <div className="w-8 h-12 rounded overflow-hidden flex-shrink-0 bg-muted">
                      {ub.book.cover_small || ub.book.cover_medium ? (
                        <img
                          src={ub.book.cover_small || ub.book.cover_medium || ''}
                          alt={ub.book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary">
                          <BookOpen className="h-4 w-4 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block group-hover:text-primary transition-colors">
                        {ub.book.title}
                      </span>
                      <span className="text-xs text-muted-foreground truncate block">
                        {ub.book.authors.join(', ')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No books in your reading list</p>
            )}
          </div>

          {/* Finished Section */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Finished</h3>
              <span className="text-xs text-muted-foreground">({finishedBooks.length})</span>
            </div>
            {finishedBooks.length > 0 ? (
              <div className="space-y-2">
                {finishedBooks.map(ub => (
                  <Link
                    key={ub.id}
                    href={`/book/${ub.book.id}`}
                    className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors group"
                  >
                    <div className="w-8 h-12 rounded overflow-hidden flex-shrink-0 bg-muted">
                      {ub.book.cover_small || ub.book.cover_medium ? (
                        <img
                          src={ub.book.cover_small || ub.book.cover_medium || ''}
                          alt={ub.book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary">
                          <BookOpen className="h-4 w-4 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block group-hover:text-primary transition-colors">
                        {ub.book.title}
                      </span>
                      <span className="text-xs text-muted-foreground truncate block">
                        {ub.book.authors.join(', ')}
                      </span>
                    </div>
                    {ub.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-muted-foreground">{ub.rating}</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No finished books yet</p>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredBooks.length > 0 ? (
        viewType === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {filteredBooks.map((userBook) => {
              const progress = getProgress(userBook)
              return (
                <div key={userBook.id} className="group relative">
                  <Link href={`/book/${userBook.book.id}`}>
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-3 book-shadow bg-muted">
                      {userBook.book.cover_medium ? (
                        <img
                          src={userBook.book.cover_medium}
                          alt={userBook.book.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary">
                          <BookOpen className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                      {userBook.status === 'reading' && progress > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                          <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-white text-xs mt-1">{progress}% complete</p>
                        </div>
                      )}
                      {userBook.rating && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/60 rounded-full">
                          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-white text-xs">{userBook.rating}</span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-display text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {userBook.book.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {userBook.book.authors.join(', ')}
                    </p>
                  </Link>

                  {/* Action Menu */}
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        setActionMenuOpen(actionMenuOpen === userBook.id ? null : userBook.id)
                      }}
                      className="p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 cursor-pointer"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {actionMenuOpen === userBook.id && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-10">
                        {userBook.status !== 'reading' && (
                          <button
                            onClick={() => updateBookStatus(userBook.id, 'reading')}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 cursor-pointer"
                          >
                            <PlayCircle className="h-4 w-4" />
                            Start Reading
                          </button>
                        )}
                        {userBook.status !== 'want_to_read' && (
                          <button
                            onClick={() => updateBookStatus(userBook.id, 'want_to_read')}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 cursor-pointer"
                          >
                            <BookMarked className="h-4 w-4" />
                            Want to Read
                          </button>
                        )}
                        {userBook.status !== 'finished' && (
                          <button
                            onClick={() => updateBookStatus(userBook.id, 'finished')}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 cursor-pointer"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Mark Finished
                          </button>
                        )}
                        <hr className="my-1 border-border" />
                        <button
                          onClick={() => removeBook(userBook.id)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBooks.map((userBook) => {
              const progress = getProgress(userBook)
              return (
                <div
                  key={userBook.id}
                  className="group flex gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300"
                >
                  <Link href={`/book/${userBook.book.id}`} className="flex gap-4 flex-1">
                    <div className="relative w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 book-shadow bg-muted">
                      {userBook.book.cover_medium ? (
                        <img
                          src={userBook.book.cover_medium}
                          alt={userBook.book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary">
                          <BookOpen className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                        {userBook.book.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {userBook.book.authors.join(', ')}
                      </p>

                      <div className="mt-3">
                        {userBook.status === 'reading' && progress > 0 ? (
                          <div className="space-y-1">
                            <div className="h-2 bg-secondary rounded-full overflow-hidden max-w-[200px]">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {userBook.current_page} of {userBook.book.page_count} pages ({progress}%)
                            </p>
                          </div>
                        ) : userBook.rating ? (
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  'h-4 w-4',
                                  i < userBook.rating!
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-muted-foreground/30'
                                )}
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Added {new Date(userBook.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>

                  <div className="relative">
                    <button
                      onClick={() => setActionMenuOpen(actionMenuOpen === userBook.id ? null : userBook.id)}
                      className="p-1 text-muted-foreground hover:text-foreground rounded cursor-pointer"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {actionMenuOpen === userBook.id && (
                      <div className="absolute top-full right-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-10">
                        {userBook.status !== 'reading' && (
                          <button
                            onClick={() => updateBookStatus(userBook.id, 'reading')}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 cursor-pointer"
                          >
                            <PlayCircle className="h-4 w-4" />
                            Start Reading
                          </button>
                        )}
                        {userBook.status !== 'want_to_read' && (
                          <button
                            onClick={() => updateBookStatus(userBook.id, 'want_to_read')}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 cursor-pointer"
                          >
                            <BookMarked className="h-4 w-4" />
                            Want to Read
                          </button>
                        )}
                        {userBook.status !== 'finished' && (
                          <button
                            onClick={() => updateBookStatus(userBook.id, 'finished')}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 cursor-pointer"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Mark Finished
                          </button>
                        )}
                        <hr className="my-1 border-border" />
                        <button
                          onClick={() => removeBook(userBook.id)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        <div className="text-center py-16">
          <BookMarked className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-display text-xl font-semibold mb-2">
            {searchQuery ? 'No books found' : shelfConfig[activeShelf].emptyMessage}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {searchQuery
              ? 'Try a different search term'
              : 'Start building your library by adding books you want to read.'}
          </p>
          {!searchQuery && (
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/browse">
                <Plus className="mr-2 h-4 w-4" />
                Browse Books
              </Link>
            </Button>
          )}
        </div>
      )}

      {actionMenuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActionMenuOpen(null)}
        />
      )}
    </div>
  )
}
