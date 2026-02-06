'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users,
  UserPlus,
  Search,
  BookOpen,
  MessageSquareQuote,
  Clock,
  Check,
  X,
  Mail,
  Loader2,
  UserMinus,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type TabType = 'friends' | 'requests' | 'activity'

type Friend = {
  id: string
  name: string
  username: string
  avatar: string | null
  currentlyReading: string | null
  booksThisYear: number
}

type PendingRequest = {
  friendshipId: string
  id: string
  name: string
  username: string
  avatar: string | null
  createdAt: string
}

type FriendActivity = {
  id: string
  user: string
  userId: string
  avatar: string | null
  action: string
  book: string
  bookId: string | null
  rating?: number
  time: string
  type: string
}

export default function FriendsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('friends')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [friendActivity, setFriendActivity] = useState<FriendActivity[]>([])
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchFriends()
  }, [])

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/friends')

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login?redirect=/friends')
          return
        }
        throw new Error('Failed to fetch friends')
      }

      const data = await response.json()
      setFriends(data.friends || [])
      setPendingRequests(data.pendingRequests || [])
      setFriendActivity(data.friendActivity || [])
    } catch (error) {
      console.error('Error fetching friends:', error)
      toast.error('Failed to load friends')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptRequest = async (friendshipId: string) => {
    setProcessingIds((prev) => new Set(prev).add(friendshipId))
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept', friendshipId }),
      })

      if (!response.ok) {
        throw new Error('Failed to accept request')
      }

      toast.success('Friend request accepted!')
      // Refresh the list
      fetchFriends()
    } catch (error) {
      console.error('Error accepting request:', error)
      toast.error('Failed to accept request')
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(friendshipId)
        return next
      })
    }
  }

  const handleDeclineRequest = async (friendshipId: string) => {
    setProcessingIds((prev) => new Set(prev).add(friendshipId))
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decline', friendshipId }),
      })

      if (!response.ok) {
        throw new Error('Failed to decline request')
      }

      setPendingRequests((prev) => prev.filter((r) => r.friendshipId !== friendshipId))
      toast.success('Friend request declined')
    } catch (error) {
      console.error('Error declining request:', error)
      toast.error('Failed to decline request')
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(friendshipId)
        return next
      })
    }
  }

  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    if (!confirm(`Are you sure you want to remove ${friendName} as a friend?`)) {
      return
    }

    setProcessingIds((prev) => new Set(prev).add(friendId))
    try {
      const response = await fetch(`/api/friends?friendId=${friendId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove friend')
      }

      setFriends((prev) => prev.filter((f) => f.id !== friendId))
      toast.success('Friend removed')
    } catch (error) {
      console.error('Error removing friend:', error)
      toast.error('Failed to remove friend')
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(friendId)
        return next
      })
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

  const filteredFriends = useMemo(() => {
    if (!searchQuery) return friends
    const query = searchQuery.toLowerCase()
    return friends.filter(
      (friend) =>
        friend.name.toLowerCase().includes(query) ||
        friend.username.toLowerCase().includes(query)
    )
  }, [friends, searchQuery])

  const tabs = [
    { id: 'friends' as const, label: 'Friends', count: friends.length },
    { id: 'requests' as const, label: 'Requests', count: pendingRequests.length },
    { id: 'activity' as const, label: 'Activity', count: null },
  ]

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Friends
          </h1>
          <p className="text-muted-foreground">
            Connect with readers who share your taste
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/friends/invite">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Friends
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-3 font-body text-sm font-medium transition-all duration-200 border-b-2 -mb-px cursor-pointer',
              activeTab === tab.id
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            )}
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span
                className={cn(
                  'ml-2 px-2 py-0.5 rounded-full text-xs',
                  activeTab === tab.id ? 'bg-primary/20' : 'bg-secondary'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <div className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends..."
              className="pl-10 bg-card border-border"
            />
          </div>

          {/* Friends List */}
          {filteredFriends.length > 0 ? (
            <div className="space-y-4">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300"
                >
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-xl font-medium flex-shrink-0 overflow-hidden">
                    {friend.avatar ? (
                      <img
                        src={friend.avatar}
                        alt={friend.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      friend.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold text-foreground">
                        {friend.name}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        @{friend.username}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      {friend.currentlyReading && (
                        <span className="flex items-center gap-1 truncate">
                          <BookOpen className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{friend.currentlyReading}</span>
                        </span>
                      )}
                      <span className="flex-shrink-0">{friend.booksThisYear} books this year</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleRemoveFriend(friend.id, friend.name)}
                    disabled={processingIds.has(friend.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    title="Remove friend"
                  >
                    {processingIds.has(friend.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserMinus className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No friends match your search' : 'No friends yet'}
              </p>
              {!searchQuery && (
                <Link
                  href="/friends/invite"
                  className="text-primary text-sm hover:underline mt-2 inline-block"
                >
                  Invite some friends to join
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {pendingRequests.length > 0 ? (
            pendingRequests.map((request) => (
              <div
                key={request.friendshipId}
                className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg font-medium flex-shrink-0 overflow-hidden">
                  {request.avatar ? (
                    <img
                      src={request.avatar}
                      alt={request.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    request.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-foreground">
                    {request.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    @{request.username} · {formatRelativeTime(request.createdAt)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => handleAcceptRequest(request.friendshipId)}
                    disabled={processingIds.has(request.friendshipId)}
                  >
                    {processingIds.has(request.friendshipId) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Accept</span>
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-border"
                    onClick={() => handleDeclineRequest(request.friendshipId)}
                    disabled={processingIds.has(request.friendshipId)}
                  >
                    <X className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Decline</span>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No pending friend requests</p>
            </div>
          )}
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          {friendActivity.length > 0 ? (
            friendActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border"
              >
                {/* Icon */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                    activity.type === 'reading' && 'bg-blue-500/10 text-blue-500',
                    activity.type === 'finished' && 'bg-green-500/10 text-green-500',
                    activity.type === 'reflection' && 'bg-purple-500/10 text-purple-500',
                    activity.type === 'rating' && 'bg-yellow-500/10 text-yellow-500',
                    activity.type === 'added' && 'bg-primary/10 text-primary'
                  )}
                >
                  {activity.type === 'reading' && <BookOpen className="h-5 w-5" />}
                  {activity.type === 'finished' && <Check className="h-5 w-5" />}
                  {activity.type === 'reflection' && (
                    <MessageSquareQuote className="h-5 w-5" />
                  )}
                  {activity.type === 'rating' && <Star className="h-5 w-5" />}
                  {activity.type === 'added' && <BookOpen className="h-5 w-5" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium text-foreground">{activity.user}</span>{' '}
                    <span className="text-muted-foreground">{activity.action}</span>{' '}
                    {activity.bookId ? (
                      <Link
                        href={`/book/${activity.bookId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {activity.book}
                      </Link>
                    ) : (
                      <span className="font-medium text-foreground">{activity.book}</span>
                    )}
                    {activity.rating && (
                      <span className="text-yellow-400 ml-1">
                        {'★'.repeat(activity.rating)}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(activity.time)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No friend activity yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add friends to see what they're reading
              </p>
            </div>
          )}
        </div>
      )}

      {/* Invite CTA */}
      <div className="mt-12 p-6 rounded-xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border border-primary/20 text-center">
        <Users className="h-10 w-10 text-primary mx-auto mb-4" />
        <h3 className="font-display text-xl font-bold mb-2">
          Reading is better together
        </h3>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
          Invite your book-loving friends to join Dawnz and discover what they're reading.
        </p>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/friends/invite">
            <Mail className="mr-2 h-4 w-4" />
            Invite Friends
          </Link>
        </Button>
      </div>
    </div>
  )
}
