import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get dashboard data for the home page
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

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .single()

    // Get currently reading books
    const { data: currentlyReading } = await supabase
      .from('user_books')
      .select(`
        id,
        current_page,
        current_chapter,
        updated_at,
        book:books (
          id,
          title,
          authors,
          cover_medium,
          page_count,
          chapter_count
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'reading')
      .order('updated_at', { ascending: false })
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
      .not('answer', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3)

    // Get yearly stats
    const currentYear = new Date().getFullYear()
    const startOfYear = `${currentYear}-01-01`

    // Books finished this year
    const { data: booksThisYear } = await supabase
      .from('user_books')
      .select(`
        id,
        book:books (
          page_count
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'finished')
      .gte('finished_at', startOfYear)

    // Total reflections
    const { count: totalReflections } = await supabase
      .from('reading_reflections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('answer', 'is', null)

    // Calculate pages read this year
    let pagesRead = 0
    if (booksThisYear) {
      booksThisYear.forEach((ub: any) => {
        if (ub.book?.page_count) {
          pagesRead += ub.book.page_count
        }
      })
    }

    // Get friends activity
    // First get friend IDs
    const { data: friendships } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted')

    let friendsActivity: any[] = []

    if (friendships && friendships.length > 0) {
      // Get all friend IDs
      const friendIds = friendships.map((f) =>
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      )

      // Get recent activity from friends (books they started/finished)
      const { data: friendBooks } = await supabase
        .from('user_books')
        .select(`
          id,
          status,
          started_at,
          finished_at,
          updated_at,
          user_id,
          book:books (
            id,
            title
          )
        `)
        .in('user_id', friendIds)
        .in('status', ['reading', 'finished'])
        .order('updated_at', { ascending: false })
        .limit(10)

      if (friendBooks && friendBooks.length > 0) {
        // Get profiles for these friends
        const friendUserIds = [...new Set(friendBooks.map((fb) => fb.user_id))]
        const { data: friendProfiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', friendUserIds)

        const profileMap = new Map(
          friendProfiles?.map((p) => [p.id, p]) || []
        )

        friendsActivity = friendBooks.slice(0, 5).map((fb: any) => {
          const profile = profileMap.get(fb.user_id)
          return {
            id: fb.id,
            name: profile?.display_name || 'Friend',
            avatar: profile?.avatar_url,
            action: fb.status === 'reading' ? 'started reading' : 'finished',
            book: fb.book?.title || 'Unknown Book',
            bookId: fb.book?.id,
            time: fb.updated_at,
          }
        })
      }
    }

    const stats = {
      booksThisYear: booksThisYear?.length || 0,
      currentStreak: 0, // Would need reading_sessions table to calculate
      totalReflections: totalReflections || 0,
      pagesRead,
    }

    return NextResponse.json({
      profile: {
        displayName: profile?.display_name || user.user_metadata?.full_name || null,
        avatarUrl: profile?.avatar_url || null,
      },
      currentlyReading: currentlyReading || [],
      recentReflections: recentReflections || [],
      friendsActivity,
      stats,
    })
  } catch (error) {
    console.error('Error in GET /api/dashboard:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
