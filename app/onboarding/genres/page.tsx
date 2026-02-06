'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useOnboarding } from '@/components/providers/onboarding-provider'

const genres = [
  { id: 'literary-fiction', name: 'Literary Fiction', emoji: '📖' },
  { id: 'mystery-thriller', name: 'Mystery & Thriller', emoji: '🔍' },
  { id: 'romance', name: 'Romance', emoji: '💕' },
  { id: 'science-fiction', name: 'Science Fiction', emoji: '🚀' },
  { id: 'fantasy', name: 'Fantasy', emoji: '🐉' },
  { id: 'historical-fiction', name: 'Historical Fiction', emoji: '🏰' },
  { id: 'horror', name: 'Horror', emoji: '👻' },
  { id: 'biography-memoir', name: 'Biography & Memoir', emoji: '👤' },
  { id: 'self-help', name: 'Self-Help', emoji: '🌱' },
  { id: 'business', name: 'Business', emoji: '📊' },
  { id: 'science', name: 'Science', emoji: '🔬' },
  { id: 'history', name: 'History', emoji: '📜' },
  { id: 'philosophy', name: 'Philosophy', emoji: '🤔' },
  { id: 'poetry', name: 'Poetry', emoji: '✨' },
  { id: 'classics', name: 'Classics', emoji: '📚' },
  { id: 'young-adult', name: 'Young Adult', emoji: '🌟' },
]

export default function GenresPage() {
  const router = useRouter()
  const { saveGenres, isLoading: isSaving } = useOnboarding()
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const toggleGenre = (genreId: string) => {
    setSelectedGenres(prev =>
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    )
  }

  const handleContinue = async () => {
    if (selectedGenres.length < 3) return

    setIsLoading(true)
    try {
      await saveGenres(selectedGenres)
      router.push('/onboarding/topics')
    } catch (error) {
      console.error('Failed to save genres:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">Personalize your experience</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
          What do you love to read?
        </h1>

        <p className="text-muted-foreground max-w-md mx-auto">
          Select at least 3 genres that interest you. This helps us recommend books
          you'll actually want to read.
        </p>
      </div>

      {/* Genre grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {genres.map((genre) => {
          const isSelected = selectedGenres.includes(genre.id)

          return (
            <button
              key={genre.id}
              onClick={() => toggleGenre(genre.id)}
              className={cn(
                'relative p-4 rounded-xl border-2 transition-all duration-200 text-left group cursor-pointer',
                isSelected
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-card/80'
              )}
            >
              {/* Selection indicator */}
              <div
                className={cn(
                  'absolute top-2 right-2 w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center',
                  isSelected
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/30'
                )}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>

              {/* Content */}
              <span className="text-2xl mb-2 block">{genre.emoji}</span>
              <span className={cn(
                'font-body text-sm font-medium transition-colors',
                isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
              )}>
                {genre.name}
              </span>
            </button>
          )
        })}
      </div>

      {/* Selection count */}
      <div className="text-center">
        <p className={cn(
          'text-sm transition-colors',
          selectedGenres.length >= 3 ? 'text-primary' : 'text-muted-foreground'
        )}>
          {selectedGenres.length} selected
          {selectedGenres.length < 3 && ` (${3 - selectedGenres.length} more needed)`}
        </p>
      </div>

      {/* Continue button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={handleContinue}
          disabled={selectedGenres.length < 3 || isLoading}
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
