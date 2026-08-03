export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type RowWithId = {
  id: string;
  created_at?: string;
  updated_at?: string;
};

export type Database = {
  public: {
    Tables: {
      markets: {
        Row: {
          code: string;
          locale: string;
          language: string;
          default_script: string | null;
          timezone: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          code: string;
          locale: string;
          language: string;
          default_script?: string | null;
          timezone: string;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["markets"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: "user" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          role?: "user" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      projects: {
        Row: RowWithId & {
          user_id: string;
          title: string;
          author_name: string;
          subtitle: string | null;
          description: string | null;
          book_type: string;
          language: string;
          tone: string;
          tier: string;
          status: string;
          dedication: string | null;
          cover_style: string | null;
        };
        Insert: Partial<RowWithId> & {
          user_id: string;
          title?: string;
          author_name: string;
          subtitle?: string | null;
          description?: string | null;
          book_type?: string;
          language?: string;
          tone?: string;
          tier?: string;
          status?: string;
          dedication?: string | null;
          cover_style?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };
      recordings: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          file_name: string;
          storage_bucket: string;
          storage_path: string;
          file_type: string;
          file_size: number;
          duration_seconds: number | null;
          status: string;
          uploaded_at: string;
          processed_at: string | null;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          file_name: string;
          storage_bucket?: string;
          storage_path: string;
          file_type: string;
          file_size?: number;
          duration_seconds?: number | null;
          status?: string;
          uploaded_at?: string;
          processed_at?: string | null;
          error_message?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["recordings"]["Insert"]>;
      };
      transcripts: {
        Row: RowWithId & {
          project_id: string;
          recording_id: string;
          user_id: string;
          raw_text: string;
          cleaned_text: string | null;
          language: string;
          confidence: number | null;
          detected_people: Json;
          detected_places: Json;
          detected_dates: Json;
          possible_issues: Json;
        };
        Insert: Partial<RowWithId> & {
          project_id: string;
          recording_id: string;
          user_id: string;
          raw_text: string;
          cleaned_text?: string | null;
          language?: string;
          confidence?: number | null;
          detected_people?: Json;
          detected_places?: Json;
          detected_dates?: Json;
          possible_issues?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["transcripts"]["Insert"]>;
      };
      chapters: {
        Row: RowWithId & {
          project_id: string;
          recording_id: string | null;
          transcript_id: string | null;
          user_id: string;
          title: string;
          summary: string;
          content: string;
          chapter_order: number;
          status: string;
          revision_number: number;
          key_people: Json;
          key_places: Json;
          key_dates: Json;
          unresolved_questions: Json;
          suggested_follow_up_questions: Json;
        };
        Insert: Partial<RowWithId> & {
          project_id: string;
          recording_id?: string | null;
          transcript_id?: string | null;
          user_id: string;
          title: string;
          summary?: string;
          content?: string;
          chapter_order?: number;
          status?: string;
          revision_number?: number;
          key_people?: Json;
          key_places?: Json;
          key_dates?: Json;
          unresolved_questions?: Json;
          suggested_follow_up_questions?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["chapters"]["Insert"]>;
      };
      chapter_revisions: {
        Row: {
          id: string;
          chapter_id: string;
          project_id: string;
          user_id: string;
          content: string;
          source: string;
          revision_number: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          chapter_id: string;
          project_id: string;
          user_id: string;
          content: string;
          source: string;
          revision_number: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["chapter_revisions"]["Insert"]>;
      };
      book_exports: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          type: string;
          storage_bucket: string;
          storage_path: string;
          status: string;
          created_at: string;
          completed_at: string | null;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          type: string;
          storage_bucket?: string;
          storage_path: string;
          status?: string;
          created_at?: string;
          completed_at?: string | null;
          error_message?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["book_exports"]["Insert"]>;
      };
      orders: {
        Row: RowWithId & {
          user_id: string;
          project_id: string;
          tier: string;
          amount: number | null;
          currency: string;
          status: string;
          stripe_session_id: string | null;
          customer_notes: string | null;
          admin_notes: string | null;
          requested_hardcover_copies: number | null;
          requires_human_review: boolean;
          requires_printing: boolean;
          requires_publishing_help: boolean;
        };
        Insert: Partial<RowWithId> & {
          user_id: string;
          project_id: string;
          tier: string;
          amount?: number | null;
          currency?: string;
          status?: string;
          stripe_session_id?: string | null;
          customer_notes?: string | null;
          admin_notes?: string | null;
          requested_hardcover_copies?: number | null;
          requires_human_review?: boolean;
          requires_printing?: boolean;
          requires_publishing_help?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      admin_notes: {
        Row: {
          id: string;
          project_id: string;
          admin_user_id: string;
          note: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          admin_user_id: string;
          note: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_notes"]["Insert"]>;
      };
      sources: {
        Row: RowWithId & {
          market_code: string;
          name: string;
          website_url: string;
          feed_or_page_url: string | null;
          source_type: string;
          language: string;
          category: string;
          official: boolean;
          active: boolean;
          parser_config: Json;
          last_checked_at: string | null;
          last_successful_import_at: string | null;
          last_error: string | null;
          verification_status: string;
        };
        Insert: {
          id?: string;
          market_code: string;
          name: string;
          website_url: string;
          feed_or_page_url?: string | null;
          source_type: string;
          language: string;
          category: string;
          official?: boolean;
          active?: boolean;
          parser_config?: Json;
          last_checked_at?: string | null;
          last_successful_import_at?: string | null;
          last_error?: string | null;
          verification_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sources"]["Insert"]>;
      };
      raw_articles: {
        Row: RowWithId & {
          market_code: string;
          source_id: string;
          title: string;
          original_url: string;
          publication_date: string | null;
          excerpt: string | null;
          author: string | null;
          category: string | null;
          image_url: string | null;
          guid: string | null;
          imported_at: string;
        };
        Insert: Partial<RowWithId> & {
          market_code: string;
          source_id: string;
          title: string;
          original_url: string;
          publication_date?: string | null;
          excerpt?: string | null;
          author?: string | null;
          category?: string | null;
          image_url?: string | null;
          guid?: string | null;
          imported_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["raw_articles"]["Insert"]>;
      };
      story_clusters: {
        Row: RowWithId & {
          market_code: string;
          canonical_headline: string;
          summary: string;
          key_points: Json;
          why_it_matters: string;
          what_happens_next: string | null;
          affected_audiences: string[];
          category: string;
          confidence_status: string;
          editorial_status: string;
          earliest_publication_at: string | null;
          latest_update_at: string | null;
        };
        Insert: Partial<RowWithId> & {
          market_code: string;
          canonical_headline: string;
          summary: string;
          key_points: Json;
          why_it_matters: string;
          what_happens_next?: string | null;
          affected_audiences?: string[];
          category: string;
          confidence_status?: string;
          editorial_status?: string;
          earliest_publication_at?: string | null;
          latest_update_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["story_clusters"]["Insert"]>;
      };
      story_sources: {
        Row: {
          story_cluster_id: string;
          raw_article_id: string;
        };
        Insert: {
          story_cluster_id: string;
          raw_article_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["story_sources"]["Insert"]>;
      };
      daily_briefs: {
        Row: RowWithId & {
          market_code: string;
          brief_date: string;
          status: string;
          estimated_minutes: number;
          published_at: string | null;
        };
        Insert: Partial<RowWithId> & {
          market_code: string;
          brief_date: string;
          status?: string;
          estimated_minutes?: number;
          published_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["daily_briefs"]["Insert"]>;
      };
      generated_social_content: {
        Row: RowWithId & {
          market_code: string;
          story_cluster_id: string | null;
          daily_brief_id: string | null;
          platform: string;
          format: string;
          payload: Json;
          status: string;
        };
        Insert: Partial<RowWithId> & {
          market_code: string;
          story_cluster_id?: string | null;
          daily_brief_id?: string | null;
          platform: string;
          format: string;
          payload: Json;
          status?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["generated_social_content"]["Insert"]
        >;
      };
      publishing_queue: {
        Row: RowWithId & {
          generated_social_content_id: string;
          platform: string;
          status: string;
          scheduled_for: string | null;
          error: string | null;
        };
        Insert: Partial<RowWithId> & {
          generated_social_content_id: string;
          platform: string;
          status?: string;
          scheduled_for?: string | null;
          error?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["publishing_queue"]["Insert"]>;
      };
      ingestion_logs: {
        Row: {
          id: string;
          market_code: string;
          source_id: string | null;
          status: string;
          records_found: number;
          records_imported: number;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          market_code: string;
          source_id?: string | null;
          status: string;
          records_found?: number;
          records_imported?: number;
          error?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ingestion_logs"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
