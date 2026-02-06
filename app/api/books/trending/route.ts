import { NextRequest, NextResponse } from 'next/server'
import { getTrendingBooks } from '@/lib/open-library'
import { getBestCoverUrl, getCoverUrlsToTry } from '@/lib/book-covers'

// GET - Get trending books from Open Library
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') || 'daily') as 'daily' | 'weekly' | 'monthly' | 'yearly'
    const limit = parseInt(searchParams.get('limit') || '20')

    const works = await getTrendingBooks(period, Math.min(limit, 100))

    const books = works.map((work) => ({
      key: work.key,
      title: work.title,
      authors: work.author_name || [],
      year: work.first_publish_year || null,
      coverUrl: getBestCoverUrl({ coverId: work.cover_i }),
      coverUrls: getCoverUrlsToTry({ coverId: work.cover_i }),
      editionCount: work.edition_count || 0,
    }))

    return NextResponse.json({ books, total: books.length })
  } catch (error) {
    console.error('Error fetching trending books:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trending books' },
      { status: 500 }
    )
  }
}
