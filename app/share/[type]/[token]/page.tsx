'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import {
  Zap,
  PenLine,
  BookOpen,
  Quote,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Share2,
  Copy,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type SharedItem = {
  id: string
  content: string
  quote: string | null
  emoji: string | null
  tags?: string[]
  chapter_number?: number | null
  created_at: string
  book: {
    id: string
    title: string
    authors: string[]
    cover_small: string | null
    cover_medium: string | null
  } | null
  user: {
    id: string
    display_name: string | null
    username: string | null
    avatar_url: string | null
  } | null
}

export default function SharePage({
  params,
}: {
  params: Promise<{ type: string; token: string }>
}) {
  const { type, token } = use(params)
  const [item, setItem] = useState<SharedItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const isSpark = type === 'spark'

  useEffect(() => {
    fetchSharedItem()
  }, [type, token])

  const fetchSharedItem = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const endpoint = isSpark
        ? `/api/sparks?shareToken=${token}`
        : `/api/user-reflections?shareToken=${token}`

      const response = await fetch(endpoint)

      if (!response.ok) {
        if (response.status === 404) {
          setError('This shared item could not be found')
        } else {
          throw new Error('Failed to load')
        }
        return
      }

      const data = await response.json()
      setItem(isSpark ? data.spark : data.reflection)
    } catch (err) {
      console.error('Error fetching shared item:', err)
      setError('Failed to load this shared item')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy link')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md mx-auto px-4 text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h2 className="font-display text-2xl font-bold mb-2">{error || 'Not found'}</h2>
          <p className="text-muted-foreground mb-6">
            This {isSpark ? 'spark' : 'reflection'} may have been removed or the link is invalid.
          </p>
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const userName = item.user?.display_name || item.user?.username || 'A reader'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-bold">Dawnz</span>
          </Link>
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Type badge */}
        <div className="flex items-center gap-2 mb-6">
          {isSpark ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Zap className="h-4 w-4" />
              Spark
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <PenLine className="h-4 w-4" />
              Reflection
            </div>
          )}
          {item.emoji && <span className="text-2xl">{item.emoji}</span>}
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
            {item.user?.avatar_url ? (
              <img
                src={item.user.avatar_url}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg font-medium text-muted-foreground">
                {userName[0].toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-medium">{userName}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(item.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-8">
          <p className="text-xl leading-relaxed">{item.content}</p>
        </div>

        {/* Quote */}
        {item.quote && (
          <div className="mb-8 pl-4 border-l-4 border-primary/30">
            <Quote className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-lg italic text-muted-foreground">"{item.quote}"</p>
          </div>
        )}

        {/* Tags (for reflections) */}
        {item.tags && item.tags.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-sm bg-secondary text-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Book info */}
        {item.book && (
          <div className="p-6 rounded-xl bg-card border border-border">
            <p className="text-sm text-muted-foreground mb-3">About the book</p>
            <div className="flex gap-4">
              {item.book.cover_medium && (
                <img
                  src={item.book.cover_medium}
                  alt={item.book.title}
                  className="w-16 h-24 rounded-lg object-cover book-shadow"
                />
              )}
              <div>
                <h3 className="font-display text-lg font-semibold">{item.book.title}</h3>
                <p className="text-muted-foreground">
                  by {item.book.authors.join(', ')}
                </p>
                {item.chapter_number && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Chapter {item.chapter_number}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Want to capture your own reading thoughts?
          </p>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/signup">
              Join Dawnz
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
