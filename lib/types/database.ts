export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          location: string | null
          website: string | null
          favorite_genres: string[]
          curious_topics: string[]
          reading_goal_yearly: number
          onboarding_complete: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          website?: string | null
          favorite_genres?: string[]
          curious_topics?: string[]
          reading_goal_yearly?: number
          onboarding_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          website?: string | null
          favorite_genres?: string[]
          curious_topics?: string[]
          reading_goal_yearly?: number
          onboarding_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          id: string
          isbn13: string | null
          isbn10: string | null
          open_library_key: string | null
          title: string
          authors: string[]
          description: string | null
          cover_small: string | null
          cover_medium: string | null
          cover_large: string | null
          published_date: string | null
          publisher: string | null
          page_count: number | null
          chapter_count: number | null
          genres: string[]
          subjects: string[]
          language: string
          source: string
          fetched_at: string
          created_at: string
        }
        Insert: {
          id?: string
          isbn13?: string | null
          isbn10?: string | null
          open_library_key?: string | null
          title: string
          authors?: string[]
          description?: string | null
          cover_small?: string | null
          cover_medium?: string | null
          cover_large?: string | null
          published_date?: string | null
          publisher?: string | null
          page_count?: number | null
          chapter_count?: number | null
          genres?: string[]
          subjects?: string[]
          language?: string
          source?: string
          fetched_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          isbn13?: string | null
          isbn10?: string | null
          open_library_key?: string | null
          title?: string
          authors?: string[]
          description?: string | null
          cover_small?: string | null
          cover_medium?: string | null
          cover_large?: string | null
          published_date?: string | null
          publisher?: string | null
          page_count?: number | null
          chapter_count?: number | null
          genres?: string[]
          subjects?: string[]
          language?: string
          source?: string
          fetched_at?: string
          created_at?: string
        }
        Relationships: []
      }
      user_books: {
        Row: {
          id: string
          user_id: string
          book_id: string
          status: 'want_to_read' | 'reading' | 'finished' | 'dnf'
          current_page: number
          current_chapter: number
          rating: number | null
          review: string | null
          started_at: string | null
          finished_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          status?: 'want_to_read' | 'reading' | 'finished' | 'dnf'
          current_page?: number
          current_chapter?: number
          rating?: number | null
          review?: string | null
          started_at?: string | null
          finished_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          status?: 'want_to_read' | 'reading' | 'finished' | 'dnf'
          current_page?: number
          current_chapter?: number
          rating?: number | null
          review?: string | null
          started_at?: string | null
          finished_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_books_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_books_book_id_fkey'
            columns: ['book_id']
            referencedRelation: 'books'
            referencedColumns: ['id']
          }
        ]
      }
      reading_reflections: {
        Row: {
          id: string
          user_id: string
          book_id: string
          user_book_id: string
          question: string
          answer: string | null
          chapter_number: number | null
          page_number: number | null
          percentage_complete: number | null
          is_public: boolean
          share_with_friends: boolean
          ai_generated: boolean
          likes_count: number
          created_at: string
          answered_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          user_book_id: string
          question: string
          answer?: string | null
          chapter_number?: number | null
          page_number?: number | null
          percentage_complete?: number | null
          is_public?: boolean
          share_with_friends?: boolean
          ai_generated?: boolean
          likes_count?: number
          created_at?: string
          answered_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          user_book_id?: string
          question?: string
          answer?: string | null
          chapter_number?: number | null
          page_number?: number | null
          percentage_complete?: number | null
          is_public?: boolean
          share_with_friends?: boolean
          ai_generated?: boolean
          likes_count?: number
          created_at?: string
          answered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'reading_reflections_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reading_reflections_book_id_fkey'
            columns: ['book_id']
            referencedRelation: 'books'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reading_reflections_user_book_id_fkey'
            columns: ['user_book_id']
            referencedRelation: 'user_books'
            referencedColumns: ['id']
          }
        ]
      }
      friendships: {
        Row: {
          id: string
          requester_id: string
          addressee_id: string
          status: 'pending' | 'accepted' | 'declined'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          addressee_id: string
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          addressee_id?: string
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'friendships_requester_id_fkey'
            columns: ['requester_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'friendships_addressee_id_fkey'
            columns: ['addressee_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      friend_invites: {
        Row: {
          id: string
          inviter_id: string
          email: string
          token: string
          status: 'pending' | 'accepted' | 'expired'
          created_at: string
          expires_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          inviter_id: string
          email: string
          token?: string
          status?: 'pending' | 'accepted' | 'expired'
          created_at?: string
          expires_at?: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          inviter_id?: string
          email?: string
          token?: string
          status?: 'pending' | 'accepted' | 'expired'
          created_at?: string
          expires_at?: string
          accepted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'friend_invites_inviter_id_fkey'
            columns: ['inviter_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      favorite_books: {
        Row: {
          id: string
          user_id: string
          book_id: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          display_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'favorite_books_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'favorite_books_book_id_fkey'
            columns: ['book_id']
            referencedRelation: 'books'
            referencedColumns: ['id']
          }
        ]
      }
      reflection_likes: {
        Row: {
          id: string
          user_id: string
          reflection_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reflection_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          reflection_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reflection_likes_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reflection_likes_reflection_id_fkey'
            columns: ['reflection_id']
            referencedRelation: 'reading_reflections'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      book_status: 'want_to_read' | 'reading' | 'finished' | 'dnf'
      friendship_status: 'pending' | 'accepted' | 'declined'
      invite_status: 'pending' | 'accepted' | 'expired'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Book = Database['public']['Tables']['books']['Row']
export type UserBook = Database['public']['Tables']['user_books']['Row']
export type ReadingReflection = Database['public']['Tables']['reading_reflections']['Row']
export type Friendship = Database['public']['Tables']['friendships']['Row']
export type FriendInvite = Database['public']['Tables']['friend_invites']['Row']
export type FavoriteBook = Database['public']['Tables']['favorite_books']['Row']
export type ReflectionLike = Database['public']['Tables']['reflection_likes']['Row']

// Extended types with relations
export type UserBookWithBook = UserBook & {
  book: Book
}

export type ReflectionWithBook = ReadingReflection & {
  book: Book
}
