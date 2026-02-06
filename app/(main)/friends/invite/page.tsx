'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, X, Users, Send, Loader2, Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function InviteFriendsPage() {
  const router = useRouter()
  const [emails, setEmails] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sentCount, setSentCount] = useState(0)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [isLoadingLink, setIsLoadingLink] = useState(true)

  useEffect(() => {
    fetchInviteLink()
  }, [])

  const fetchInviteLink = async () => {
    try {
      const response = await fetch('/api/friends/invite')

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login?redirect=/friends/invite')
          return
        }
        throw new Error('Failed to get invite link')
      }

      const data = await response.json()
      setInviteLink(data.inviteLink)
    } catch (error) {
      console.error('Error fetching invite link:', error)
      setInviteLink('https://dawnz.app/join')
    } finally {
      setIsLoadingLink(false)
    }
  }

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
    setEmails(emails.filter((e) => e !== email))
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
      const response = await fetch('/api/friends/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      })

      if (!response.ok) {
        throw new Error('Failed to send invites')
      }

      const data = await response.json()
      setSentCount(data.invitedCount || emails.length)
      setEmails([])
      toast.success(`${data.invitedCount || emails.length} invitation(s) sent!`)
    } catch (error) {
      console.error('Error sending invites:', error)
      toast.error('Failed to send invitations')
    } finally {
      setIsSending(false)
    }
  }

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/friends"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Friends
      </Link>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">Grow your circle</span>
        </div>

        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Invite Friends to Dawnz
        </h1>
        <p className="text-muted-foreground">
          Reading is better with friends. Invite people to join and discover what
          they're reading.
        </p>
      </div>

      {/* Success message */}
      {sentCount > 0 && (
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center mb-6">
          <Check className="h-6 w-6 text-primary mx-auto mb-2" />
          <p className="text-primary font-medium">
            {sentCount} invitation{sentCount > 1 ? 's' : ''} sent successfully!
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Your friends will receive an email with a link to join.
          </p>
        </div>
      )}

      {/* Email invites */}
      <div className="p-6 rounded-xl bg-card border border-border mb-6">
        <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Invite by Email
        </h2>

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
                'h-12 bg-background border-border pl-12 pr-20',
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

          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Email list */}
          {emails.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
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

              <div className="flex flex-wrap gap-2 p-4 rounded-lg bg-secondary/50">
                {emails.map((email) => (
                  <div
                    key={email}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-sm"
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
      </div>

      {/* Share link */}
      <div className="p-6 rounded-xl bg-card border border-border">
        <h2 className="font-display text-lg font-semibold mb-4">
          Share Your Invite Link
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Share this link with anyone you'd like to invite to Dawnz.
        </p>

        <div className="flex gap-2">
          <Input
            value={isLoadingLink ? 'Loading...' : inviteLink}
            readOnly
            className="h-12 bg-background border-border font-mono text-sm"
          />
          <Button
            onClick={copyInviteLink}
            variant="outline"
            className="h-12 px-4 border-border"
            disabled={isLoadingLink}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2 text-primary" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Benefits */}
      <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border border-primary/20">
        <h3 className="font-display text-lg font-semibold mb-4">
          Why invite friends?
        </h3>
        <ul className="space-y-3">
          {[
            'See what your friends are currently reading',
            'Get personalized recommendations from people you trust',
            'Share your reading reflections with your inner circle',
            'Join or create private book clubs together',
          ].map((benefit, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-primary" />
              </div>
              <span className="text-muted-foreground">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
