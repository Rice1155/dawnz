import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type SparkPrompt = {
  id: string
  prompt: string
  type: string
  genres: string[] | null
  active: boolean
}

// Default prompts in case database isn't set up yet
const defaultPrompts = [
  'What surprised you in your reading today?',
  'Share a line that stuck with you.',
  'How are you feeling about the story so far?',
  'What would you ask the author right now?',
  'Describe this book in one emoji.',
  'What\'s one thing you\'ve learned?',
  'Would you recommend this to a friend? Why?',
  'What character do you relate to most?',
  'Is this book what you expected?',
  'What\'s your favorite moment so far?',
  'What predictions do you have?',
  'How does this book make you feel?',
  'What themes are emerging?',
  'Who would love this book?',
  'What\'s the vibe of this book?',
]

// GET - Fetch prompts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const genres = searchParams.get('genres')?.split(',').filter(Boolean) || []
    const type = searchParams.get('type') // 'general', 'genre', 'daily', or null for all
    const random = searchParams.get('random') === 'true'
    const limit = parseInt(searchParams.get('limit') || '5')

    // Try to fetch from database
    let query = supabase
      .from('spark_prompts' as any)
      .select('*')
      .eq('active', true)

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching prompts:', error)
      // Fall back to default prompts
      const shuffled = [...defaultPrompts].sort(() => Math.random() - 0.5)
      return NextResponse.json({
        prompts: shuffled.slice(0, limit).map(p => ({ prompt: p, type: 'general' }))
      })
    }

    let filteredPrompts: SparkPrompt[] = (data as SparkPrompt[]) || []

    // Filter genre-specific prompts if genres provided
    if (genres.length > 0) {
      filteredPrompts = filteredPrompts.filter(p => {
        if (p.type === 'general' || p.type === 'daily') return true
        if (p.type === 'genre' && p.genres) {
          return p.genres.some((g: string) =>
            genres.some(userGenre =>
              g.toLowerCase().includes(userGenre.toLowerCase()) ||
              userGenre.toLowerCase().includes(g.toLowerCase())
            )
          )
        }
        return false
      })
    }

    // Randomize if requested
    if (random) {
      filteredPrompts = filteredPrompts.sort(() => Math.random() - 0.5)
    }

    // Limit results
    filteredPrompts = filteredPrompts.slice(0, limit)

    // If no prompts found, use defaults
    if (filteredPrompts.length === 0) {
      const shuffled = [...defaultPrompts].sort(() => Math.random() - 0.5)
      return NextResponse.json({
        prompts: shuffled.slice(0, limit).map(p => ({ prompt: p, type: 'general' }))
      })
    }

    return NextResponse.json({ prompts: filteredPrompts })
  } catch (error) {
    console.error('Error in prompts GET:', error)
    // Fall back to default prompts
    const shuffled = [...defaultPrompts].sort(() => Math.random() - 0.5)
    return NextResponse.json({
      prompts: shuffled.slice(0, 5).map(p => ({ prompt: p, type: 'general' }))
    })
  }
}
