'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './auth-provider'

type OnboardingData = {
  genres: string[]
  topics: string[]
  favoriteBookIds: string[]
  inviteEmails: string[]
}

type OnboardingContextType = {
  data: OnboardingData
  setGenres: (genres: string[]) => void
  setTopics: (topics: string[]) => void
  setFavoriteBookIds: (bookIds: string[]) => void
  setInviteEmails: (emails: string[]) => void
  saveGenres: (genres: string[]) => Promise<void>
  saveTopics: (topics: string[]) => Promise<void>
  sendInvites: (emails: string[]) => Promise<number>
  completeOnboarding: () => Promise<void>
  isLoading: boolean
}

const OnboardingContext = createContext<OnboardingContextType | null>(null)

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, refreshProfile } = useAuth()

  const [data, setData] = useState<OnboardingData>({
    genres: [],
    topics: [],
    favoriteBookIds: [],
    inviteEmails: [],
  })
  const [isLoading, setIsLoading] = useState(false)

  const setGenres = useCallback((genres: string[]) => {
    setData(prev => ({ ...prev, genres }))
  }, [])

  const setTopics = useCallback((topics: string[]) => {
    setData(prev => ({ ...prev, topics }))
  }, [])

  const setFavoriteBookIds = useCallback((favoriteBookIds: string[]) => {
    setData(prev => ({ ...prev, favoriteBookIds }))
  }, [])

  const setInviteEmails = useCallback((inviteEmails: string[]) => {
    setData(prev => ({ ...prev, inviteEmails }))
  }, [])

  const saveGenres = useCallback(async (genres: string[]) => {
    if (!user) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ favorite_genres: genres })
        .eq('id', user.id)

      if (error) throw error
      setGenres(genres)
    } finally {
      setIsLoading(false)
    }
  }, [user, setGenres])

  const saveTopics = useCallback(async (topics: string[]) => {
    if (!user) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ curious_topics: topics })
        .eq('id', user.id)

      if (error) throw error
      setTopics(topics)
    } finally {
      setIsLoading(false)
    }
  }, [user, setTopics])

  const sendInvites = useCallback(async (emails: string[]): Promise<number> => {
    if (!user || emails.length === 0) return 0

    setIsLoading(true)
    try {
      const supabase = createClient()
      const invites = emails.map(email => ({
        inviter_id: user.id,
        email,
      }))

      const { data: inserted, error } = await supabase
        .from('friend_invites')
        .insert(invites)
        .select()

      if (error) {
        // Handle duplicate invites gracefully
        if (error.code === '23505') {
          console.warn('Some invites already exist')
        } else {
          throw error
        }
      }

      return inserted?.length || 0
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const completeOnboarding = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_complete: true })
        .eq('id', user.id)

      if (error) throw error

      await refreshProfile()
      router.push('/home')
    } finally {
      setIsLoading(false)
    }
  }, [user, refreshProfile, router])

  return (
    <OnboardingContext.Provider
      value={{
        data,
        setGenres,
        setTopics,
        setFavoriteBookIds,
        setInviteEmails,
        saveGenres,
        saveTopics,
        sendInvites,
        completeOnboarding,
        isLoading,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export const useOnboarding = () => {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}
