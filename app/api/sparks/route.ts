import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch sparks (user's own, by book, or by share token)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const bookId = searchParams.get('bookId')
    const shareToken = searchParams.get('shareToken')
    const view = searchParams.get('view') || 'date' // 'date' or 'book'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // If fetching by share token (public access)
    if (shareToken) {
      const { data: spark, error } = await supabase
        .from('sparks' as any)
        .select(`
          *,
          book:books(id, title, authors, cover_small, cover_medium),
          user:profiles(id, display_name, username, avatar_url)
        `)
        .eq('share_token', shareToken)
        .single()

      if (error || !spark) {
        return NextResponse.json({ error: 'Spark not found' }, { status: 404 })
      }

      return NextResponse.json({ spark })
    }

    // For user's own sparks, require authentication
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('sparks' as any)
      .select(`
        *,
        book:books(id, title, authors, cover_small, cover_medium)
      `, { count: 'exact' })
      .eq('user_id', user.id)

    // Filter by book if specified
    if (bookId) {
      query = query.eq('book_id', bookId)
    }

    // Order by created_at desc
    query = query.order('created_at', { ascending: false })

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: sparks, error, count } = await query

    if (error) {
      console.error('Error fetching sparks:', error)
      return NextResponse.json({ error: 'Failed to fetch sparks' }, { status: 500 })
    }

    return NextResponse.json({
      sparks: sparks || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit
    })
  } catch (error) {
    console.error('Error in sparks GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new spark
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, bookId, chapterNumber, quote, emoji, isPublic = false } = body

    // Validate content
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    if (content.length > 200) {
      return NextResponse.json({ error: 'Content must be 200 characters or less' }, { status: 400 })
    }

    // Create the spark
    const { data: spark, error } = await supabase
      .from('sparks' as any)
      .insert({
        user_id: user.id,
        book_id: bookId || null,
        chapter_number: chapterNumber || null,
        content: content.trim(),
        quote: quote?.trim() || null,
        emoji: emoji || null,
        is_public: isPublic,
      })
      .select(`
        *,
        book:books(id, title, authors, cover_small, cover_medium)
      `)
      .single()

    if (error) {
      console.error('Error creating spark:', error)
      return NextResponse.json({ error: 'Failed to create spark' }, { status: 500 })
    }

    return NextResponse.json({ spark })
  } catch (error) {
    console.error('Error in sparks POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update a spark
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sparkId, content, quote, emoji, isPublic, generateShareToken } = body

    if (!sparkId) {
      return NextResponse.json({ error: 'Spark ID is required' }, { status: 400 })
    }

    // Build update object
    const updates: any = { updated_at: new Date().toISOString() }

    if (content !== undefined) {
      if (content.length > 200) {
        return NextResponse.json({ error: 'Content must be 200 characters or less' }, { status: 400 })
      }
      updates.content = content.trim()
    }
    if (quote !== undefined) updates.quote = quote?.trim() || null
    if (emoji !== undefined) updates.emoji = emoji || null
    if (isPublic !== undefined) updates.is_public = isPublic

    // Generate share token if requested
    if (generateShareToken) {
      updates.share_token = crypto.randomUUID()
    }

    const { data: spark, error } = await supabase
      .from('sparks' as any)
      .update(updates)
      .eq('id', sparkId)
      .eq('user_id', user.id)
      .select(`
        *,
        book:books(id, title, authors, cover_small, cover_medium)
      `)
      .single()

    if (error) {
      console.error('Error updating spark:', error)
      return NextResponse.json({ error: 'Failed to update spark' }, { status: 500 })
    }

    return NextResponse.json({ spark })
  } catch (error) {
    console.error('Error in sparks PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a spark
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sparkId = searchParams.get('sparkId')

    if (!sparkId) {
      return NextResponse.json({ error: 'Spark ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('sparks' as any)
      .delete()
      .eq('id', sparkId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting spark:', error)
      return NextResponse.json({ error: 'Failed to delete spark' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in sparks DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
