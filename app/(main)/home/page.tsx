'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Clock,
  TrendingUp,
  ArrowRight,
  Sparkles,
  BookMarked,
  MessageSquareQuote,
  Plus,
  ChevronRight,
  Loader2,
  User,
  X,
  BookOpenCheck,
  Zap,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

type CurrentlyReadingBook = {
  id: string
  current_page: number | null
  current_chapter: number | null
  updated_at: string
  book: {
    id: string
    title: string
    authors: string[] | null
    cover_medium: string | null
    page_count: number | null
    chapter_count: number | null
  } | null
}

type Reflection = {
  id: string
  question: string
  answer: string | null
  created_at: string
  book: {
    id: string
    title: string
  } | null
}

type Spark = {
  id: string
  content: string
  quote: string | null
  emoji: string | null
  created_at: string
  book: {
    id: string
    title: string
    authors: string[]
    cover_small: string | null
  } | null
}

type Prompt = {
  prompt: string
  type: string
}

type FriendActivity = {
  id: string
  name: string
  avatar: string | null
  action: string
  book: string
  bookId: string | null
  time: string
}

type Stats = {
  booksThisYear: number
  currentStreak: number
  totalReflections: number
  pagesRead: number
}

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [currentlyReading, setCurrentlyReading] = useState<CurrentlyReadingBook[]>([])
  const [recentReflections, setRecentReflections] = useState<Reflection[]>([])
  const [friendsActivity, setFriendsActivity] = useState<FriendActivity[]>([])
  const [stats, setStats] = useState<Stats>({
    booksThisYear: 0,
    currentStreak: 0,
    totalReflections: 0,
    pagesRead: 0,
  })

  // Sparks state
  const [recentSparks, setRecentSparks] = useState<Spark[]>([])
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [sparkContent, setSparkContent] = useState('')
  const [isSavingSpark, setIsSavingSpark] = useState(false)

  // Progress update modal state
  const [selectedBook, setSelectedBook] = useState<CurrentlyReadingBook | null>(null)
  const [progressModalOpen, setProgressModalOpen] = useState(false)
  const [newPage, setNewPage] = useState('')
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false)

  const [greeting] = useState(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  })

  useEffect(() => {
    fetchDashboard()
    fetchSparksAndPrompts()
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/dashboard')

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login?redirect=/home')
          return
        }
        throw new Error('Failed to fetch dashboard')
      }

      const data = await response.json()
      setDisplayName(data.profile?.displayName)
      setCurrentlyReading(data.currentlyReading || [])
      setRecentReflections(data.recentReflections || [])
      setFriendsActivity(data.friendsActivity || [])
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSparksAndPrompts = async () => {
    try {
      const [sparksRes, promptsRes] = await Promise.all([
        fetch('/api/sparks?limit=3'),
        fetch('/api/prompts?random=true&limit=1'),
      ])

      if (sparksRes.ok) {
        const data = await sparksRes.json()
        setRecentSparks(data.sparks || [])
      }

      if (promptsRes.ok) {
        const data = await promptsRes.json()
        setPrompts(data.prompts || [])
      }
    } catch (error) {
      console.error('Error fetching sparks/prompts:', error)
    }
  }

  const handleQuickSpark = async () => {
    if (!sparkContent.trim()) return

    if (sparkContent.length > 200) {
      toast.error('Sparks must be 200 characters or less')
      return
    }

    setIsSavingSpark(true)
    try {
      // If currently reading a book, attach it to the spark
      const currentBook = currentlyReading[0]?.book

      const res = await fetch('/api/sparks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: sparkContent.trim(),
          bookId: currentBook?.id || null,
        }),
      })

      if (!res.ok) throw new Error('Failed to save spark')

      const data = await res.json()
      setRecentSparks(prev => [data.spark, ...prev.slice(0, 2)])
      setSparkContent('')
      toast.success('Spark saved!')

      // Refresh prompts
      const promptsRes = await fetch('/api/prompts?random=true&limit=1')
      if (promptsRes.ok) {
        const promptsData = await promptsRes.json()
        setPrompts(promptsData.prompts || [])
      }
    } catch (error) {
      toast.error('Failed to save spark')
    } finally {
      setIsSavingSpark(false)
    }
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return date.toLocaleDateString()
  }

  const openProgressModal = (book: CurrentlyReadingBook) => {
    setSelectedBook(book)
    setNewPage(book.current_page?.toString() || '')
    setProgressModalOpen(true)
  }

  const closeProgressModal = () => {
    setProgressModalOpen(false)
    setSelectedBook(null)
    setNewPage('')
  }

  const handleUpdateProgress = async () => {
    if (!selectedBook || !newPage) return

    setIsUpdatingProgress(true)
    try {
      const response = await fetch('/api/books/library', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userBookId: selectedBook.id,
          currentPage: parseInt(newPage),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update progress')
      }

      // Update local state
      setCurrentlyReading(prev =>
        prev.map(item =>
          item.id === selectedBook.id
            ? { ...item, current_page: parseInt(newPage), updated_at: new Date().toISOString() }
            : item
        )
      )

      toast.success('Progress updated!')
      closeProgressModal()
    } catch (error) {
      console.error('Error updating progress:', error)
      toast.error('Failed to update progress')
    } finally {
      setIsUpdatingProgress(false)
    }
  }

  const handleGoToBook = () => {
    if (selectedBook?.book?.id) {
      router.push(`/book/${selectedBook.book.id}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
          {greeting}, {displayName || 'Reader'}
        </h1>
        <p className="text-muted-foreground">
          Ready to continue your literary journey?
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content - 2 columns */}
        <div className="lg:col-span-2 space-y-8">
          {/* Currently Reading */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Currently Reading
              </h2>
              <Link
                href="/bookshelf"
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
              >
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {currentlyReading.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {currentlyReading.map((item) => {
                  if (!item.book) return null
                  const progress =
                    item.current_page && item.book.page_count
                      ? Math.round((item.current_page / item.book.page_count) * 100)
                      : 0

                  return (
                    <button
                      key={item.id}
                      onClick={() => openProgressModal(item)}
                      className="group flex gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300 text-left cursor-pointer"
                    >
                      {/* Cover */}
                      <div className="relative w-20 h-28 rounded-lg overflow-hidden flex-shrink-0 book-shadow bg-muted">
                        {item.book.cover_medium ? (
                          <img
                            src={item.book.cover_medium}
                            alt={item.book.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {item.book.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {item.book.authors?.join(', ') || 'Unknown Author'}
                        </p>

                        {/* Progress bar */}
                        <div className="space-y-1">
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            {item.current_chapter && item.book.chapter_count ? (
                              <span>
                                Chapter {item.current_chapter}/{item.book.chapter_count}
                              </span>
                            ) : item.current_page ? (
                              <span>
                                Page {item.current_page}
                                {item.book.page_count ? ` of ${item.book.page_count}` : ''}
                              </span>
                            ) : (
                              <span>Just started</span>
                            )}
                            <span>{progress}%</span>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground mt-2">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {formatRelativeTime(item.updated_at)}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 rounded-xl bg-card border border-border">
                <BookMarked className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-4">No books in progress</p>
                <Button asChild>
                  <Link href="/browse">
                    <Plus className="mr-2 h-4 w-4" />
                    Find a book to read
                  </Link>
                </Button>
              </div>
            )}
          </section>

          {/* Quick Spark */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Capture a Spark
              </h2>
              <Link
                href="/sparks"
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
              >
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Quick write input */}
            <div className="p-4 rounded-xl bg-card border border-border mb-4">
              {/* Prompt suggestion */}
              {prompts.length > 0 && (
                <button
                  onClick={() => setSparkContent(prompts[0].prompt)}
                  className="mb-3 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  Try: "{prompts[0].prompt}"
                </button>
              )}

              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={sparkContent}
                    onChange={(e) => setSparkContent(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full min-h-[60px] p-3 rounded-lg border border-border bg-background text-foreground resize-none focus:outline-none focus:border-primary text-sm"
                    maxLength={200}
                  />
                  <span className={`absolute bottom-2 right-2 text-xs ${sparkContent.length > 180 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {sparkContent.length}/200
                  </span>
                </div>
                <Button
                  onClick={handleQuickSpark}
                  disabled={!sparkContent.trim() || isSavingSpark}
                  className="bg-primary hover:bg-primary/90 self-end"
                >
                  {isSavingSpark ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {currentlyReading.length > 0 && currentlyReading[0].book && (
                <p className="text-xs text-muted-foreground mt-2">
                  <BookOpen className="inline h-3 w-3 mr-1" />
                  Will be linked to: {currentlyReading[0].book.title}
                </p>
              )}
            </div>

            {/* Recent sparks */}
            {recentSparks.length > 0 ? (
              <div className="space-y-3">
                {recentSparks.map((spark) => (
                  <div
                    key={spark.id}
                    className="p-3 rounded-lg bg-secondary/30 border border-border/50"
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      {spark.book && (
                        <>
                          <BookOpen className="h-3 w-3" />
                          <span>{spark.book.title}</span>
                          <span>·</span>
                        </>
                      )}
                      <span>{formatRelativeTime(spark.created_at)}</span>
                      {spark.emoji && <span className="ml-auto">{spark.emoji}</span>}
                    </div>
                    <p className="text-sm text-foreground">{spark.content}</p>
                    {spark.quote && (
                      <p className="text-xs text-muted-foreground italic mt-1 pl-2 border-l-2 border-primary/30">
                        "{spark.quote}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 rounded-lg bg-secondary/20 border border-border/50">
                <Zap className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No sparks yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Capture quick thoughts as you read
                </p>
              </div>
            )}
          </section>

          {/* Discover prompt */}
          <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border border-primary/20 p-6">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary">Daily Discovery</span>
              </div>
              <h3 className="font-display text-xl font-bold mb-2">
                Looking for your next read?
              </h3>
              <p className="text-muted-foreground mb-4">
                Based on your reading history, we think you'll love these picks.
              </p>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/browse">
                  See Recommendations
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            {/* Decorative */}
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
          </section>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Reading Stats */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Your Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-2xl font-bold text-foreground">{stats.booksThisYear}</p>
                <p className="text-xs text-muted-foreground">Books this year</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-2xl font-bold text-foreground">{stats.currentStreak}</p>
                <p className="text-xs text-muted-foreground">Day streak</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-2xl font-bold text-foreground">{stats.totalReflections}</p>
                <p className="text-xs text-muted-foreground">Reflections</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-2xl font-bold text-foreground">
                  {stats.pagesRead.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Pages read</p>
              </div>
            </div>
          </div>

          {/* Friends Activity */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-display text-lg font-semibold mb-4">Friends Activity</h3>
            {friendsActivity.length > 0 ? (
              <>
                <div className="space-y-4">
                  {friendsActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-muted-foreground flex-shrink-0 overflow-hidden">
                        {activity.avatar ? (
                          <img
                            src={activity.avatar}
                            alt={activity.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          activity.name[0]
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium text-foreground">{activity.name}</span>
                          {' '}
                          <span className="text-muted-foreground">{activity.action}</span>
                          {' '}
                          {activity.bookId ? (
                            <Link
                              href={`/book/${activity.bookId}`}
                              className="text-foreground font-medium hover:text-primary"
                            >
                              {activity.book}
                            </Link>
                          ) : (
                            <span className="text-foreground font-medium">{activity.book}</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(activity.time)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/friends"
                  className="flex items-center justify-center gap-1 mt-4 pt-4 border-t border-border text-sm text-primary hover:text-primary/80"
                >
                  See all activity
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <div className="text-center py-4">
                <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No friend activity yet</p>
                <Link
                  href="/friends"
                  className="text-xs text-primary hover:text-primary/80 mt-1 inline-block"
                >
                  Find friends
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-display text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <Link href="/browse">
                  <Plus className="mr-2 h-4 w-4" />
                  Add a new book
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <Link href="/friends">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Invite friends
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Update Modal */}
      {progressModalOpen && selectedBook?.book && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeProgressModal}
          />

          {/* Modal */}
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            {/* Close button */}
            <button
              onClick={closeProgressModal}
              className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 book-shadow bg-muted">
                {selectedBook.book.cover_medium ? (
                  <img
                    src={selectedBook.book.cover_medium}
                    alt={selectedBook.book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-lg text-foreground line-clamp-2">
                  {selectedBook.book.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedBook.book.authors?.join(', ') || 'Unknown Author'}
                </p>
              </div>
            </div>

            {/* Progress update form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <BookOpenCheck className="inline h-4 w-4 mr-1" />
                  How far have you read?
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={newPage}
                    onChange={(e) => setNewPage(e.target.value)}
                    placeholder="Current page"
                    className="flex-1"
                    min={1}
                    max={selectedBook.book.page_count || undefined}
                  />
                  {selectedBook.book.page_count && (
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      of {selectedBook.book.page_count} pages
                    </span>
                  )}
                </div>
              </div>

              {/* Progress preview */}
              {newPage && selectedBook.book.page_count && (
                <div className="space-y-1">
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((parseInt(newPage) / selectedBook.book.page_count) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    {Math.min(
                      100,
                      Math.round((parseInt(newPage) / selectedBook.book.page_count) * 100)
                    )}% complete
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleUpdateProgress}
                  disabled={!newPage || isUpdatingProgress}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {isUpdatingProgress ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Update Progress'
                  )}
                </Button>
                <Button
                  onClick={handleGoToBook}
                  variant="outline"
                  className="flex-1"
                >
                  View Book
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
