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
      game_sessions: {
        Row: {
          id: string
          created_at: string
          settings: Json
          status: string
          start_time: string | null
          end_time: string | null
        }
        Insert: {
          id: string
          created_at?: string
          settings: Json
          status: string
          start_time?: string | null
          end_time?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          settings?: Json
          status?: string
          start_time?: string | null
          end_time?: string | null
        }
      }
      players: {
        Row: {
          id: string
          session_id: string
          nickname: string
          avatar: string
          position: Json
          score: number
          status: string
          created_at: string
        }
        Insert: {
          id: string
          session_id: string
          nickname: string
          avatar: string
          position: Json
          score?: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          nickname?: string
          avatar?: string
          position?: Json
          score?: number
          status?: string
          created_at?: string
        }
      }
      flags: {
        Row: {
          id: string
          session_id: string
          position: Json
          status: string
          captured_by: string | null
          captured_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          session_id: string
          position: Json
          status?: string
          captured_by?: string | null
          captured_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          position?: Json
          status?: string
          captured_by?: string | null
          captured_at?: string | null
          created_at?: string
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