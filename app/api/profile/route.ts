import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get user profile with stats
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    // Get book counts by status
    const { data: bookCounts } = await supabase
      .from('user_books')
      .select('status')
      .eq('user_id', user.id)

    const stats = {
      booksRead: 0,
      currentlyReading: 0,
      wantToRead: 0,
      dnf: 0,
    }

    if (bookCounts) {
      bookCounts.forEach((book) => {
        switch (book.status) {
          case 'finished':
            stats.booksRead++
            break
          case 'reading':
            stats.currentlyReading++
            break
          case 'want_to_read':
            stats.wantToRead++
            break
          case 'dnf':
            stats.dnf++
            break
        }
      })
    }

    // Get reflections count
    const { count: reflectionsCount } = await supabase
      .from('reading_reflections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Get friends count
    const { count: friendsCount } = await supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted')

    // Get currently reading books with details
    const { data: currentlyReading } = await supabase
      .from('user_books')
      .select(`
        *,
        book:books (
          id,
          title,
          authors,
          cover_medium,
          page_count
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'reading')
      .order('updated_at', { ascending: false })
      .limit(4)

    // Get recently finished books
    const { data: recentlyFinished } = await supabase
      .from('user_books')
      .select(`
        *,
        book:books (
          id,
          title,
          authors,
          cover_medium,
          page_count
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'finished')
      .order('finished_at', { ascending: false })
      .limit(4)

    // Get recent reflections
    const { data: recentReflections } = await supabase
      .from('reading_reflections')
      .select(`
        id,
        question,
        answer,
        created_at,
        book:books (
          id,
          title
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    // Get yearly stats
    const currentYear = new Date().getFullYear()
    const startOfYear = `${currentYear}-01-01`

    const { data: yearlyBooks } = await supabase
      .from('user_books')
      .select(`
        rating,
        book:books (
          page_count,
          genres
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'finished')
      .gte('finished_at', startOfYear)

    let yearlyStats = {
      booksRead: 0,
      pagesRead: 0,
      averageRating: 0,
      topGenres: [] as string[],
    }

    if (yearlyBooks && yearlyBooks.length > 0) {
      yearlyStats.booksRead = yearlyBooks.length

      let totalRating = 0
      let ratedBooks = 0
      const genreCounts: Record<string, number> = {}

      yearlyBooks.forEach((ub: any) => {
        if (ub.book?.page_count) {
          yearlyStats.pagesRead += ub.book.page_count
        }
        if (ub.rating) {
          totalRating += ub.rating
          ratedBooks++
        }
        if (ub.book?.genres) {
          ub.book.genres.forEach((genre: string) => {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1
          })
        }
      })

      if (ratedBooks > 0) {
        yearlyStats.averageRating = Math.round((totalRating / ratedBooks) * 10) / 10
      }

      // Get top 3 genres
      yearlyStats.topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([genre]) => genre)
    }

    return NextResponse.json({
      profile: profile || {
        id: user.id,
        display_name: user.user_metadata?.full_name || null,
        username: null,
        bio: null,
        avatar_url: null,
        location: null,
        website: null,
        reading_goal_yearly: null,
        favorite_genres: [],
        curious_topics: [],
        onboarding_complete: false,
        created_at: user.created_at,
      },
      stats: {
        ...stats,
        reflections: reflectionsCount || 0,
        friends: friendsCount || 0,
      },
      currentlyReading: currentlyReading || [],
      recentlyFinished: recentlyFinished || [],
      recentReflections: recentReflections || [],
      yearlyStats,
    })
  } catch (error) {
    console.error('Error in GET /api/profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      display_name,
      username,
      bio,
      avatar_url,
      location,
      website,
      reading_goal_yearly,
      favorite_genres,
    } = body

    const updates: Record<string, any> = {}

    if (display_name !== undefined) updates.display_name = display_name
    if (username !== undefined) updates.username = username
    if (bio !== undefined) updates.bio = bio
    if (avatar_url !== undefined) updates.avatar_url = avatar_url
    if (location !== undefined) updates.location = location
    if (website !== undefined) updates.website = website
    if (reading_goal_yearly !== undefined) updates.reading_goal_yearly = reading_goal_yearly
    if (favorite_genres !== undefined) updates.favorite_genres = favorite_genres

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    let profile

    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        )
      }
      profile = data
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          ...updates,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        return NextResponse.json(
          { error: 'Failed to create profile' },
          { status: 500 }
        )
      }
      profile = data
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error in PATCH /api/profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
