import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get friends, pending requests, and activity
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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all' // 'friends', 'requests', 'activity', 'all'

    let friends: any[] = []
    let pendingRequests: any[] = []
    let friendActivity: any[] = []

    // Get accepted friendships
    if (type === 'friends' || type === 'all') {
      const { data: friendships } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id, created_at')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted')

      if (friendships && friendships.length > 0) {
        const friendIds = friendships.map((f) =>
          f.requester_id === user.id ? f.addressee_id : f.requester_id
        )

        // Get friend profiles
        const { data: friendProfiles } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url')
          .in('id', friendIds)

        // Get their currently reading books
        const { data: friendBooks } = await supabase
          .from('user_books')
          .select(`
            user_id,
            book:books (title)
          `)
          .in('user_id', friendIds)
          .eq('status', 'reading')

        // Get books read this year for each friend
        const currentYear = new Date().getFullYear()
        const { data: yearlyBooks } = await supabase
          .from('user_books')
          .select('user_id')
          .in('user_id', friendIds)
          .eq('status', 'finished')
          .gte('finished_at', `${currentYear}-01-01`)

        const currentlyReadingMap = new Map<string, string>()
        friendBooks?.forEach((fb: any) => {
          if (fb.book?.title && !currentlyReadingMap.has(fb.user_id)) {
            currentlyReadingMap.set(fb.user_id, fb.book.title)
          }
        })

        const booksThisYearMap = new Map<string, number>()
        yearlyBooks?.forEach((yb: any) => {
          booksThisYearMap.set(yb.user_id, (booksThisYearMap.get(yb.user_id) || 0) + 1)
        })

        friends = (friendProfiles || []).map((profile) => ({
          id: profile.id,
          name: profile.display_name || 'Friend',
          username: profile.username || profile.id.slice(0, 8),
          avatar: profile.avatar_url,
          currentlyReading: currentlyReadingMap.get(profile.id) || null,
          booksThisYear: booksThisYearMap.get(profile.id) || 0,
        }))
      }
    }

    // Get pending friend requests (where user is the addressee)
    if (type === 'requests' || type === 'all') {
      const { data: requests } = await supabase
        .from('friendships')
        .select('id, requester_id, created_at')
        .eq('addressee_id', user.id)
        .eq('status', 'pending')

      if (requests && requests.length > 0) {
        const requesterIds = requests.map((r) => r.requester_id)

        const { data: requesterProfiles } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url')
          .in('id', requesterIds)

        const profileMap = new Map(
          requesterProfiles?.map((p) => [p.id, p]) || []
        )

        pendingRequests = requests.map((request) => {
          const profile = profileMap.get(request.requester_id)
          return {
            friendshipId: request.id,
            id: request.requester_id,
            name: profile?.display_name || 'User',
            username: profile?.username || request.requester_id.slice(0, 8),
            avatar: profile?.avatar_url,
            createdAt: request.created_at,
          }
        })
      }
    }

    // Get friend activity
    if (type === 'activity' || type === 'all') {
      // First get friend IDs
      const { data: friendships } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted')

      if (friendships && friendships.length > 0) {
        const friendIds = friendships.map((f) =>
          f.requester_id === user.id ? f.addressee_id : f.requester_id
        )

        // Get recent book activity from friends
        const { data: recentBooks } = await supabase
          .from('user_books')
          .select(`
            id,
            user_id,
            status,
            rating,
            started_at,
            finished_at,
            updated_at,
            book:books (
              id,
              title
            )
          `)
          .in('user_id', friendIds)
          .order('updated_at', { ascending: false })
          .limit(20)

        // Get recent reflections from friends (public or shared with friends)
        const { data: recentReflections } = await supabase
          .from('reading_reflections')
          .select(`
            id,
            user_id,
            created_at,
            book:books (
              id,
              title
            )
          `)
          .in('user_id', friendIds)
          .or('is_public.eq.true,share_with_friends.eq.true')
          .not('answer', 'is', null)
          .order('created_at', { ascending: false })
          .limit(10)

        // Get profiles for all friends who have activity
        const activityUserIds = new Set<string>()
        recentBooks?.forEach((rb: any) => activityUserIds.add(rb.user_id))
        recentReflections?.forEach((rr: any) => activityUserIds.add(rr.user_id))

        const { data: activityProfiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', Array.from(activityUserIds))

        const profileMap = new Map(
          activityProfiles?.map((p) => [p.id, p]) || []
        )

        // Combine and sort activity
        const allActivity: any[] = []

        recentBooks?.forEach((rb: any) => {
          const profile = profileMap.get(rb.user_id)
          let action = ''
          let activityType = ''

          if (rb.status === 'reading' && rb.started_at) {
            action = 'started reading'
            activityType = 'reading'
          } else if (rb.status === 'finished' && rb.finished_at) {
            action = 'finished'
            activityType = 'finished'
          } else if (rb.status === 'want_to_read') {
            action = 'wants to read'
            activityType = 'added'
          } else if (rb.rating) {
            action = 'rated'
            activityType = 'rating'
          } else {
            return // Skip if no relevant action
          }

          allActivity.push({
            id: rb.id,
            user: profile?.display_name || 'Friend',
            userId: rb.user_id,
            avatar: profile?.avatar_url,
            action,
            book: rb.book?.title || 'Unknown Book',
            bookId: rb.book?.id,
            rating: rb.rating,
            time: rb.updated_at,
            type: activityType,
          })
        })

        recentReflections?.forEach((rr: any) => {
          const profile = profileMap.get(rr.user_id)
          allActivity.push({
            id: `reflection-${rr.id}`,
            user: profile?.display_name || 'Friend',
            userId: rr.user_id,
            avatar: profile?.avatar_url,
            action: 'reflected on',
            book: rr.book?.title || 'Unknown Book',
            bookId: rr.book?.id,
            time: rr.created_at,
            type: 'reflection',
          })
        })

        // Sort by time descending
        allActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        friendActivity = allActivity.slice(0, 15)
      }
    }

    return NextResponse.json({
      friends,
      pendingRequests,
      friendActivity,
      counts: {
        friends: friends.length,
        pendingRequests: pendingRequests.length,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/friends:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Send friend request or respond to one
export async function POST(request: NextRequest) {
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
    const { action, friendshipId, userId, username } = body

    if (action === 'send') {
      // Send a friend request
      let targetUserId = userId

      if (!targetUserId && username) {
        // Find user by username
        const { data: targetProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .single()

        if (!targetProfile) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          )
        }
        targetUserId = targetProfile.id
      }

      if (!targetUserId) {
        return NextResponse.json(
          { error: 'userId or username is required' },
          { status: 400 }
        )
      }

      if (targetUserId === user.id) {
        return NextResponse.json(
          { error: 'Cannot send friend request to yourself' },
          { status: 400 }
        )
      }

      // Check if friendship already exists
      const { data: existing } = await supabase
        .from('friendships')
        .select('id, status')
        .or(
          `and(requester_id.eq.${user.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${user.id})`
        )
        .single()

      if (existing) {
        if (existing.status === 'accepted') {
          return NextResponse.json(
            { error: 'Already friends' },
            { status: 400 }
          )
        } else if (existing.status === 'pending') {
          return NextResponse.json(
            { error: 'Friend request already pending' },
            { status: 400 }
          )
        }
      }

      const { data: friendship, error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          addressee_id: targetUserId,
          status: 'pending',
        })
        .select()
        .single()

      if (error) {
        console.error('Error sending friend request:', error)
        return NextResponse.json(
          { error: 'Failed to send friend request' },
          { status: 500 }
        )
      }

      return NextResponse.json({ friendship, message: 'Friend request sent' })
    }

    if (action === 'accept' || action === 'decline') {
      if (!friendshipId) {
        return NextResponse.json(
          { error: 'friendshipId is required' },
          { status: 400 }
        )
      }

      const newStatus = action === 'accept' ? 'accepted' : 'declined'

      const { data: friendship, error } = await supabase
        .from('friendships')
        .update({ status: newStatus })
        .eq('id', friendshipId)
        .eq('addressee_id', user.id)
        .eq('status', 'pending')
        .select()
        .single()

      if (error) {
        console.error('Error updating friend request:', error)
        return NextResponse.json(
          { error: 'Failed to update friend request' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        friendship,
        message: action === 'accept' ? 'Friend request accepted' : 'Friend request declined',
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in POST /api/friends:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a friend
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const friendId = searchParams.get('friendId')

    if (!friendId) {
      return NextResponse.json(
        { error: 'friendId is required' },
        { status: 400 }
      )
    }

    // Delete the friendship (either direction)
    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${user.id})`
      )

    if (error) {
      console.error('Error removing friend:', error)
      return NextResponse.json(
        { error: 'Failed to remove friend' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Friend removed' })
  } catch (error) {
    console.error('Error in DELETE /api/friends:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
