'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  MessageSquareQuote,
  BookOpen,
  Calendar,
  Search,
  ChevronRight,
  Heart,
  Loader2,
  Lock,
  Globe,
  MoreHorizontal,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type FilterType = 'all' | 'this-week' | 'this-month'

type Reflection = {
  id: string
  user_id: string
  book_id: string
  user_book_id: string
  question: string
  answer: string | null
  chapter_number: number | null
  page_number: number | null
  percentage_complete: number | null
  is_public: boolean
  share_with_friends: boolean
  ai_generated: boolean
  likes_count: number
  created_at: string
  answered_at: string | null
  book: {
    id: string
    title: string
    authors: string[] | null
    cover_medium: string | null
  } | null
}

export default function ReflectionsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    fetchReflections()
  }, [])

  const fetchReflections = async () => {
    try {
      const response = await fetch('/api/reflections?limit=100')

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login?redirect=/reflections')
          return
        }
        throw new Error('Failed to fetch reflections')
      }

      const data = await response.json()
      setReflections(data.reflections || [])
    } catch (error) {
      console.error('Error fetching reflections:', error)
      toast.error('Failed to load reflections')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePublic = async (reflection: Reflection) => {
    try {
      const response = await fetch('/api/reflections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reflectionId: reflection.id,
          isPublic: !reflection.is_public,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update reflection')
      }

      setReflections((prev) =>
        prev.map((r) =>
          r.id === reflection.id ? { ...r, is_public: !r.is_public } : r
        )
      )
      toast.success(
        reflection.is_public
          ? 'Reflection is now private'
          : 'Reflection is now public'
      )
    } catch (error) {
      console.error('Error updating reflection:', error)
      toast.error('Failed to update reflection')
    }
    setOpenMenuId(null)
  }

  const handleDelete = async (reflectionId: string) => {
    if (!confirm('Are you sure you want to delete this reflection?')) return

    try {
      const response = await fetch(`/api/reflections?reflectionId=${reflectionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete reflection')
      }

      setReflections((prev) => prev.filter((r) => r.id !== reflectionId))
      toast.success('Reflection deleted')
    } catch (error) {
      console.error('Error deleting reflection:', error)
      toast.error('Failed to delete reflection')
    }
    setOpenMenuId(null)
  }

  const filteredReflections = useMemo(() => {
    return reflections.filter((reflection) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          reflection.book?.title.toLowerCase().includes(query) ||
          reflection.question.toLowerCase().includes(query) ||
          reflection.answer?.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Time filter
      if (filter !== 'all') {
        const date = new Date(reflection.created_at)
        const now = new Date()
        if (filter === 'this-week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          if (date < weekAgo) return false
        } else if (filter === 'this-month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          if (date < monthAgo) return false
        }
      }

      return true
    })
  }, [reflections, searchQuery, filter])

  const stats = useMemo(() => {
    const uniqueBooks = new Set(reflections.map((r) => r.book_id))
    const totalLikes = reflections.reduce((acc, r) => acc + r.likes_count, 0)
    return {
      total: reflections.length,
      books: uniqueBooks.size,
      likes: totalLikes,
    }
  }, [reflections])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
          My Reflections
        </h1>
        <p className="text-muted-foreground">
          {reflections.length} reflection{reflections.length !== 1 ? 's' : ''} across{' '}
          {stats.books} book{stats.books !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reflections..."
            className="pl-10 bg-card border-border"
          />
        </div>
        <div className="flex gap-2">
          {[
            { id: 'all' as const, label: 'All Time' },
            { id: 'this-week' as const, label: 'This Week' },
            { id: 'this-month' as const, label: 'This Month' },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setFilter(option.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                filter === option.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reflections List */}
      {filteredReflections.length > 0 ? (
        <div className="space-y-6">
          {filteredReflections.map((reflection) => (
            <article
              key={reflection.id}
              className="p-6 rounded-xl bg-card border border-border"
            >
              {/* Book info */}
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border">
                <Link
                  href={`/book/${reflection.book_id}`}
                  className="w-12 h-16 rounded overflow-hidden flex-shrink-0 book-shadow bg-muted"
                >
                  {reflection.book?.cover_medium ? (
                    <img
                      src={reflection.book.cover_medium}
                      alt={reflection.book?.title || 'Book'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-muted-foreground/30" />
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/book/${reflection.book_id}`}
                    className="font-display font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    {reflection.book?.title || 'Unknown Book'}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {reflection.book?.authors?.join(', ') || 'Unknown Author'}
                  </p>
                  {reflection.chapter_number && (
                    <p className="text-xs text-primary mt-1">
                      Chapter {reflection.chapter_number}
                    </p>
                  )}
                </div>
                <div className="text-right text-sm text-muted-foreground flex items-center gap-2">
                  <div>
                    <div className="flex items-center gap-1 justify-end">
                      <Calendar className="h-3 w-3" />
                      {formatDate(reflection.created_at)}
                    </div>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      {reflection.is_public ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          Public
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Private
                        </span>
                      )}
                    </div>
                  </div>
                  {/* More menu */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenMenuId(openMenuId === reflection.id ? null : reflection.id)
                      }
                      className="p-1 rounded hover:bg-secondary cursor-pointer"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {openMenuId === reflection.id && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => handleTogglePublic(reflection)}
                          className="w-full px-3 py-2 text-sm text-left hover:bg-secondary flex items-center gap-2 cursor-pointer"
                        >
                          {reflection.is_public ? (
                            <>
                              <EyeOff className="h-4 w-4" />
                              Make Private
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4" />
                              Make Public
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(reflection.id)}
                          className="w-full px-3 py-2 text-sm text-left hover:bg-secondary flex items-center gap-2 text-red-500 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Question */}
              <div className="mb-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <MessageSquareQuote className="h-3 w-3" />
                  <span>Reflection Question</span>
                </div>
                <p className="font-display text-lg leading-relaxed text-foreground">
                  "{reflection.question}"
                </p>
              </div>

              {/* Answer */}
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-muted-foreground italic leading-relaxed">
                  {reflection.answer}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  <Heart className="h-4 w-4" />
                  {reflection.likes_count} like{reflection.likes_count !== 1 ? 's' : ''}
                </button>
                <Link
                  href={`/book/${reflection.book_id}`}
                  className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  View book
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <MessageSquareQuote className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-display text-xl font-semibold mb-2">
            {searchQuery ? 'No reflections found' : 'No reflections yet'}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {searchQuery
              ? 'Try a different search term'
              : 'Start reading a book and share your thoughts to create reflections.'}
          </p>
          {!searchQuery && (
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/browse">
                <BookOpen className="mr-2 h-4 w-4" />
                Find a Book
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* Stats */}
      {reflections.length > 0 && (
        <div className="mt-12 p-6 rounded-xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border border-primary/20">
          <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquareQuote className="h-5 w-5 text-primary" />
            Your Reflection Journey
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Reflections</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{stats.books}</p>
              <p className="text-sm text-muted-foreground">Books Reflected On</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{stats.likes}</p>
              <p className="text-sm text-muted-foreground">Total Likes</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
