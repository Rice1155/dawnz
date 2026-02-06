import Link from 'next/link'
import {
  BookOpen,
  Sparkles,
  MessageSquareQuote,
  Users,
  ArrowRight,
  Star,
  BookMarked,
  PenLine,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// Sample featured books for display
const featuredBooks = [
  {
    id: 1,
    title: 'The Midnight Library',
    author: 'Matt Haig',
    cover: 'https://covers.openlibrary.org/b/isbn/9780525559474-L.jpg',
  },
  {
    id: 2,
    title: 'Atomic Habits',
    author: 'James Clear',
    cover: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg',
  },
  {
    id: 3,
    title: 'Where the Crawdads Sing',
    author: 'Delia Owens',
    cover: 'https://covers.openlibrary.org/b/isbn/9780735219090-L.jpg',
  },
  {
    id: 4,
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    cover: 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg',
  },
  {
    id: 5,
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    cover: 'https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg',
  },
]

const features = [
  {
    icon: BookMarked,
    title: 'Track Your Journey',
    description: 'Organize your reading life with elegant shelves for books you\'re reading, want to read, and have finished.',
  },
  {
    icon: MessageSquareQuote,
    title: 'Reflect & Grow',
    description: 'AI-powered questions at each chapter help you engage deeply with every story and capture your thoughts.',
  },
  {
    icon: Users,
    title: 'Connect & Share',
    description: 'Discover what friends are reading, share reflections, and find your next favorite book together.',
  },
  {
    icon: PenLine,
    title: 'Private Journaling',
    description: 'Your reading reflections are private by default. Share only what you choose, when you choose.',
  },
]

export default function HomePage() {
  return (
    <div className="relative">
      {/* ════════════════════════════════════════════════════════════
          HERO SECTION
          ════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0">
          {/* Large ambient glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl" />

          {/* Floating book silhouettes - decorative */}
          <div className="absolute top-20 left-10 w-16 h-24 bg-primary/5 rounded transform -rotate-12 hidden lg:block" />
          <div className="absolute top-40 right-20 w-12 h-20 bg-accent/5 rounded transform rotate-6 hidden lg:block" />
          <div className="absolute bottom-40 left-20 w-14 h-22 bg-primary/5 rounded transform rotate-3 hidden lg:block" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center stagger-children">
            {/* Decorative element */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">A new chapter begins</span>
              </div>
            </div>

            {/* Main headline */}
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              Your Literary
              <br />
              <span className="text-gradient">Journey Awaits</span>
            </h1>

            {/* Subtitle */}
            <p className="max-w-2xl mx-auto text-xl text-muted-foreground mb-10 leading-relaxed">
              Track your reading, reflect on every chapter, and connect with fellow
              book lovers in an intimate literary community designed for deep engagement.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-body text-lg px-8 py-6 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
              >
                <Link href="/signup">
                  Begin Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="font-body text-lg px-8 py-6 rounded-lg border-border hover:bg-secondary/50"
              >
                <Link href="/browse">
                  Explore Books
                </Link>
              </Button>
            </div>
          </div>

          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-4 mt-16 mb-8 opacity-40">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-border" />
            <span className="text-primary">◆</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-border" />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          FEATURED BOOKS CAROUSEL
          ════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Discover Your Next Read
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From timeless classics to contemporary favorites, find books that resonate with your soul.
            </p>
          </div>

          {/* Books display */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 lg:gap-8 flex-wrap">
            {featuredBooks.map((book, index) => (
              <Link
                key={book.id}
                href={`/book/${book.id}`}
                className="group relative"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                <div className="relative w-32 sm:w-40 lg:w-48 transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:rotate-1">
                  {/* Book shadow */}
                  <div className="absolute inset-0 bg-black/40 rounded-sm transform translate-x-2 translate-y-2 blur-lg transition-all duration-500 group-hover:translate-x-4 group-hover:translate-y-4" />

                  {/* Book cover */}
                  <div className="relative aspect-[2/3] rounded-sm overflow-hidden book-shadow">
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <div>
                        <p className="text-white font-display text-sm font-semibold line-clamp-2">{book.title}</p>
                        <p className="text-white/70 text-xs">{book.author}</p>
                      </div>
                    </div>
                  </div>

                  {/* Spine effect */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-black/30 to-transparent" />
                </div>
              </Link>
            ))}
          </div>

          {/* Browse all link */}
          <div className="text-center mt-12">
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-body"
            >
              Browse all books
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          FEATURES SECTION
          ════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 bg-card/30">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a574' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Reading, <span className="text-gradient">Reimagined</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              More than just tracking—Dawnz helps you engage deeply with every book,
              turning reading into a journey of reflection and connection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="group relative p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm hover:bg-card transition-all duration-300 hover:border-primary/30"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="font-display text-xl font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Decorative corner */}
                  <div className="absolute top-0 right-0 w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute top-3 right-3 w-8 h-8 border-t border-r border-primary/30 rounded-tr-lg" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          READING REFLECTION PREVIEW
          ════════════════════════════════════════════════════════════ */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left - Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 mb-6">
                <MessageSquareQuote className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary">Unique to Dawnz</span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-6">
                Reflect as You Read
              </h2>

              <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                At every chapter, Dawnz invites you to pause and reflect with thoughtful
                questions tailored to your progress. Capture your thoughts, predictions,
                and emotions—creating a personal journal of your literary journey.
              </p>

              <ul className="space-y-4 mb-8">
                {[
                  'AI-generated questions specific to each book',
                  'Track your thoughts as the story unfolds',
                  'See what others thought (after you answer)',
                  'Build a beautiful reading memory',
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Star className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Link href="/signup">
                  Start Reflecting
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Right - Mock reflection card */}
            <div className="relative">
              {/* Glow behind card */}
              <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-3xl transform scale-90" />

              <div className="relative vintage-card rounded-2xl p-8 border border-border">
                {/* Book being read */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                  <div className="w-16 h-24 bg-muted rounded overflow-hidden book-shadow">
                    <img
                      src="https://covers.openlibrary.org/b/isbn/9780525559474-M.jpg"
                      alt="The Midnight Library"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold">The Midnight Library</p>
                    <p className="text-sm text-muted-foreground">Matt Haig</p>
                    <p className="text-xs text-primary mt-1">Chapter 12 · 45% complete</p>
                  </div>
                </div>

                {/* Question */}
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Reflection Question</p>
                  <p className="font-display text-xl leading-relaxed">
                    "If you could visit one life from Nora's infinite library, which path would
                    you choose to explore—and why?"
                  </p>
                </div>

                {/* Answer area mock */}
                <div className="bg-secondary/50 rounded-lg p-4 border border-border">
                  <p className="text-muted-foreground text-sm italic">
                    "I think I'd want to see the life where I pursued music. There's something
                    about the road not taken that feels both terrifying and..."
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">Your reflection · 2 hours ago</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-primary cursor-pointer hover:underline">Edit</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          FINAL CTA
          ════════════════════════════════════════════════════════════ */}
      <section className="relative py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Decorative elements */}
          <div className="flex items-center justify-center gap-4 mb-8 opacity-40">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-primary/50" />
            <BookOpen className="h-6 w-6 text-primary" />
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-primary/50" />
          </div>

          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Ready to Begin?
          </h2>

          <p className="text-muted-foreground text-xl mb-10 max-w-2xl mx-auto">
            Join a community of readers who believe every book deserves more than just a rating.
            Start your literary journey today.
          </p>

          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-body text-lg px-10 py-6 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
          >
            <Link href="/signup">
              Create Your Free Account
              <Sparkles className="ml-2 h-5 w-5" />
            </Link>
          </Button>

          {/* Trust note */}
          <p className="mt-6 text-sm text-muted-foreground">
            Free forever · No credit card required · Your data stays private
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          FOOTER
          ════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="font-display text-xl font-bold text-gradient">Dawnz</span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            </div>

            {/* Copyright */}
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Dawnz. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
