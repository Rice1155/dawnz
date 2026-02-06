'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Mail, X, Users, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useOnboarding } from '@/components/providers/onboarding-provider'

export default function InvitePage() {
  const router = useRouter()
  const { sendInvites } = useOnboarding()
  const [emails, setEmails] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sentCount, setSentCount] = useState(0)
  const [error, setError] = useState('')

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const addEmail = () => {
    const email = inputValue.trim().toLowerCase()
    setError('')

    if (!email) return

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (emails.includes(email)) {
      setError('This email has already been added')
      return
    }

    if (emails.length >= 10) {
      setError('You can invite up to 10 friends at a time')
      return
    }

    setEmails([...emails, email])
    setInputValue('')
  }

  const removeEmail = (email: string) => {
    setEmails(emails.filter(e => e !== email))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addEmail()
    }
  }

  const handleSendInvites = async () => {
    if (emails.length === 0) return

    setIsSending(true)
    try {
      const count = await sendInvites(emails)
      setSentCount(count || emails.length)
      setEmails([])
    } catch (error) {
      console.error('Failed to send invites:', error)
      setError('Failed to send some invites. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleContinue = async () => {
    setIsLoading(true)
    router.push('/onboarding/complete')
  }

  const handleSkip = () => {
    router.push('/onboarding/complete')
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">Build your reading circle</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
          Invite friends to join you
        </h1>

        <p className="text-muted-foreground max-w-md mx-auto">
          Reading is better with friends. Invite people you know and discover what
          they're reading, share recommendations, and discuss books together.
        </p>
      </div>

      {/* Success message */}
      {sentCount > 0 && (
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
          <p className="text-primary font-medium">
            {sentCount} invitation{sentCount > 1 ? 's' : ''} sent successfully!
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Your friends will receive an email with a link to join Dawnz.
          </p>
        </div>
      )}

      {/* Email input */}
      <div className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="email"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setError('')
            }}
            onKeyDown={handleKeyDown}
            placeholder="friend@example.com"
            className={cn(
              'h-14 text-lg bg-card border-border focus:border-primary pl-12 pr-24',
              error && 'border-destructive focus:border-destructive'
            )}
          />
          <Button
            type="button"
            onClick={addEmail}
            disabled={!inputValue.trim()}
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90"
          >
            Add
          </Button>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Email list */}
        {emails.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {emails.length} friend{emails.length > 1 ? 's' : ''} to invite:
              </p>
              <Button
                onClick={handleSendInvites}
                disabled={isSending}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Invites
                  </>
                )}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 p-4 rounded-lg bg-card border border-border">
              {emails.map((email) => (
                <div
                  key={email}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm"
                >
                  <span className="text-foreground">{email}</span>
                  <button
                    onClick={() => removeEmail(email)}
                    className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Benefits */}
      <div className="p-6 rounded-xl bg-card border border-border">
        <h3 className="font-display text-lg font-semibold text-foreground mb-4">
          Why invite friends?
        </h3>
        <ul className="space-y-3">
          {[
            'See what your friends are currently reading',
            'Get personalized recommendations from people you trust',
            'Share your reading reflections with your inner circle',
            'Join or create private book clubs',
          ].map((benefit, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-primary" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-muted-foreground">{benefit}</span>
            </li>
          ))}
        </ul>
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
