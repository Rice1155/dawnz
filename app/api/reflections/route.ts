import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Save a new reflection
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
    const {
      bookId,
      userBookId,
      question,
      answer,
      chapterNumber,
      pageNumber,
      percentageComplete,
      isPublic = false,
      shareWithFriends = true,
      aiGenerated = true,
    } = body

    if (!bookId || !userBookId || !question || !answer) {
      return NextResponse.json(
        { error: 'Missing required fields: bookId, userBookId, question, answer' },
        { status: 400 }
      )
    }

    const { data: reflection, error } = await supabase
      .from('reading_reflections')
      .insert({
        user_id: user.id,
        book_id: bookId,
        user_book_id: userBookId,
        question,
        answer,
        chapter_number: chapterNumber,
        page_number: pageNumber,
        percentage_complete: percentageComplete,
        is_public: isPublic,
        share_with_friends: shareWithFriends,
        ai_generated: aiGenerated,
        answered_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving reflection:', error)
      return NextResponse.json(
        { error: 'Failed to save reflection' },
        { status: 500 }
      )
    }

    return NextResponse.json({ reflection })
  } catch (error) {
    console.error('Error in POST /api/reflections:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Fetch reflections for the current user
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
    const bookId = searchParams.get('bookId')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('reading_reflections')
      .select(`
        *,
        book:books (
          id,
          title,
          authors,
          cover_medium
        )
      `)
      .eq('user_id', user.id)
      .not('answer', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (bookId) {
      query = query.eq('book_id', bookId)
    }

    const { data: reflections, error } = await query

    if (error) {
      console.error('Error fetching reflections:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reflections' },
        { status: 500 }
      )
    }

    return NextResponse.json({ reflections })
  } catch (error) {
    console.error('Error in GET /api/reflections:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update a reflection
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
    const { reflectionId, answer, isPublic, shareWithFriends } = body

    if (!reflectionId) {
      return NextResponse.json(
        { error: 'reflectionId is required' },
        { status: 400 }
      )
    }

    const updates: Record<string, any> = {}

    if (answer !== undefined) {
      updates.answer = answer
      updates.answered_at = new Date().toISOString()
    }
    if (isPublic !== undefined) updates.is_public = isPublic
    if (shareWithFriends !== undefined) updates.share_with_friends = shareWithFriends

    const { data: reflection, error } = await supabase
      .from('reading_reflections')
      .update(updates)
      .eq('id', reflectionId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating reflection:', error)
      return NextResponse.json(
        { error: 'Failed to update reflection' },
        { status: 500 }
      )
    }

    return NextResponse.json({ reflection })
  } catch (error) {
    console.error('Error in PATCH /api/reflections:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a reflection
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
    const reflectionId = searchParams.get('reflectionId')

    if (!reflectionId) {
      return NextResponse.json(
        { error: 'reflectionId is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('reading_reflections')
      .delete()
      .eq('id', reflectionId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting reflection:', error)
      return NextResponse.json(
        { error: 'Failed to delete reflection' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/reflections:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
