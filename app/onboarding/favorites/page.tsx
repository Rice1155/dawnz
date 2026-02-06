'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Search, X, Heart, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// Mock search results - in production, this would call the Open Library API
const mockBooks = [
  {
    id: '1',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    cover: 'https://covers.openlibrary.org/b/isbn/9780743273565-M.jpg',
  },
  {
    id: '2',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    cover: 'https://covers.openlibrary.org/b/isbn/9780061120084-M.jpg',
  },
  {
    id: '3',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    cover: 'https://covers.openlibrary.org/b/isbn/9780141439518-M.jpg',
  },
  {
    id: '4',
    title: 'The Midnight Library',
    author: 'Matt Haig',
    cover: 'https://covers.openlibrary.org/b/isbn/9780525559474-M.jpg',
  },
  {
    id: '5',
    title: 'Atomic Habits',
    author: 'James Clear',
    cover: 'https://covers.openlibrary.org/b/isbn/9780735211292-M.jpg',
  },
]

type Book = typeof mockBooks[0]

export default function FavoritesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Book[]>([])
  const [selectedBooks, setSelectedBooks] = useState<Book[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))

    // Filter mock books (in production, call Open Library API)
    const results = mockBooks.filter(
      book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setSearchResults(results.length > 0 ? results : mockBooks.slice(0, 3))
    setIsSearching(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  const addBook = (book: Book) => {
    if (!selectedBooks.find(b => b.id === book.id) && selectedBooks.length < 5) {
      setSelectedBooks([...selectedBooks, book])
    }
  }

  const removeBook = (bookId: string) => {
    setSelectedBooks(selectedBooks.filter(b => b.id !== bookId))
  }

  const handleContinue = async () => {
    setIsLoading(true)
    // TODO: Save to Supabase
    await new Promise(resolve => setTimeout(resolve, 500))
    router.push('/onboarding/invite')
  }

  const handleSkip = () => {
    router.push('/onboarding/invite')
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
          <Heart className="h-4 w-4" />
          <span className="text-sm font-medium">Share your favorites</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
          What are your favorite books?
        </h1>

        <p className="text-muted-foreground max-w-md mx-auto">
          Add up to 5 books you love. This helps us understand your taste and
          connect you with like-minded readers.
        </p>
      </div>

      {/* Selected books */}
      {selectedBooks.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Your favorites ({selectedBooks.length}/5):
          </p>
          <div className="flex flex-wrap gap-3">
            {selectedBooks.map((book) => (
              <div
                key={book.id}
                className="flex items-center gap-3 p-2 pr-3 rounded-lg bg-card border border-border group"
              >
                <div className="w-10 h-14 rounded overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate max-w-[150px]">
                    {book.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {book.author}
                  </p>
                </div>
                <button
                  onClick={() => removeBook(book.id)}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for a book or author..."
            className="h-14 text-lg bg-card border-border focus:border-primary pl-12 pr-24"
          />
          <Button
            type="button"
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </Button>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="space-y-2 p-4 rounded-lg bg-card border border-border max-h-[300px] overflow-y-auto">
            {searchResults.map((book) => {
              const isSelected = selectedBooks.find(b => b.id === book.id)

              return (
                <button
                  key={book.id}
                  onClick={() => !isSelected && addBook(book)}
                  disabled={!!isSelected || selectedBooks.length >= 5}
                  className={cn(
                    'w-full flex items-center gap-4 p-3 rounded-lg transition-all duration-200 text-left',
                    isSelected
                      ? 'bg-primary/10 cursor-default'
                      : selectedBooks.length >= 5
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-secondary/50 cursor-pointer'
                  )}
                >
                  <div className="w-12 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{book.title}</p>
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                  </div>
                  {isSelected ? (
                    <span className="text-primary text-sm">Added</span>
                  ) : selectedBooks.length < 5 ? (
                    <span className="text-primary text-sm">+ Add</span>
                  ) : null}
                </button>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {searchResults.length === 0 && !isSearching && (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Search for books to add to your favorites</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Button
          variant="ghost"
          onClick={handleSkip}
          className="text-muted-foreground hover:text-foreground"
        >
          Skip for now
        </Button>

        <Button
          onClick={handleContinue}
          disabled={isLoading}
          size="lg"
          className="min-w-[200px] h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-body"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
