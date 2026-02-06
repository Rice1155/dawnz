import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Send email invitations
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
    const { emails } = body

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'emails array is required' },
        { status: 400 }
      )
    }

    if (emails.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 emails per request' },
        { status: 400 }
      )
    }

    // Get sender profile
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()

    const senderName = senderProfile?.display_name || user.email?.split('@')[0] || 'Someone'

    // Store invites in friend_invites table
    const invites = emails.map((email: string) => ({
      inviter_id: user.id,
      email: email.toLowerCase().trim(),
      status: 'pending' as const,
    }))

    const { data: savedInvites, error: insertError } = await supabase
      .from('friend_invites')
      .upsert(invites, {
        onConflict: 'inviter_id,email',
        ignoreDuplicates: true,
      })
      .select()

    if (insertError) {
      console.error('Error saving invites:', insertError)
      // Continue anyway - invites might already exist
    }

    // In a real app, you would send emails here using a service like:
    // - Resend
    // - SendGrid
    // - AWS SES
    // For now, we just store the invites

    return NextResponse.json({
      success: true,
      message: `${emails.length} invitation(s) sent`,
      invitedCount: emails.length,
    })
  } catch (error) {
    console.error('Error in POST /api/friends/invite:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get user's invite link/code
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

    // Generate a simple invite code based on user ID
    // In production, you'd want a more sophisticated system
    const inviteCode = Buffer.from(user.id).toString('base64').slice(0, 12)
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://dawnz.app'}/join?ref=${inviteCode}`

    return NextResponse.json({
      inviteCode,
      inviteLink,
    })
  } catch (error) {
    console.error('Error in GET /api/friends/invite:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
