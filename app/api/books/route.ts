import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWork, getWorkEditions, getAuthor, getCoverUrl } from '@/lib/open-library'

// GET - Get book by ID or Open Library key
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const openLibraryKey = searchParams.get('openLibraryKey')

    const supabase = await createClient()

    if (id) {
      // Fetch from our database
      const { data: book, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !book) {
        return NextResponse.json(
          { error: 'Book not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ book })
    }

    if (openLibraryKey) {
      // First check if we have it in our database
      const { data: existingBook } = await supabase
        .from('books')
        .select('*')
        .eq('open_library_key', openLibraryKey)
        .single()

      if (existingBook) {
        return NextResponse.json({ book: existingBook })
      }

      // Fetch directly from Open Library using the work key
      try {
        const work = await getWork(openLibraryKey)

        // Get editions for additional data - fetch more to find the best one
        let bestEdition: any = null
        let allEditions: any[] = []
        try {
          allEditions = await getWorkEditions(openLibraryKey, 50)

          // Score editions to find the best one (prefer English editions with complete data)
          const scoredEditions = allEditions.map(e => {
            let score = 0
            // Prefer English language editions
            if (e.languages?.some((l: any) => l.key === '/languages/eng')) score += 10
            // Has page count
            if (e.number_of_pages) score += 5
            // Has ISBN-13
            if (e.isbn_13?.length) score += 3
            // Has ISBN-10
            if (e.isbn_10?.length) score += 2
            // Has publisher
            if (e.publishers?.length) score += 2
            // Has cover
            if (e.covers?.length) score += 1
            return { edition: e, score }
          })

          // Sort by score and get the best
          scoredEditions.sort((a, b) => b.score - a.score)
          bestEdition = scoredEditions[0]?.edition || null
        } catch (e) {
          console.error('Failed to fetch editions:', e)
        }

        // Get author names
        const authorNames: string[] = []
        if (work.authors) {
          for (const authorRef of work.authors.slice(0, 3)) {
            try {
              const author = await getAuthor(authorRef.author.key)
              authorNames.push(author.name)
            } catch (e) {
              console.error('Failed to fetch author:', e)
            }
          }
        }

        // Get cover ID - prefer work cover, then best edition cover
        const coverId = work.covers?.[0] || bestEdition?.covers?.[0]

        // Extract description
        let description = null
        if (work.description) {
          description = typeof work.description === 'string'
            ? work.description
            : work.description.value
        }

        // Extract subjects and genres
        const subjects = work.subjects?.slice(0, 20) || []
        const genreKeywords = [
          'fiction', 'non-fiction', 'nonfiction', 'mystery', 'thriller', 'romance',
          'fantasy', 'science fiction', 'horror', 'biography', 'memoir', 'history',
          'self-help', 'business', 'philosophy', 'poetry', 'drama', 'adventure',
        ]
        const genres = subjects
          .filter(s => genreKeywords.some(g => s.toLowerCase().includes(g)))
          .slice(0, 5)

        // Get the best page count from any edition
        const pageCount = bestEdition?.number_of_pages
          || allEditions.find(e => e.number_of_pages)?.number_of_pages
          || null

        // Get best ISBN-13 from any edition
        const isbn13 = bestEdition?.isbn_13?.[0]
          || allEditions.find(e => e.isbn_13?.length)?.isbn_13?.[0]
          || null

        // Get best ISBN-10 from any edition
        const isbn10 = bestEdition?.isbn_10?.[0]
          || allEditions.find(e => e.isbn_10?.length)?.isbn_10?.[0]
          || null

        // Get publisher from best edition or any edition
        const publisher = bestEdition?.publishers?.[0]
          || allEditions.find(e => e.publishers?.length)?.publishers?.[0]
          || null

        // Get first publish date - prefer earliest date
        const publishDate = bestEdition?.publish_date
          || allEditions.find(e => e.publish_date)?.publish_date
          || null

        return NextResponse.json({
          book: {
            open_library_key: openLibraryKey,
            title: work.title,
            authors: authorNames,
            description,
            cover_small: getCoverUrl(coverId, 'S'),
            cover_medium: getCoverUrl(coverId, 'M'),
            cover_large: getCoverUrl(coverId, 'L'),
            published_date: publishDate,
            publisher,
            page_count: pageCount,
            genres,
            subjects: subjects.slice(0, 10),
            isbn13,
            isbn10,
            language: 'en',
            source: 'open_library',
          },
          fromOpenLibrary: true,
        })
      } catch (error) {
        console.error('Failed to fetch from Open Library:', error)
        return NextResponse.json(
          { error: 'Book not found on Open Library' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Either "id" or "openLibraryKey" parameter is required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error fetching book:', error)
    return NextResponse.json(
      { error: 'Failed to fetch book' },
      { status: 500 }
    )
  }
}

// POST - Add a book to the database (and optionally to user's library)
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
    const { openLibraryKey, addToLibrary, status = 'want_to_read', rating } = body

    if (!openLibraryKey) {
      return NextResponse.json(
        { error: 'openLibraryKey is required' },
        { status: 400 }
      )
    }

    // Check if book already exists in our database
    let { data: existingBook } = await supabase
      .from('books')
      .select('*')
      .eq('open_library_key', openLibraryKey)
      .single()

    let book = existingBook

    if (!book) {
      // Fetch directly from Open Library using the work key
      try {
        const work = await getWork(openLibraryKey)

        // Get editions for additional data - fetch more to find the best one
        let bestEdition: any = null
        let allEditions: any[] = []
        try {
          allEditions = await getWorkEditions(openLibraryKey, 50)

          // Score editions to find the best one (prefer English editions with complete data)
          const scoredEditions = allEditions.map(e => {
            let score = 0
            if (e.languages?.some((l: any) => l.key === '/languages/eng')) score += 10
            if (e.number_of_pages) score += 5
            if (e.isbn_13?.length) score += 3
            if (e.isbn_10?.length) score += 2
            if (e.publishers?.length) score += 2
            if (e.covers?.length) score += 1
            return { edition: e, score }
          })

          scoredEditions.sort((a, b) => b.score - a.score)
          bestEdition = scoredEditions[0]?.edition || null
        } catch (e) {
          console.error('Failed to fetch editions:', e)
        }

        // Get author names
        const authorNames: string[] = []
        if (work.authors) {
          for (const authorRef of work.authors.slice(0, 3)) {
            try {
              const author = await getAuthor(authorRef.author.key)
              authorNames.push(author.name)
            } catch (e) {
              console.error('Failed to fetch author:', e)
            }
          }
        }

        // Get cover ID
        const coverId = work.covers?.[0] || bestEdition?.covers?.[0]

        // Extract description
        let description = null
        if (work.description) {
          description = typeof work.description === 'string'
            ? work.description
            : work.description.value
        }

        // Extract subjects and genres
        const subjects = work.subjects?.slice(0, 20) || []
        const genreKeywords = [
          'fiction', 'non-fiction', 'nonfiction', 'mystery', 'thriller', 'romance',
          'fantasy', 'science fiction', 'horror', 'biography', 'memoir', 'history',
          'self-help', 'business', 'philosophy', 'poetry', 'drama', 'adventure',
        ]
        const genres = subjects
          .filter(s => genreKeywords.some(g => s.toLowerCase().includes(g)))
          .slice(0, 5)

        // Get the best data from any edition
        const pageCount = bestEdition?.number_of_pages
          || allEditions.find(e => e.number_of_pages)?.number_of_pages
          || null
        const isbn13 = bestEdition?.isbn_13?.[0]
          || allEditions.find(e => e.isbn_13?.length)?.isbn_13?.[0]
          || null
        const isbn10 = bestEdition?.isbn_10?.[0]
          || allEditions.find(e => e.isbn_10?.length)?.isbn_10?.[0]
          || null
        const publisher = bestEdition?.publishers?.[0]
          || allEditions.find(e => e.publishers?.length)?.publishers?.[0]
          || null
        const publishDate = bestEdition?.publish_date
          || allEditions.find(e => e.publish_date)?.publish_date
          || null

        const { data: newBook, error: insertError } = await supabase
          .from('books')
          .insert({
            open_library_key: openLibraryKey,
            title: work.title,
            authors: authorNames,
            description,
            cover_small: getCoverUrl(coverId, 'S'),
            cover_medium: getCoverUrl(coverId, 'M'),
            cover_large: getCoverUrl(coverId, 'L'),
            published_date: publishDate,
            publisher,
            page_count: pageCount,
            genres,
            subjects: subjects.slice(0, 10),
            isbn13,
            isbn10,
            language: 'en',
            source: 'open_library',
          })
          .select()
          .single()

        if (insertError) {
          // Check if it's a duplicate (race condition)
          if (insertError.code === '23505') {
            const { data: existingBook } = await supabase
              .from('books')
              .select('*')
              .eq('open_library_key', openLibraryKey)
              .single()
            book = existingBook
          } else {
            throw insertError
          }
        } else {
          book = newBook
        }
      } catch (error) {
        console.error('Failed to fetch from Open Library:', error)
        return NextResponse.json(
          { error: 'Book not found on Open Library' },
          { status: 404 }
        )
      }
    }

    // Add to user's library if requested
    let userBook = null
    if (addToLibrary && book) {
      // Check if already in library
      const { data: existingUserBook } = await supabase
        .from('user_books')
        .select('*')
        .eq('user_id', user.id)
        .eq('book_id', book.id)
        .single()

      if (existingUserBook) {
        // If rating is provided, update the existing record with the rating
        if (rating !== undefined) {
          const { data: updatedUserBook, error: updateError } = await supabase
            .from('user_books')
            .update({ rating })
            .eq('id', existingUserBook.id)
            .select()
            .single()

          if (!updateError && updatedUserBook) {
            userBook = updatedUserBook
          } else {
            userBook = existingUserBook
          }
        } else {
          userBook = existingUserBook
        }
      } else {
        const { data: newUserBook, error: userBookError } = await supabase
          .from('user_books')
          .insert({
            user_id: user.id,
            book_id: book.id,
            status,
            started_at: status === 'reading' ? new Date().toISOString() : null,
            rating: rating !== undefined ? rating : null,
          })
          .select()
          .single()

        if (userBookError) {
          console.error('Error adding to library:', userBookError)
        } else {
          userBook = newUserBook
        }
      }
    }

    return NextResponse.json({
      book,
      userBook,
      addedToLibrary: !!userBook,
    })
  } catch (error) {
    console.error('Error adding book:', error)
    return NextResponse.json(
      { error: 'Failed to add book' },
      { status: 500 }
    )
  }
}
