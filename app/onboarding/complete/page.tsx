'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Sparkles, Users, BookMarked, MessageSquare, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import confetti from 'canvas-confetti'
import { useOnboarding } from '@/components/providers/onboarding-provider'

export default function CompletePage() {
  const { completeOnboarding, isLoading } = useOnboarding()
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // Trigger confetti on mount
    const duration = 3000
    const end = Date.now() + duration

    const colors = ['#996515', '#722f37', '#c4a77d', '#f2e8d9']

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()

    // Show content after a brief delay
    setTimeout(() => setShowContent(true), 300)
  }, [])

  const handleEnter = async () => {
    await completeOnboarding()
  }

  const features = [
    {
      icon: BookMarked,
      title: 'Track Your Reading',
      description: 'Keep a beautiful record of every book you read',
    },
    {
      icon: MessageSquare,
      title: 'Reflect & Grow',
      description: 'AI-powered questions to deepen your reading experience',
    },
    {
      icon: Users,
      title: 'Connect with Readers',
      description: 'Share discoveries with friends who love books too',
    },
  ]

  return (
    <div className="space-y-10 text-center">
      {/* Celebration header */}
      <div
        className={`space-y-6 transition-all duration-700 ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">You're all set!</span>
        </div>

        <div className="relative">
          {/* Decorative book icon */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-primary" />
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground pt-16">
            Welcome to Dawnz
          </h1>
        </div>

        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Your reading journey begins now. We've personalized your experience based on your preferences.
        </p>
      </div>

      {/* Features preview */}
      <div
        className={`grid gap-4 sm:grid-cols-3 transition-all duration-700 delay-200 ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {features.map((feature, index) => (
          <div
            key={feature.title}
            className="p-6 rounded-xl bg-card border border-border text-center"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <feature.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              {feature.title}
            </h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Quote */}
      <div
        className={`py-8 transition-all duration-700 delay-300 ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <blockquote className="font-display text-xl sm:text-2xl italic text-foreground/80 max-w-lg mx-auto">
          "A reader lives a thousand lives before he dies. The man who never reads lives only one."
        </blockquote>
        <cite className="block mt-4 text-sm text-muted-foreground">— George R.R. Martin</cite>
      </div>

      {/* Enter button */}
      <div
        className={`pt-4 transition-all duration-700 delay-400 ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <Button
          onClick={handleEnter}
          disabled={isLoading}
          size="lg"
          className="min-w-[250px] h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-body shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <BookOpen className="mr-3 h-5 w-5" />
              Start Reading
            </>
          )}
        </Button>

        <p className="mt-4 text-sm text-muted-foreground">
          Your personalized library awaits
        </p>
      </div>
    </div>
  )
}
