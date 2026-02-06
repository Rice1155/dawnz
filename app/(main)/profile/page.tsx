'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  User,
  BookOpen,
  MessageSquareQuote,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Edit2,
  TrendingUp,
  Star,
  Users,
  BookMarked,
  ChevronRight,
  Loader2,
  X,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type TabType = 'shelves' | 'reflections' | 'stats'

type Profile = {
  id: string
  display_name: string | null
  username: string | null
  bio: string | null
  avatar_url: string | null
  location: string | null
  website: string | null
  reading_goal_yearly: number | null
  favorite_genres: string[]
  curious_topics: string[]
  onboarding_complete: boolean
  created_at: string
}

type Stats = {
  booksRead: number
  currentlyReading: number
  wantToRead: number
  dnf: number
  reflections: number
  friends: number
}

type YearlyStats = {
  booksRead: number
  pagesRead: number
  averageRating: number
  topGenres: string[]
}

type UserBook = {
  id: string
  current_page: number | null
  rating: number | null
  book: {
    id: string
    title: string
    authors: string[] | null
    cover_medium: string | null
    page_count: number | null
  } | null
}

type Reflection = {
  id: string
  question: string
  answer: string
  created_at: string
  book: {
    id: string
    title: string
  } | null
}

export default function ProfilePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('shelves')
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats>({
    booksRead: 0,
    currentlyReading: 0,
    wantToRead: 0,
    dnf: 0,
    reflections: 0,
    friends: 0,
  })
  const [yearlyStats, setYearlyStats] = useState<YearlyStats>({
    booksRead: 0,
    pagesRead: 0,
    averageRating: 0,
    topGenres: [],
  })
  const [currentlyReading, setCurrentlyReading] = useState<UserBook[]>([])
  const [recentlyFinished, setRecentlyFinished] = useState<UserBook[]>([])
  const [recentReflections, setRecentReflections] = useState<Reflection[]>([])

  // Edit form state
  const [editForm, setEditForm] = useState({
    display_name: '',
    username: '',
    bio: '',
    location: '',
    website: '',
    reading_goal_yearly: '',
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login?redirect=/profile')
          return
        }
        throw new Error('Failed to fetch profile')
      }

      const data = await response.json()

      setProfile(data.profile)
      setStats(data.stats)
      setYearlyStats(data.yearlyStats)
      setCurrentlyReading(data.currentlyReading)
      setRecentlyFinished(data.recentlyFinished)
      setRecentReflections(data.recentReflections)

      // Initialize edit form
      setEditForm({
        display_name: data.profile.display_name || '',
        username: data.profile.username || '',
        bio: data.profile.bio || '',
        location: data.profile.location || '',
        website: data.profile.website || '',
        reading_goal_yearly: data.profile.reading_goal_yearly?.toString() || '',
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: editForm.display_name || null,
          username: editForm.username || null,
          bio: editForm.bio || null,
          location: editForm.location || null,
          website: editForm.website || null,
          reading_goal_yearly: editForm.reading_goal_yearly
            ? parseInt(editForm.reading_goal_yearly)
            : null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const data = await response.json()
      setProfile(data.profile)
      setIsEditing(false)
      toast.success('Profile updated!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: 'shelves' as const, label: 'Shelves' },
    { id: 'reflections' as const, label: 'Reflections' },
    { id: 'stats' as const, label: 'Stats' },
  ]

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    )
  }

  const currentYear = new Date().getFullYear()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="relative mb-8">
        {/* Cover gradient */}
        <div className="h-32 rounded-t-xl bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30" />

        {/* Profile info */}
        <div className="relative px-6 pb-6">
          {/* Avatar */}
          <div className="absolute -top-12 left-6">
            <div className="w-24 h-24 rounded-full bg-card border-4 border-background flex items-center justify-center overflow-hidden">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || 'Profile'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Edit button */}
          <div className="flex justify-end pt-4">
            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  Save
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>

          {/* User info */}
          <div className="mt-8">
            {isEditing ? (
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="text-sm text-muted-foreground">Name</label>
                  <Input
                    value={editForm.display_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, display_name: e.target.value })
                    }
                    placeholder="Your name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Username</label>
                  <Input
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm({ ...editForm, username: e.target.value })
                    }
                    placeholder="username"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) =>
                      setEditForm({ ...editForm, bio: e.target.value })
                    }
                    placeholder="Tell us about yourself..."
                    className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-background resize-none"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Location</label>
                    <Input
                      value={editForm.location}
                      onChange={(e) =>
                        setEditForm({ ...editForm, location: e.target.value })
                      }
                      placeholder="City, Country"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Website</label>
                    <Input
                      value={editForm.website}
                      onChange={(e) =>
                        setEditForm({ ...editForm, website: e.target.value })
                      }
                      placeholder="https://..."
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">
                    Yearly Reading Goal
                  </label>
                  <Input
                    type="number"
                    value={editForm.reading_goal_yearly}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        reading_goal_yearly: e.target.value,
                      })
                    }
                    placeholder="Number of books"
                    className="mt-1"
                  />
                </div>
              </div>
            ) : (
              <>
                <h1 className="font-display text-2xl font-bold text-foreground">
                  {profile.display_name || 'Reader'}
                </h1>
                {profile.username && (
                  <p className="text-muted-foreground">@{profile.username}</p>
                )}

                {profile.bio && (
                  <p className="mt-4 text-foreground max-w-2xl">{profile.bio}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </span>
                  )}
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <LinkIcon className="h-4 w-4" />
                      Website
                    </a>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined{' '}
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Quick stats */}
          {!isEditing && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6">
              {[
                { label: 'Books Read', value: stats.booksRead, icon: BookOpen },
                { label: 'Reading', value: stats.currentlyReading, icon: BookOpen },
                { label: 'Want to Read', value: stats.wantToRead, icon: BookMarked },
                { label: 'Reflections', value: stats.reflections, icon: MessageSquareQuote },
                { label: 'Friends', value: stats.friends, icon: Users },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="text-center p-3 rounded-lg bg-card border border-border"
                >
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
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
          </button>
        ))}
      </div>

      {/* Shelves Tab */}
      {activeTab === 'shelves' && (
        <div className="space-y-6">
          {/* Currently Reading */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {currentlyReading.map((ub) => {
                  if (!ub.book) return null
                  const progress =
                    ub.current_page && ub.book.page_count
                      ? Math.round((ub.current_page / ub.book.page_count) * 100)
                      : 0

                  return (
                    <Link key={ub.id} href={`/book/${ub.book.id}`} className="group">
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 book-shadow bg-muted">
                        {ub.book.cover_medium ? (
                          <img
                            src={ub.book.cover_medium}
                            alt={ub.book.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-white text-xs mt-1">{progress}%</p>
                        </div>
                      </div>
                      <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {ub.book.title}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {ub.book.authors?.join(', ') || 'Unknown Author'}
                      </p>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-card rounded-xl border border-border">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-muted-foreground text-sm">
                  No books currently being read
                </p>
                <Link href="/browse" className="text-primary text-sm hover:underline mt-2 inline-block">
                  Browse books
                </Link>
              </div>
            )}
          </section>

          {/* Recently Finished */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Recently Finished
              </h2>
            </div>

            {recentlyFinished.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {recentlyFinished.map((ub) => {
                  if (!ub.book) return null
                  return (
                    <Link key={ub.id} href={`/book/${ub.book.id}`} className="group">
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 book-shadow bg-muted">
                        {ub.book.cover_medium ? (
                          <img
                            src={ub.book.cover_medium}
                            alt={ub.book.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-muted-foreground/30" />
                          </div>
                        )}
                        {ub.rating && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/60 rounded-full">
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-white text-xs">{ub.rating}</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {ub.book.title}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {ub.book.authors?.join(', ') || 'Unknown Author'}
                      </p>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-card rounded-xl border border-border">
                <Star className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-muted-foreground text-sm">No finished books yet</p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Reflections Tab */}
      {activeTab === 'reflections' && (
        <div className="space-y-4">
          {recentReflections.length > 0 ? (
            <>
              {recentReflections.map((reflection) => (
                <div
                  key={reflection.id}
                  className="p-4 rounded-xl bg-card border border-border"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <BookOpen className="h-3 w-3" />
                    <span>{reflection.book?.title || 'Unknown Book'}</span>
                    <span>·</span>
                    <span>{formatRelativeTime(reflection.created_at)}</span>
                  </div>
                  <p className="font-display text-sm font-medium text-foreground mb-2">
                    "{reflection.question}"
                  </p>
                  <p className="text-sm text-muted-foreground italic">
                    {reflection.answer}
                  </p>
                </div>
              ))}

              <Link
                href="/reflections"
                className="block text-center text-sm text-primary hover:text-primary/80"
              >
                View all reflections
              </Link>
            </>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <MessageSquareQuote className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">No reflections yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start reading a book and share your thoughts
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {currentYear} Reading Stats
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-secondary/50">
                <p className="text-3xl font-bold text-foreground">
                  {yearlyStats.booksRead}
                </p>
                <p className="text-sm text-muted-foreground">Books Read</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-secondary/50">
                <p className="text-3xl font-bold text-foreground">
                  {yearlyStats.pagesRead.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Pages Read</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-secondary/50">
                <p className="text-3xl font-bold text-foreground">
                  {yearlyStats.averageRating || '-'}
                </p>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-secondary/50">
                <p className="text-3xl font-bold text-foreground">
                  {stats.reflections}
                </p>
                <p className="text-sm text-muted-foreground">Reflections</p>
              </div>
            </div>
          </div>

          {yearlyStats.topGenres.length > 0 && (
            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="font-display text-lg font-semibold mb-4">Top Genres</h3>
              <div className="flex flex-wrap gap-2">
                {yearlyStats.topGenres.map((genre, index) => (
                  <span
                    key={`${genre}-${index}`}
                    className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm"
                  >
                    #{index + 1} {genre}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-display text-lg font-semibold mb-4">Reading Goal</h3>
            {profile.reading_goal_yearly ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {yearlyStats.booksRead} / {profile.reading_goal_yearly} books
                  </span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        (yearlyStats.booksRead / profile.reading_goal_yearly) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {yearlyStats.booksRead >= profile.reading_goal_yearly
                    ? 'Goal reached! Keep reading!'
                    : `${profile.reading_goal_yearly - yearlyStats.booksRead} books to go to reach your ${currentYear} goal`}
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm mb-2">
                  No reading goal set for {currentYear}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Set a Goal
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
