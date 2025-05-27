export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      user_roles: {
        Row: {
          user_id: string
          role: 'admin' | 'user'
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          role?: 'admin' | 'user'
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          role?: 'admin' | 'user'
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 