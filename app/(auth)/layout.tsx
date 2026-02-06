import { BookOpen } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background image/pattern */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238b4513' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/10" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <BookOpen className="h-10 w-10 text-primary transition-transform duration-300 group-hover:scale-110" />
            <span className="font-display text-3xl font-bold text-foreground">Dawnz</span>
          </Link>

          {/* Quote */}
          <div className="max-w-md">
            <blockquote className="font-display text-3xl font-semibold text-foreground leading-relaxed mb-6">
              "A reader lives a thousand lives before he dies. The man who never reads lives only one."
            </blockquote>
            <cite className="text-muted-foreground font-body">— George R.R. Martin</cite>
          </div>

          {/* Decorative element */}
          <div className="flex items-center gap-4 opacity-40">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
            <span className="text-primary text-xl">◆</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="font-display text-2xl font-bold text-foreground">Dawnz</span>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
