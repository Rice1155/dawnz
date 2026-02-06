import { NextRequest, NextResponse } from 'next/server'
import { getSubjectBooks, POPULAR_SUBJECTS } from '@/lib/open-library'
import { getBestCoverUrl, getCoverUrlsToTry } from '@/lib/book-covers'

// GET - Get books by category/subject from Open Library
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sort = (searchParams.get('sort') || 'editions') as 'editions' | 'old' | 'new' | 'rating'

    if (!category) {
      // Return list of available categories
      return NextResponse.json({ categories: POPULAR_SUBJECTS })
    }

    const data = await getSubjectBooks(category, {
      limit: Math.min(limit, 100),
      offset,
      sort,
    })

    const books = data.works.map((work) => ({
      key: work.key,
      title: work.title,
      authors: work.authors?.map((a) => a.name) || [],
      year: work.first_publish_year || null,
      coverUrl: getBestCoverUrl({ coverId: work.cover_id }),
      coverUrls: getCoverUrlsToTry({ coverId: work.cover_id }),
      editionCount: work.edition_count || 0,
    }))

    return NextResponse.json({
      books,
      total: data.work_count,
      categoryName: data.name,
      offset,
      hasMore: offset + books.length < data.work_count,
    })
  } catch (error) {
    console.error('Error fetching category books:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category books' },
      { status: 500 }
    )
  }
}
