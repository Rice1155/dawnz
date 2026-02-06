import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get user's library
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
    const status = searchParams.get('status') // 'reading', 'want_to_read', 'finished', 'dnf'
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('user_books')
      .select(`
        *,
        book:books (
          id,
          title,
          authors,
          cover_small,
          cover_medium,
          page_count,
          genres
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (status && ['want_to_read', 'reading', 'finished', 'dnf'].includes(status)) {
      query = query.eq('status', status as 'want_to_read' | 'reading' | 'finished' | 'dnf')
    }

    const { data: userBooks, error } = await query

    if (error) {
      console.error('Error fetching library:', error)
      return NextResponse.json(
        { error: 'Failed to fetch library' },
        { status: 500 }
      )
    }

    return NextResponse.json({ userBooks })
  } catch (error) {
    console.error('Error in GET /api/books/library:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update a book in user's library
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
      userBookId,
      status,
      currentPage,
      currentChapter,
      rating,
      review,
    } = body

    if (!userBookId) {
      return NextResponse.json(
        { error: 'userBookId is required' },
        { status: 400 }
      )
    }

    const updates: Record<string, any> = {}

    if (status !== undefined) {
      updates.status = status
      if (status === 'reading' && !updates.started_at) {
        updates.started_at = new Date().toISOString()
      }
      if (status === 'finished') {
        updates.finished_at = new Date().toISOString()
      }
    }

    if (currentPage !== undefined) updates.current_page = currentPage
    if (currentChapter !== undefined) updates.current_chapter = currentChapter
    if (rating !== undefined) updates.rating = rating
    if (review !== undefined) updates.review = review

    const { data: userBook, error } = await supabase
      .from('user_books')
      .update(updates)
      .eq('id', userBookId)
      .eq('user_id', user.id)
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
      .single()

    if (error) {
      console.error('Error updating user book:', error)
      return NextResponse.json(
        { error: 'Failed to update book' },
        { status: 500 }
      )
    }

    return NextResponse.json({ userBook })
  } catch (error) {
    console.error('Error in PATCH /api/books/library:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a book from user's library
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
    const userBookId = searchParams.get('userBookId')

    if (!userBookId) {
      return NextResponse.json(
        { error: 'userBookId is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('user_books')
      .delete()
      .eq('id', userBookId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error removing book:', error)
      return NextResponse.json(
        { error: 'Failed to remove book' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/books/library:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
