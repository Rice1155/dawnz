'use client'

import { usePathname } from 'next/navigation'
import { BookOpen, Check } from 'lucide-react'
import Link from 'next/link'
import { OnboardingProvider } from '@/components/providers/onboarding-provider'

const steps = [
  { id: 1, name: 'Genres', path: '/onboarding/genres' },
  { id: 2, name: 'Topics', path: '/onboarding/topics' },
  { id: 3, name: 'Favorites', path: '/onboarding/favorites' },
  { id: 4, name: 'Invite', path: '/onboarding/invite' },
  { id: 5, name: 'Complete', path: '/onboarding/complete' },
]

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const currentStep = steps.find(s => s.path === pathname)?.id || 1

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="font-display text-xl font-bold text-foreground">Dawnz</span>
            </Link>

            {/* Step indicator - desktop */}
            <div className="hidden sm:flex items-center gap-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                      ${step.id < currentStep
                        ? 'bg-primary text-primary-foreground'
                        : step.id === currentStep
                          ? 'bg-primary/20 text-primary border-2 border-primary'
                          : 'bg-muted text-muted-foreground'
                      }
                    `}
                  >
                    {step.id < currentStep ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-8 h-0.5 mx-1 transition-colors duration-300 ${
                        step.id < currentStep ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step indicator - mobile */}
            <div className="sm:hidden text-sm text-muted-foreground">
              Step {currentStep} of {steps.length}
            </div>
          </div>
        </div>
      </header>

      {/* Progress bar - mobile */}
      <div className="sm:hidden h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${(currentStep / steps.length) * 100}%` }}
        />
      </div>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <OnboardingProvider>
          {children}
        </OnboardingProvider>
      </main>
    </div>
  )
}
