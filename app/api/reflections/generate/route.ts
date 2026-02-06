import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Reflection question templates by genre/category
const questionTemplates = {
  general: [
    { question: "What moment from this chapter stayed with you, and why?", context: "Reflecting on memorable moments deepens our connection to stories." },
    { question: "How did your understanding of the main character change in this section?", context: "Characters reveal themselves gradually through their choices and reactions." },
    { question: "What emotions did this chapter evoke in you?", context: "Our emotional responses often reveal what resonates most deeply with us." },
    { question: "If you could ask one of the characters a question, what would it be?", context: "The questions we want to ask reveal what we're curious about." },
    { question: "What themes are emerging in the story so far?", context: "Identifying themes helps us understand the deeper meaning of a narrative." },
    { question: "Was there a line or passage that particularly struck you? What made it memorable?", context: "Beautiful prose often captures truths we recognize but couldn't articulate." },
    { question: "How does this story connect to your own life or experiences?", context: "Stories become meaningful when we find ourselves reflected in them." },
    { question: "What do you predict will happen next, and why?", context: "Making predictions keeps us actively engaged with the narrative." },
    { question: "What surprised you in this chapter?", context: "Surprises reveal our assumptions and the author's craft." },
    { question: "How would you describe the mood or atmosphere of this section?", context: "Atmosphere shapes our emotional experience of a story." },
  ],
  fiction: [
    { question: "How did the setting influence the events of this chapter?", context: "Place and time shape characters and possibilities." },
    { question: "What conflicts are building in the story?", context: "Conflict drives narrative and reveals character." },
    { question: "Which character do you find most compelling right now, and why?", context: "Our affinities reveal what we value in people." },
    { question: "How is the author building tension or suspense?", context: "Understanding craft deepens our appreciation of storytelling." },
    { question: "What moral dilemmas are the characters facing?", context: "Ethical questions make stories resonate beyond the page." },
  ],
  mystery: [
    { question: "What clues have you noticed so far?", context: "Active reading in mysteries means playing detective." },
    { question: "Who do you suspect, and what's your evidence?", context: "Building theories engages us in the puzzle." },
    { question: "What questions remain unanswered?", context: "Good mysteries make us hungry for answers." },
    { question: "How is the author misdirecting your attention?", context: "Recognizing red herrings sharpens our reading." },
  ],
  romance: [
    { question: "How is the relationship between the main characters evolving?", context: "Watching connections develop is the heart of romance." },
    { question: "What obstacles stand between the characters?", context: "Barriers create the tension that makes romance compelling." },
    { question: "What makes you root for (or against) this relationship?", context: "Our reactions reveal what we believe about love." },
  ],
  'science fiction': [
    { question: "How does this world differ from our own, and what does that reveal?", context: "Speculative fiction uses difference to illuminate truth." },
    { question: "What commentary on our society do you see in this story?", context: "Science fiction often critiques the present through the future." },
    { question: "How are the characters adapting to their extraordinary circumstances?", context: "Humanity persists even in inhuman conditions." },
  ],
  fantasy: [
    { question: "How does magic (or the supernatural) function in this world?", context: "Understanding magical systems enriches the reading experience." },
    { question: "What real-world parallels do you see in this fantasy setting?", context: "Fantasy often addresses reality through metaphor." },
    { question: "How are power dynamics at play in this chapter?", context: "Fantasy frequently explores questions of power and its use." },
  ],
  'non-fiction': [
    { question: "What new information or perspective did you gain?", context: "Non-fiction expands our understanding of the world." },
    { question: "Do you agree with the author's argument or interpretation? Why or why not?", context: "Critical engagement deepens learning." },
    { question: "How might you apply what you've learned?", context: "Knowledge becomes wisdom through application." },
    { question: "What questions does this raise for you?", context: "Good non-fiction sparks curiosity." },
  ],
  biography: [
    { question: "What aspect of this person's character stands out to you?", context: "Biographies reveal the complexity of real lives." },
    { question: "How did their circumstances shape who they became?", context: "Context helps us understand achievement." },
    { question: "What can you learn from their experiences?", context: "Other lives offer lessons for our own." },
  ],
  'self-help': [
    { question: "Which idea from this section resonates most with you?", context: "Resonance often indicates where growth is possible." },
    { question: "What would it look like to implement this advice in your life?", context: "Transformation requires moving from theory to practice." },
    { question: "What resistance or skepticism came up for you?", context: "Our objections often reveal important truths about ourselves." },
  ],
}

function getQuestionsForGenres(genres: string[]): typeof questionTemplates.general {
  const questions = [...questionTemplates.general]

  for (const genre of genres) {
    const normalizedGenre = genre.toLowerCase()
    for (const [key, genreQuestions] of Object.entries(questionTemplates)) {
      if (normalizedGenre.includes(key) || key.includes(normalizedGenre)) {
        questions.push(...genreQuestions)
      }
    }
  }

  return questions
}

function selectQuestion(
  questions: typeof questionTemplates.general,
  chapterNumber?: number,
  totalChapters?: number
): { question: string; context: string } {
  let pool = questions

  if (chapterNumber && totalChapters && chapterNumber / totalChapters > 0.8) {
    pool = [
      ...questions,
      { question: "How do you think the story will conclude?", context: "Anticipating endings keeps us invested in the journey." },
      { question: "Looking back, how have the characters grown?", context: "Character arcs reveal the story's deeper meaning." },
    ]
  }

  const index = Math.floor(Math.random() * pool.length)
  return pool[index]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bookTitle, genres = [], chapterNumber, totalChapters } = body

    const questions = getQuestionsForGenres(genres)
    const selected = selectQuestion(questions, chapterNumber, totalChapters)

    return NextResponse.json({
      question: selected.question,
      context: selected.context,
      bookTitle,
    })
  } catch (error) {
    console.error('Error generating reflection question:', error)
    return NextResponse.json(
      { error: 'Failed to generate question' },
      { status: 500 }
    )
  }
}
