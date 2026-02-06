'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, X, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useOnboarding } from '@/components/providers/onboarding-provider'

const suggestedTopics = [
  'Personal Growth',
  'Relationships',
  'Career Development',
  'Mental Health',
  'Technology',
  'History',
  'Travel',
  'Creativity',
  'Leadership',
  'Mindfulness',
  'Finance',
  'Parenting',
  'Adventure',
  'True Crime',
  'Social Justice',
  'Environment',
]

export default function TopicsPage() {
  const router = useRouter()
  const { saveTopics } = useOnboarding()
  const [topics, setTopics] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const addTopic = (topic: string) => {
    const trimmed = topic.trim()
    if (trimmed && !topics.includes(trimmed) && topics.length < 10) {
      setTopics([...topics, trimmed])
      setInputValue('')
    }
  }

  const removeTopic = (topic: string) => {
    setTopics(topics.filter(t => t !== topic))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTopic(inputValue)
    }
  }

  const handleContinue = async () => {
    setIsLoading(true)
    try {
      if (topics.length > 0) {
        await saveTopics(topics)
      }
      router.push('/onboarding/favorites')
    } catch (error) {
      console.error('Failed to save topics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    router.push('/onboarding/favorites')
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
          <Lightbulb className="h-4 w-4" />
          <span className="text-sm font-medium">Discover new interests</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
          What topics spark your curiosity?
        </h1>

        <p className="text-muted-foreground max-w-md mx-auto">
          Tell us what you're curious about. We'll help you find books that explore
          these themes.
        </p>
      </div>

      {/* Input */}
      <div className="space-y-4">
        <div className="relative">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a topic and press Enter..."
            className="h-14 text-lg bg-card border-border focus:border-primary pr-24"
            maxLength={50}
          />
          <Button
            type="button"
            onClick={() => addTopic(inputValue)}
            disabled={!inputValue.trim()}
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90"
          >
            Add
          </Button>
        </div>

        {/* Selected topics */}
        {topics.length > 0 && (
          <div className="flex flex-wrap gap-2 p-4 rounded-lg bg-card border border-border">
            {topics.map((topic, index) => (
              <Badge
                key={`${topic}-${index}`}
                variant="secondary"
                className="px-3 py-1.5 text-sm bg-primary/10 text-primary hover:bg-primary/20 cursor-default"
              >
                {topic}
                <button
                  onClick={() => removeTopic(topic)}
                  className="ml-2 hover:text-destructive transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <p className="text-sm text-muted-foreground text-center">
          {topics.length}/10 topics added
        </p>
      </div>

      {/* Suggested topics */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground text-center">
          Or choose from suggestions:
        </p>

        <div className="flex flex-wrap justify-center gap-2">
          {suggestedTopics
            .filter(topic => !topics.includes(topic))
            .map((topic, index) => (
              <button
                key={`${topic}-${index}`}
                onClick={() => addTopic(topic)}
                disabled={topics.length >= 10}
                className={cn(
                  'px-4 py-2 rounded-full border text-sm transition-all duration-200 cursor-pointer disabled:cursor-not-allowed',
                  topics.length >= 10
                    ? 'border-border text-muted-foreground/50 cursor-not-allowed'
                    : 'border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5'
                )}
              >
                {topic}
              </button>
            ))}
        </div>
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
