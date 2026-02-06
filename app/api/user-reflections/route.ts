import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch user reflections (user's own, by book, or by share token)
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
      const { data: reflection, error } = await supabase
        .from('user_reflections')
        .select(`
          *,
          book:books(id, title, authors, cover_small, cover_medium),
          user:profiles(id, display_name, username, avatar_url)
        `)
        .eq('share_token', shareToken)
        .single()

      if (error || !reflection) {
        return NextResponse.json({ error: 'Reflection not found' }, { status: 404 })
      }

      return NextResponse.json({ reflection })
    }

    // For user's own reflections, require authentication
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('user_reflections')
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

    const { data: reflections, error, count } = await query

    if (error) {
      console.error('Error fetching user reflections:', error)
      return NextResponse.json({ error: 'Failed to fetch reflections' }, { status: 500 })
    }

    return NextResponse.json({
      reflections: reflections || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit
    })
  } catch (error) {
    console.error('Error in user-reflections GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new user reflection
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, bookId, quote, emoji, tags = [], isPublic = false } = body

    // Validate content
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Create the reflection
    const { data: reflection, error } = await supabase
      .from('user_reflections')
      .insert({
        user_id: user.id,
        book_id: bookId || null,
        content: content.trim(),
        quote: quote?.trim() || null,
        emoji: emoji || null,
        tags: tags,
        is_public: isPublic,
      })
      .select(`
        *,
        book:books(id, title, authors, cover_small, cover_medium)
      `)
      .single()

    if (error) {
      console.error('Error creating user reflection:', error)
      return NextResponse.json({ error: 'Failed to create reflection' }, { status: 500 })
    }

    return NextResponse.json({ reflection })
  } catch (error) {
    console.error('Error in user-reflections POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update a user reflection
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reflectionId, content, quote, emoji, tags, isPublic, generateShareToken } = body

    if (!reflectionId) {
      return NextResponse.json({ error: 'Reflection ID is required' }, { status: 400 })
    }

    // Build update object
    const updates: any = { updated_at: new Date().toISOString() }

    if (content !== undefined) {
      updates.content = content.trim()
    }
    if (quote !== undefined) updates.quote = quote?.trim() || null
    if (emoji !== undefined) updates.emoji = emoji || null
    if (tags !== undefined) updates.tags = tags
    if (isPublic !== undefined) updates.is_public = isPublic

    // Generate share token if requested
    if (generateShareToken) {
      updates.share_token = crypto.randomUUID()
    }

    const { data: reflection, error } = await supabase
      .from('user_reflections')
      .update(updates)
      .eq('id', reflectionId)
      .eq('user_id', user.id)
      .select(`
        *,
        book:books(id, title, authors, cover_small, cover_medium)
      `)
      .single()

    if (error) {
      console.error('Error updating user reflection:', error)
      return NextResponse.json({ error: 'Failed to update reflection' }, { status: 500 })
    }

    return NextResponse.json({ reflection })
  } catch (error) {
    console.error('Error in user-reflections PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a user reflection
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reflectionId = searchParams.get('reflectionId')

    if (!reflectionId) {
      return NextResponse.json({ error: 'Reflection ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_reflections')
      .delete()
      .eq('id', reflectionId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting user reflection:', error)
      return NextResponse.json({ error: 'Failed to delete reflection' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in user-reflections DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
