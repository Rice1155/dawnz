import { NextRequest, NextResponse } from 'next/server'
import { searchBooks } from '@/lib/open-library'
import { getBestCoverUrl, getCoverUrlsToTry } from '@/lib/book-covers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }

    const { results, total } = await searchBooks(query, { limit, offset })

    const books = results.map(result => ({
      key: result.key,
      title: result.title,
      authors: result.author_name || [],
      year: result.first_publish_year || null,
      coverUrl: getBestCoverUrl({
        isbns: result.isbn,
        coverId: result.cover_i,
      }),
      // Include fallback URLs for client-side fallback
      coverUrls: getCoverUrlsToTry({
        isbns: result.isbn,
        coverId: result.cover_i,
      }),
      pageCount: result.number_of_pages_median || null,
    }))

    return NextResponse.json({ books, total })
  } catch (error) {
    console.error('Error searching books:', error)
    return NextResponse.json(
      { error: 'Failed to search books' },
      { status: 500 }
    )
  }
}
