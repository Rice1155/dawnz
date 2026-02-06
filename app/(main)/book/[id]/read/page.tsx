'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Settings,
  X,
  MessageSquareQuote,
  Sparkles,
  Send,
  Loader2,
  Check,
  Minus,
  Plus,
  Moon,
  Sun,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Mock book data (will be replaced with real data)
const mockBook = {
  id: '1',
  title: 'The Midnight Library',
  author: 'Matt Haig',
  chapters: 24,
  currentChapter: 12,
  genres: ['Fiction', 'Fantasy', 'Philosophy'],
  description: 'Between life and death there is a library, and within that library, the shelves go on forever.',
}

type ReflectionQuestion = {
  question: string
  context: string
}

export default function ReadingPage() {
  const params = useParams()
  const router = useRouter()
  const [showSettings, setShowSettings] = useState(false)
  const [showReflection, setShowReflection] = useState(false)
  const [reflectionAnswer, setReflectionAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [fontSize, setFontSize] = useState(18)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // AI Question state
  const [currentQuestion, setCurrentQuestion] = useState<ReflectionQuestion | null>(null)
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false)
  const [questionError, setQuestionError] = useState<string | null>(null)

  const book = mockBook

  const fetchReflectionQuestion = async () => {
    setIsLoadingQuestion(true)
    setQuestionError(null)

    try {
      const response = await fetch('/api/reflections/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          bookTitle: book.title,
          bookAuthor: book.author,
          chapterNumber: book.currentChapter,
          totalChapters: book.chapters,
          genres: book.genres,
          bookDescription: book.description,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate question')
      }

      const data = await response.json()
      setCurrentQuestion({
        question: data.question,
        context: data.context,
      })
    } catch (error) {
      console.error('Error fetching question:', error)
      setQuestionError('Unable to generate question. You can still share your thoughts!')
      // Fallback question
      setCurrentQuestion({
        question: 'What moment from this chapter stayed with you, and why?',
        context: 'Reflecting on memorable moments deepens our connection to stories.',
      })
    } finally {
      setIsLoadingQuestion(false)
    }
  }

  const handleChapterComplete = () => {
    setShowReflection(true)
    fetchReflectionQuestion()
  }

  const handleSubmitReflection = async () => {
    if (!reflectionAnswer.trim() || !currentQuestion) return

    setIsSubmitting(true)
    try {
      // Save to database via API
      const response = await fetch('/api/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          userBookId: book.id, // In real app, this would be the user_books record ID
          question: currentQuestion.question,
          answer: reflectionAnswer,
          chapterNumber: book.currentChapter,
          percentageComplete: Math.round((book.currentChapter / book.chapters) * 100),
          aiGenerated: true,
        }),
      })

      if (!response.ok) {
        console.error('Failed to save reflection')
      }

      setHasAnswered(true)
    } catch (error) {
      console.error('Error saving reflection:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkipReflection = () => {
    setShowReflection(false)
    setCurrentQuestion(null)
    // Navigate to next chapter
  }

  const handleContinue = () => {
    setShowReflection(false)
    setReflectionAnswer('')
    setHasAnswered(false)
    setCurrentQuestion(null)
    // Navigate to next chapter
  }

  const handleRegenerateQuestion = () => {
    fetchReflectionQuestion()
  }

  return (
    <div className={cn(
      'min-h-screen transition-colors duration-300',
      isDarkMode ? 'bg-[#1a1814] text-[#e8dcc8]' : 'bg-background text-foreground'
    )}>
      {/* Header */}
      <header className={cn(
        'fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-300',
        isDarkMode ? 'bg-[#1a1814]/95 border-[#3a3530]' : 'bg-background/95 border-border'
      )}>
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href={`/book/${book.id}`}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back to book</span>
          </Link>

          <div className="text-center">
            <p className="font-display text-sm font-medium truncate max-w-[200px] sm:max-w-none">
              {book.title}
            </p>
            <p className="text-xs text-muted-foreground">
              Chapter {book.currentChapter} of {book.chapters}
            </p>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(book.currentChapter / book.chapters) * 100}%` }}
          />
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className={cn(
          'fixed top-16 right-4 z-50 w-72 p-4 rounded-xl border shadow-lg transition-colors duration-300',
          isDarkMode ? 'bg-[#252220] border-[#3a3530]' : 'bg-card border-border'
        )}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold">Reading Settings</h3>
            <button onClick={() => setShowSettings(false)} className="cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Font Size */}
          <div className="mb-4">
            <label className="text-sm text-muted-foreground mb-2 block">
              Font Size
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                className="p-2 rounded-lg border border-border hover:bg-secondary/50 cursor-pointer"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="flex-1 text-center font-medium">{fontSize}px</span>
              <button
                onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                className="p-2 rounded-lg border border-border hover:bg-secondary/50 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">Theme</label>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={cn(
                'p-2 rounded-lg transition-colors cursor-pointer',
                isDarkMode ? 'bg-[#3a3530] text-[#e8dcc8]' : 'bg-secondary'
              )}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-20 pb-32 px-4 max-w-2xl mx-auto">
        {/* Chapter Title */}
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-center mb-8">
          Chapter {book.currentChapter}: The Infinite Library
        </h1>

        {/* Book Content (placeholder) */}
        <article
          className="prose prose-lg max-w-none font-body leading-relaxed"
          style={{ fontSize: `${fontSize}px` }}
        >
          <p className={isDarkMode ? 'text-[#e8dcc8]' : 'text-foreground'}>
            Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived. To see how things would be if you had made other choices.
          </p>
          <p className={isDarkMode ? 'text-[#e8dcc8]' : 'text-foreground'}>
            Nora Seed found herself standing in the middle of the library, surrounded by towering shelves that disappeared into an infinite darkness above. The air was thick with the smell of old paper and possibility.
          </p>
          <p className={isDarkMode ? 'text-[#e8dcc8]' : 'text-foreground'}>
            "Welcome," said a voice behind her. She turned to see an elderly woman with kind eyes and silver hair. "I'm Mrs Elm. I'm the librarian here."
          </p>
          <p className={isDarkMode ? 'text-[#e8dcc8]' : 'text-foreground'}>
            "Where is here?" Nora asked, her voice barely a whisper.
          </p>
          <p className={isDarkMode ? 'text-[#e8dcc8]' : 'text-foreground'}>
            "This is the Midnight Library. This place exists between life and death, between the living world and whatever comes next. And in this library, you have access to all the lives you could have lived."
          </p>
          <p className={isDarkMode ? 'text-[#e8dcc8]' : 'text-foreground'}>
            Nora looked at the endless rows of books. Each one contained a different version of her life, a different path she could have taken. Every decision she had ever made, every choice she had questioned—they all existed here, bound in leather and waiting to be opened.
          </p>
          <p className={isDarkMode ? 'text-[#e8dcc8]' : 'text-foreground'}>
            "How do I choose?" she asked.
          </p>
          <p className={isDarkMode ? 'text-[#e8dcc8]' : 'text-foreground'}>
            Mrs Elm smiled warmly. "That's the beauty of it, dear. You don't have to choose just one. You can explore as many as you like. Each book is a doorway to another version of yourself."
          </p>
          {/* ... more content would go here */}
        </article>

        {/* Chapter Navigation */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Button
            variant="outline"
            disabled={book.currentChapter === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <Button
            onClick={handleChapterComplete}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            Complete Chapter
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </main>

      {/* Reflection Modal */}
      {showReflection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={cn(
            'w-full max-w-lg rounded-2xl p-6 transition-colors duration-300',
            isDarkMode ? 'bg-[#252220]' : 'bg-card'
          )}>
            {!hasAnswered ? (
              <>
                {/* Question Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <MessageSquareQuote className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold">
                      Reflection Time
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Chapter {book.currentChapter} complete
                    </p>
                  </div>
                </div>

                {/* AI Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    <Sparkles className="h-3 w-3" />
                    AI-generated question
                  </div>
                  {currentQuestion && !isLoadingQuestion && (
                    <button
                      onClick={handleRegenerateQuestion}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 text-xs transition-colors cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" />
                      New question
                    </button>
                  )}
                </div>

                {/* Question - with loading state */}
                {isLoadingQuestion ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Crafting a thoughtful question...</p>
                    </div>
                  </div>
                ) : currentQuestion ? (
                  <>
                    <p className="font-display text-xl leading-relaxed mb-2">
                      "{currentQuestion.question}"
                    </p>
                    {currentQuestion.context && (
                      <p className="text-sm text-muted-foreground mb-6 italic">
                        {currentQuestion.context}
                      </p>
                    )}
                  </>
                ) : null}

                {questionError && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
                    {questionError}
                  </p>
                )}

                {/* Answer Input */}
                <textarea
                  value={reflectionAnswer}
                  onChange={(e) => setReflectionAnswer(e.target.value)}
                  placeholder="Share your thoughts..."
                  disabled={isLoadingQuestion}
                  className={cn(
                    'w-full h-32 p-4 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors',
                    isDarkMode
                      ? 'bg-[#1a1814] border-[#3a3530] text-[#e8dcc8] placeholder-[#6a6560]'
                      : 'bg-secondary/50 border-border',
                    isLoadingQuestion && 'opacity-50'
                  )}
                />

                {/* Actions */}
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={handleSkipReflection}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Skip for now
                  </button>
                  <Button
                    onClick={handleSubmitReflection}
                    disabled={!reflectionAnswer.trim() || isSubmitting || isLoadingQuestion}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Save Reflection
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">
                    Reflection Saved
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Your thoughts have been added to your reading journal.
                  </p>

                  {/* Preview of saved reflection */}
                  <div className={cn(
                    'p-4 rounded-lg text-left mb-6',
                    isDarkMode ? 'bg-[#1a1814]' : 'bg-secondary/50'
                  )}>
                    <p className="text-sm font-medium mb-2">Your answer:</p>
                    <p className="text-sm text-muted-foreground italic">
                      "{reflectionAnswer}"
                    </p>
                  </div>

                  <Button
                    onClick={handleContinue}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    Continue to Chapter {book.currentChapter + 1}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className={cn(
        'fixed bottom-0 left-0 right-0 border-t transition-colors duration-300',
        isDarkMode ? 'bg-[#1a1814]/95 border-[#3a3530]' : 'bg-background/95 border-border'
      )}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">
                {Math.round((book.currentChapter / book.chapters) * 100)}% complete
              </p>
              <p className="text-xs text-muted-foreground">
                {book.chapters - book.currentChapter} chapters remaining
              </p>
            </div>
          </div>
          <Link
            href={`/book/${book.id}/reflections`}
            className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
          >
            <MessageSquareQuote className="h-4 w-4" />
            My Reflections
          </Link>
        </div>
      </nav>
    </div>
  )
}
