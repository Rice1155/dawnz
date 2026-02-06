import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

export const gemini = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

export type ReflectionPromptInput = {
  bookTitle: string
  bookAuthor: string
  chapterNumber: number
  totalChapters: number
  genres?: string[]
  bookDescription?: string
  previousReflections?: string[]
}

export async function generateReflectionQuestion(input: ReflectionPromptInput): Promise<{
  question: string
  context: string
}> {
  const {
    bookTitle,
    bookAuthor,
    chapterNumber,
    totalChapters,
    genres = [],
    bookDescription = '',
    previousReflections = [],
  } = input

  const progressPercentage = Math.round((chapterNumber / totalChapters) * 100)
  const isEarlyReading = progressPercentage < 30
  const isMidReading = progressPercentage >= 30 && progressPercentage < 70
  const isLateReading = progressPercentage >= 70

  const previousQuestionsContext = previousReflections.length > 0
    ? `\n\nPrevious reflection questions asked (avoid repeating similar themes):\n${previousReflections.slice(-3).map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : ''

  const prompt = `You are a thoughtful literary companion helping readers engage more deeply with books. Generate a single, meaningful reflection question for a reader who just completed a chapter.

Book: "${bookTitle}" by ${bookAuthor}
${bookDescription ? `Description: ${bookDescription}` : ''}
${genres.length > 0 ? `Genres: ${genres.join(', ')}` : ''}
Chapter: ${chapterNumber} of ${totalChapters} (${progressPercentage}% through the book)
${previousQuestionsContext}

Reading Stage Context:
${isEarlyReading ? '- Early in the book: Focus on first impressions, character introductions, setting, and initial hooks. Ask about expectations and early connections.' : ''}
${isMidReading ? '- Middle of the book: Focus on character development, plot complications, themes emerging, and personal connections to the story.' : ''}
${isLateReading ? '- Late in the book: Focus on resolution anticipation, character growth, thematic conclusions, and how the book might change their perspective.' : ''}

Guidelines:
- Create ONE thought-provoking question that encourages personal reflection
- The question should connect the book's themes to the reader's own life or worldview
- Avoid yes/no questions; encourage open-ended reflection
- Be warm and conversational, not academic
- Don't require specific plot knowledge (the reader may be at any point in this chapter)
- Make it feel personal and meaningful, not like homework

Respond in this exact JSON format:
{
  "question": "Your reflection question here",
  "context": "A brief 1-sentence note about why this question matters (shown to the reader)"
}`

  const result = await gemini.generateContent(prompt)
  const response = result.response
  const text = response.text()

  // Parse the JSON response
  try {
    // Extract JSON from the response (handle potential markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])
    return {
      question: parsed.question,
      context: parsed.context,
    }
  } catch (error) {
    console.error('Failed to parse Gemini response:', text)
    // Fallback question if parsing fails
    return {
      question: `What moment from this chapter resonated with you most, and why?`,
      context: `Reflecting on what moves us helps deepen our connection to stories.`,
    }
  }
}

export async function generateMultipleQuestions(
  input: ReflectionPromptInput,
  count: number = 3
): Promise<Array<{ question: string; context: string }>> {
  const prompt = `You are a thoughtful literary companion helping readers engage more deeply with books. Generate ${count} meaningful reflection questions for a reader who just completed a chapter.

Book: "${input.bookTitle}" by ${input.bookAuthor}
${input.bookDescription ? `Description: ${input.bookDescription}` : ''}
${input.genres && input.genres.length > 0 ? `Genres: ${input.genres.join(', ')}` : ''}
Chapter: ${input.chapterNumber} of ${input.totalChapters}

Guidelines:
- Create ${count} diverse, thought-provoking questions
- Each should encourage personal reflection and connect to the reader's life
- Vary the types: some about characters, some about themes, some about personal connections
- Avoid yes/no questions
- Be warm and conversational

Respond in this exact JSON format:
{
  "questions": [
    { "question": "Question 1", "context": "Why this matters" },
    { "question": "Question 2", "context": "Why this matters" },
    { "question": "Question 3", "context": "Why this matters" }
  ]
}`

  const result = await gemini.generateContent(prompt)
  const response = result.response
  const text = response.text()

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])
    return parsed.questions
  } catch (error) {
    console.error('Failed to parse Gemini response:', text)
    return [{
      question: `What moment from this chapter resonated with you most, and why?`,
      context: `Reflecting on what moves us helps deepen our connection to stories.`,
    }]
  }
}
