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
