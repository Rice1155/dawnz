'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  BookOpen,
  Zap,
  PenLine,
  Calendar,
  Library,
  Search,
  Plus,
  X,
  Loader2,
  ChevronDown,
  Quote,
  Smile,
  Tag,
  Share2,
  Trash2,
  MoreVertical,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuth } from '@/components/providers/auth-provider'

type TabType = 'sparks' | 'reflections'
type ViewType = 'date' | 'book'

type Book = {
  id: string
  title: string
  authors: string[]
  cover_small: string | null
  cover_medium: string | null
}

type Spark = {
  id: string
  content: string
  quote: string | null
  emoji: string | null
  chapter_number: number | null
  is_public: boolean
  share_token: string | null
  created_at: string
  book: Book | null
}

type Reflection = {
  id: string
  content: string
  quote: string | null
  emoji: string | null
  tags: string[]
  is_public: boolean
  share_token: string | null
  created_at: string
  book: Book | null
}

type Prompt = {
  id?: string
  prompt: string
  type: string
}

// Common emoji options for quick selection
const emojiOptions = ['🔥', '😢', '🤯', '😴', '❤️', '😂', '🤔', '✨', '👀', '💡']

// Common tag options for reflections
const tagOptions = [
  'come back to',
  'favorite moment',
  'theme',
  'character insight',
  'plot twist',
  'beautiful prose',
  'life lesson',
  'quote worthy',
]

export default function SparksPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('sparks')
  const [viewType, setViewType] = useState<ViewType>('date')

  // Data states
  const [sparks, setSparks] = useState<Spark[]>([])
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [userBooks, setUserBooks] = useState<Book[]>([])
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Write form states
  const [isWriting, setIsWriting] = useState(false)
  const [content, setContent] = useState('')
  const [quote, setQuote] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [chapterNumber, setChapterNumber] = useState<number | null>(null)
  const [showBookPicker, setShowBookPicker] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Action menu state
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchData()
    } else if (!authLoading) {
      setIsLoading(false)
    }
  }, [user, authLoading])

  useEffect(() => {
    fetchPrompts()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch sparks, reflections, and user's books in parallel
      const [sparksRes, reflectionsRes, booksRes] = await Promise.all([
        fetch('/api/sparks?limit=50'),
        fetch('/api/user-reflections?limit=50'),
        fetch('/api/books/library'),
      ])

      if (sparksRes.ok) {
        const data = await sparksRes.json()
        setSparks(data.sparks || [])
      }

      if (reflectionsRes.ok) {
        const data = await reflectionsRes.json()
        setReflections(data.reflections || [])
      }

      if (booksRes.ok) {
        const data = await booksRes.json()
        const books = (data.userBooks || []).map((ub: any) => ub.book)
        setUserBooks(books)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPrompts = async () => {
    try {
      const res = await fetch('/api/prompts?random=true&limit=3')
      if (res.ok) {
        const data = await res.json()
        setPrompts(data.prompts || [])
      }
    } catch (error) {
      console.error('Error fetching prompts:', error)
    }
  }

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Please write something first')
      return
    }

    if (activeTab === 'sparks' && content.length > 200) {
      toast.error('Sparks must be 200 characters or less')
      return
    }

    setIsSaving(true)

    try {
      const endpoint = activeTab === 'sparks' ? '/api/sparks' : '/api/user-reflections'
      const body: any = {
        content: content.trim(),
        bookId: selectedBook?.id || null,
        quote: quote.trim() || null,
        emoji: selectedEmoji,
      }

      if (activeTab === 'sparks') {
        body.chapterNumber = chapterNumber
      } else {
        body.tags = selectedTags
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        throw new Error('Failed to save')
      }

      const data = await res.json()

      if (activeTab === 'sparks') {
        setSparks(prev => [data.spark, ...prev])
      } else {
        setReflections(prev => [data.reflection, ...prev])
      }

      // Reset form
      setContent('')
      setQuote('')
      setSelectedEmoji(null)
      setSelectedBook(null)
      setSelectedTags([])
      setChapterNumber(null)
      setIsWriting(false)

      toast.success(activeTab === 'sparks' ? 'Spark saved!' : 'Reflection saved!')
      fetchPrompts() // Get new prompts
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string, type: 'spark' | 'reflection') => {
    try {
      const endpoint = type === 'spark'
        ? `/api/sparks?sparkId=${id}`
        : `/api/user-reflections?reflectionId=${id}`

      const res = await fetch(endpoint, { method: 'DELETE' })

      if (!res.ok) throw new Error('Failed to delete')

      if (type === 'spark') {
        setSparks(prev => prev.filter(s => s.id !== id))
      } else {
        setReflections(prev => prev.filter(r => r.id !== id))
      }

      toast.success('Deleted successfully')
      setActionMenuOpen(null)
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const handleShare = async (id: string, type: 'spark' | 'reflection') => {
    try {
      const endpoint = type === 'spark' ? '/api/sparks' : '/api/user-reflections'
      const idField = type === 'spark' ? 'sparkId' : 'reflectionId'

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [idField]: id,
          isPublic: true,
          generateShareToken: true,
        }),
      })

      if (!res.ok) throw new Error('Failed to generate share link')

      const data = await res.json()
      const item = type === 'spark' ? data.spark : data.reflection

      // Update local state
      if (type === 'spark') {
        setSparks(prev => prev.map(s => s.id === id ? item : s))
      } else {
        setReflections(prev => prev.map(r => r.id === id ? item : r))
      }

      // Copy link to clipboard
      const shareUrl = `${window.location.origin}/share/${type}/${item.share_token}`
      await navigator.clipboard.writeText(shareUrl)

      toast.success('Share link copied to clipboard!')
      setActionMenuOpen(null)
    } catch (error) {
      toast.error('Failed to generate share link')
    }
  }

  // Group items by book for book view
  const groupByBook = <T extends { book: Book | null }>(items: T[]) => {
    const groups: { book: Book | null; items: T[] }[] = []
    const bookMap = new Map<string | null, T[]>()

    items.forEach(item => {
      const key = item.book?.id || null
      if (!bookMap.has(key)) {
        bookMap.set(key, [])
      }
      bookMap.get(key)!.push(item)
    })

    bookMap.forEach((items, bookId) => {
      groups.push({
        book: items[0].book,
        items,
      })
    })

    return groups
  }

  if (!user && !authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Zap className="h-16 w-16 mx-auto mb-4 text-primary/30" />
        <h2 className="font-display text-2xl font-bold mb-2">Sign in to capture your thoughts</h2>
        <p className="text-muted-foreground mb-6">Save sparks and reflections as you read.</p>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    )
  }

  const currentItems = activeTab === 'sparks' ? sparks : reflections
  const groupedItems = viewType === 'book' ? groupByBook(currentItems) : null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Zap className="h-8 w-8 text-primary" />
            Sparks
          </h1>
          <p className="text-muted-foreground">
            Capture your thoughts as you read
          </p>
        </div>
        <Button
          onClick={() => setIsWriting(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          {activeTab === 'sparks' ? 'New Spark' : 'New Reflection'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('sparks')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-body text-sm transition-all duration-200 cursor-pointer',
            activeTab === 'sparks'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
          )}
        >
          <Zap className="h-4 w-4" />
          Sparks
          <span className={cn(
            'px-2 py-0.5 rounded-full text-xs',
            activeTab === 'sparks' ? 'bg-primary-foreground/20' : 'bg-secondary'
          )}>
            {sparks.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('reflections')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-body text-sm transition-all duration-200 cursor-pointer',
            activeTab === 'reflections'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
          )}
        >
          <PenLine className="h-4 w-4" />
          Reflections
          <span className={cn(
            'px-2 py-0.5 rounded-full text-xs',
            activeTab === 'reflections' ? 'bg-primary-foreground/20' : 'bg-secondary'
          )}>
            {reflections.length}
          </span>
        </button>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewType('date')}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all cursor-pointer',
            viewType === 'date'
              ? 'bg-secondary text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Calendar className="h-4 w-4" />
          By Date
        </button>
        <button
          onClick={() => setViewType('book')}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all cursor-pointer',
            viewType === 'book'
              ? 'bg-secondary text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Library className="h-4 w-4" />
          By Book
        </button>
      </div>

      {/* Write Modal */}
      {isWriting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                  {activeTab === 'sparks' ? (
                    <>
                      <Zap className="h-5 w-5 text-primary" />
                      New Spark
                    </>
                  ) : (
                    <>
                      <PenLine className="h-5 w-5 text-primary" />
                      New Reflection
                    </>
                  )}
                </h2>
                <button
                  onClick={() => setIsWriting(false)}
                  className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Prompts */}
              {prompts.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Need inspiration?</p>
                  <div className="flex flex-wrap gap-2">
                    {prompts.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => setContent(p.prompt)}
                        className="text-xs px-3 py-1.5 rounded-full bg-secondary text-foreground hover:bg-secondary/80 cursor-pointer transition-colors"
                      >
                        {p.prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Book Selection */}
              <div className="mb-4">
                <button
                  onClick={() => setShowBookPicker(!showBookPicker)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer"
                >
                  {selectedBook ? (
                    <>
                      {selectedBook.cover_small && (
                        <img
                          src={selectedBook.cover_small}
                          alt={selectedBook.title}
                          className="w-8 h-12 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm truncate">{selectedBook.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {selectedBook.authors.join(', ')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedBook(null)
                        }}
                        className="p-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                      <span className="text-muted-foreground text-sm">Select a book (optional)</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto" />
                    </>
                  )}
                </button>

                {showBookPicker && (
                  <div className="mt-2 p-2 border border-border rounded-lg max-h-48 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedBook(null)
                        setShowBookPicker(false)
                      }}
                      className="w-full text-left p-2 rounded hover:bg-secondary text-sm text-muted-foreground cursor-pointer"
                    >
                      No book (just a thought)
                    </button>
                    {userBooks.map(book => (
                      <button
                        key={book.id}
                        onClick={() => {
                          setSelectedBook(book)
                          setShowBookPicker(false)
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded hover:bg-secondary cursor-pointer"
                      >
                        {book.cover_small && (
                          <img
                            src={book.cover_small}
                            alt={book.title}
                            className="w-6 h-9 rounded object-cover"
                          />
                        )}
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm font-medium truncate">{book.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {book.authors.join(', ')}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Chapter Number (for sparks) */}
              {activeTab === 'sparks' && selectedBook && (
                <div className="mb-4">
                  <Input
                    type="number"
                    placeholder="Chapter number (optional)"
                    value={chapterNumber || ''}
                    onChange={(e) => setChapterNumber(e.target.value ? parseInt(e.target.value) : null)}
                    className="bg-background"
                  />
                </div>
              )}

              {/* Content */}
              <div className="mb-4">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={activeTab === 'sparks' ? 'What\'s on your mind?' : 'Write your reflection...'}
                  className="w-full min-h-[120px] p-3 rounded-lg border border-border bg-background text-foreground resize-none focus:outline-none focus:border-primary"
                  maxLength={activeTab === 'sparks' ? 200 : undefined}
                />
                {activeTab === 'sparks' && (
                  <p className={cn(
                    'text-xs mt-1 text-right',
                    content.length > 180 ? 'text-destructive' : 'text-muted-foreground'
                  )}>
                    {content.length}/200
                  </p>
                )}
              </div>

              {/* Quote */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Quote className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Add a quote (optional)</span>
                </div>
                <Input
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="A memorable line from the book..."
                  className="bg-background"
                />
              </div>

              {/* Emoji Picker */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Smile className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Add an emoji (optional)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {emojiOptions.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedEmoji(selectedEmoji === emoji ? null : emoji)}
                      className={cn(
                        'w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all cursor-pointer',
                        selectedEmoji === emoji
                          ? 'bg-primary/20 border-2 border-primary'
                          : 'bg-secondary hover:bg-secondary/80'
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags (for reflections) */}
              {activeTab === 'reflections' && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Add tags (optional)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tagOptions.map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          if (selectedTags.includes(tag)) {
                            setSelectedTags(selectedTags.filter(t => t !== tag))
                          } else {
                            setSelectedTags([...selectedTags, tag])
                          }
                        }}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer',
                          selectedTags.includes(tag)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-foreground hover:bg-secondary/80'
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsWriting(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !content.trim()}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>Save {activeTab === 'sparks' ? 'Spark' : 'Reflection'}</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : currentItems.length === 0 ? (
        <div className="text-center py-16">
          {activeTab === 'sparks' ? (
            <Zap className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          ) : (
            <PenLine className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          )}
          <h3 className="font-display text-xl font-semibold mb-2">
            No {activeTab} yet
          </h3>
          <p className="text-muted-foreground mb-6">
            {activeTab === 'sparks'
              ? 'Capture quick thoughts as you read'
              : 'Write deeper reflections about your reading'}
          </p>
          <Button onClick={() => setIsWriting(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Write your first {activeTab === 'sparks' ? 'spark' : 'reflection'}
          </Button>
        </div>
      ) : viewType === 'date' ? (
        <div className="space-y-4">
          {currentItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              type={activeTab === 'sparks' ? 'spark' : 'reflection'}
              actionMenuOpen={actionMenuOpen}
              setActionMenuOpen={setActionMenuOpen}
              onDelete={handleDelete}
              onShare={handleShare}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {groupedItems?.map((group, i) => (
            <div key={group.book?.id || 'no-book'}>
              <div className="flex items-center gap-3 mb-4">
                {group.book ? (
                  <>
                    {group.book.cover_small && (
                      <img
                        src={group.book.cover_small}
                        alt={group.book.title}
                        className="w-10 h-15 rounded object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold">{group.book.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {group.book.authors.join(', ')}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-15 rounded bg-secondary flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">General Thoughts</h3>
                      <p className="text-sm text-muted-foreground">Not tied to a book</p>
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-4 pl-13">
                {group.items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    type={activeTab === 'sparks' ? 'spark' : 'reflection'}
                    actionMenuOpen={actionMenuOpen}
                    setActionMenuOpen={setActionMenuOpen}
                    onDelete={handleDelete}
                    onShare={handleShare}
                    compact
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Close action menu when clicking outside */}
      {actionMenuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActionMenuOpen(null)}
        />
      )}
    </div>
  )
}

function ItemCard({
  item,
  type,
  actionMenuOpen,
  setActionMenuOpen,
  onDelete,
  onShare,
  compact = false,
}: {
  item: Spark | Reflection
  type: 'spark' | 'reflection'
  actionMenuOpen: string | null
  setActionMenuOpen: (id: string | null) => void
  onDelete: (id: string, type: 'spark' | 'reflection') => void
  onShare: (id: string, type: 'spark' | 'reflection') => void
  compact?: boolean
}) {
  const isReflection = type === 'reflection'
  const reflection = item as Reflection

  return (
    <div className={cn(
      'group relative p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all',
      compact && 'p-3'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          {!compact && item.book && (
            <Link href={`/book/${item.book.id}`} className="flex items-center gap-2 hover:text-primary transition-colors">
              {item.book.cover_small && (
                <img
                  src={item.book.cover_small}
                  alt={item.book.title}
                  className="w-6 h-9 rounded object-cover"
                />
              )}
              <span className="text-sm font-medium">{item.book.title}</span>
            </Link>
          )}
          {item.emoji && (
            <span className="text-lg">{item.emoji}</span>
          )}
          {'chapter_number' in item && item.chapter_number && (
            <span className="text-xs text-muted-foreground">Ch. {item.chapter_number}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {new Date(item.created_at).toLocaleDateString()}
          </span>
          <div className="relative">
            <button
              onClick={() => setActionMenuOpen(actionMenuOpen === item.id ? null : item.id)}
              className="p-1 text-muted-foreground hover:text-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {actionMenuOpen === item.id && (
              <div className="absolute top-full right-0 mt-1 w-40 bg-card border border-border rounded-lg shadow-lg py-1 z-10">
                <button
                  onClick={() => onShare(item.id, type)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 cursor-pointer"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
                <button
                  onClick={() => onDelete(item.id, type)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-destructive cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <p className="text-foreground whitespace-pre-wrap">{item.content}</p>

      {/* Quote */}
      {item.quote && (
        <div className="mt-3 pl-3 border-l-2 border-primary/30">
          <p className="text-sm text-muted-foreground italic">"{item.quote}"</p>
        </div>
      )}

      {/* Tags (for reflections) */}
      {isReflection && reflection.tags && reflection.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {reflection.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full text-xs bg-secondary text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Share indicator */}
      {item.is_public && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Share2 className="h-3 w-3" />
          Shared
        </div>
      )}
    </div>
  )
}
