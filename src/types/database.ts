export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          author_id: string
          bookmarks_count: number | null
          category_id: string | null
          comments_count: number | null
          content: string
          country: string | null
          cover_image: string | null
          created_at: string | null
          excerpt: string | null
          id: string
          is_featured: boolean | null
          knowledge_item_id: string | null
          language: string | null
          likes_count: number | null
          published_at: string | null
          reading_time: number | null
          references_list: string[] | null
          slug: string
          status: Database["public"]["Enums"]["article_status"] | null
          time_period: string | null
          title: string
          updated_at: string | null
          views_count: number | null
          youtube_embed: string | null
        }
        Insert: {
          author_id: string
          bookmarks_count?: number | null
          category_id?: string | null
          comments_count?: number | null
          content: string
          country?: string | null
          cover_image?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          is_featured?: boolean | null
          knowledge_item_id?: string | null
          language?: string | null
          likes_count?: number | null
          published_at?: string | null
          reading_time?: number | null
          references_list?: string[] | null
          slug: string
          status?: Database["public"]["Enums"]["article_status"] | null
          time_period?: string | null
          title: string
          updated_at?: string | null
          views_count?: number | null
          youtube_embed?: string | null
        }
        Update: {
          author_id?: string
          bookmarks_count?: number | null
          category_id?: string | null
          comments_count?: number | null
          content?: string
          country?: string | null
          cover_image?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          is_featured?: boolean | null
          knowledge_item_id?: string | null
          language?: string | null
          likes_count?: number | null
          published_at?: string | null
          reading_time?: number | null
          references_list?: string[] | null
          slug?: string
          status?: Database["public"]["Enums"]["article_status"] | null
          time_period?: string | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
          youtube_embed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      authors: {
        Row: {
          affiliations: string[] | null
          created_at: string | null
          id: string
          metadata: Json | null
          name: string
          openalex_id: string | null
          orcid: string | null
          person_id: string | null
        }
        Insert: {
          affiliations?: string[] | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name: string
          openalex_id?: string | null
          orcid?: string | null
          person_id?: string | null
        }
        Update: {
          affiliations?: string[] | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          openalex_id?: string | null
          orcid?: string | null
          person_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "authors_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          articles_count: number | null
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          articles_count?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          articles_count?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_items: {
        Row: {
          added_at: string | null
          article_id: string
          collection_id: string
        }
        Insert: {
          added_at?: string | null
          article_id: string
          collection_id: string
        }
        Update: {
          added_at?: string | null
          article_id?: string
          collection_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          articles_count: number | null
          category_id: string | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          owner_id: string
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          articles_count?: number | null
          category_id?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          owner_id: string
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          articles_count?: number | null
          category_id?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          owner_id?: string
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          article_id: string
          author_id: string
          content: string
          created_at: string | null
          id: string
          is_edited: boolean | null
          likes_count: number | null
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          article_id: string
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          is_edited?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          article_id?: string
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_edited?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      cultures: {
        Row: {
          created_at: string | null
          geographic_distribution: string[] | null
          historical_period: string | null
          id: string
          knowledge_item_id: string | null
          linguistic_affiliations: string[] | null
          metadata: Json | null
          name: string
          traditions_summary: string | null
        }
        Insert: {
          created_at?: string | null
          geographic_distribution?: string[] | null
          historical_period?: string | null
          id?: string
          knowledge_item_id?: string | null
          linguistic_affiliations?: string[] | null
          metadata?: Json | null
          name: string
          traditions_summary?: string | null
        }
        Update: {
          created_at?: string | null
          geographic_distribution?: string[] | null
          historical_period?: string | null
          id?: string
          knowledge_item_id?: string | null
          linguistic_affiliations?: string[] | null
          metadata?: Json | null
          name?: string
          traditions_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cultures_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: true
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_content: string
          chunk_index: number
          created_at: string | null
          id: string
          knowledge_item_id: string
          metadata: Json | null
          token_count: number
        }
        Insert: {
          chunk_content: string
          chunk_index: number
          created_at?: string | null
          id?: string
          knowledge_item_id: string
          metadata?: Json | null
          token_count: number
        }
        Update: {
          chunk_content?: string
          chunk_index?: number
          created_at?: string | null
          id?: string
          knowledge_item_id?: string
          metadata?: Json | null
          token_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      embeddings: {
        Row: {
          chunk_id: string
          created_at: string | null
          embedding: string
          id: string
          model_name: string
        }
        Insert: {
          chunk_id: string
          created_at?: string | null
          embedding: string
          id?: string
          model_name?: string
        }
        Update: {
          chunk_id?: string
          created_at?: string | null
          embedding?: string
          id?: string
          model_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "embeddings_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: true
            referencedRelation: "document_chunks"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          end_year: number | null
          event_type: string | null
          historical_significance: string | null
          id: string
          is_approximate_date: boolean | null
          knowledge_item_id: string | null
          metadata: Json | null
          name: string
          place_id: string | null
          start_year: number | null
        }
        Insert: {
          created_at?: string | null
          end_year?: number | null
          event_type?: string | null
          historical_significance?: string | null
          id?: string
          is_approximate_date?: boolean | null
          knowledge_item_id?: string | null
          metadata?: Json | null
          name: string
          place_id?: string | null
          start_year?: number | null
        }
        Update: {
          created_at?: string | null
          end_year?: number | null
          event_type?: string | null
          historical_significance?: string | null
          id?: string
          is_approximate_date?: boolean | null
          knowledge_item_id?: string | null
          metadata?: Json | null
          name?: string
          place_id?: string | null
          start_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: true
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_errors: {
        Row: {
          created_at: string | null
          error_code: string | null
          error_message: string
          external_id: string | null
          id: string
          payload_sample: Json | null
          run_id: string
          stack_trace: string | null
          stage: Database["public"]["Enums"]["ingestion_stage"]
        }
        Insert: {
          created_at?: string | null
          error_code?: string | null
          error_message: string
          external_id?: string | null
          id?: string
          payload_sample?: Json | null
          run_id: string
          stack_trace?: string | null
          stage: Database["public"]["Enums"]["ingestion_stage"]
        }
        Update: {
          created_at?: string | null
          error_code?: string | null
          error_message?: string
          external_id?: string | null
          id?: string
          payload_sample?: Json | null
          run_id?: string
          stack_trace?: string | null
          stage?: Database["public"]["Enums"]["ingestion_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_errors_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "ingestion_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_items: {
        Row: {
          created_at: string | null
          error_details: string | null
          external_id: string
          id: string
          raw_payload: Json
          run_id: string
          status: string
          target_knowledge_item_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_details?: string | null
          external_id: string
          id?: string
          raw_payload: Json
          run_id: string
          status: string
          target_knowledge_item_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_details?: string | null
          external_id?: string
          id?: string
          raw_payload?: Json
          run_id?: string
          status?: string
          target_knowledge_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_items_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "ingestion_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingestion_items_target_knowledge_item_id_fkey"
            columns: ["target_knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_runs: {
        Row: {
          end_time: string | null
          error_summary: string | null
          id: string
          ingestion_source_id: string
          logs: Json | null
          records_discovered: number | null
          records_failed: number | null
          records_imported: number | null
          records_skipped: number | null
          records_updated: number | null
          start_time: string | null
          status: Database["public"]["Enums"]["ingestion_status"] | null
        }
        Insert: {
          end_time?: string | null
          error_summary?: string | null
          id?: string
          ingestion_source_id: string
          logs?: Json | null
          records_discovered?: number | null
          records_failed?: number | null
          records_imported?: number | null
          records_skipped?: number | null
          records_updated?: number | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["ingestion_status"] | null
        }
        Update: {
          end_time?: string | null
          error_summary?: string | null
          id?: string
          ingestion_source_id?: string
          logs?: Json | null
          records_discovered?: number | null
          records_failed?: number | null
          records_imported?: number | null
          records_skipped?: number | null
          records_updated?: number | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["ingestion_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_runs_ingestion_source_id_fkey"
            columns: ["ingestion_source_id"]
            isOneToOne: false
            referencedRelation: "ingestion_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_sources: {
        Row: {
          config: Json
          connector_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          name: string
          source_id: string
          sync_interval_hours: number | null
        }
        Insert: {
          config?: Json
          connector_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name: string
          source_id: string
          sync_interval_hours?: number | null
        }
        Update: {
          config?: Json
          connector_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name?: string
          source_id?: string
          sync_interval_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_sources_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          id: string
          knowledge_item_id: string | null
          metadata: Json | null
          name: string
          openalex_id: string | null
          ror_id: string | null
          website: string | null
          wikidata_id: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          knowledge_item_id?: string | null
          metadata?: Json | null
          name: string
          openalex_id?: string | null
          ror_id?: string | null
          website?: string | null
          wikidata_id?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          knowledge_item_id?: string | null
          metadata?: Json | null
          name?: string
          openalex_id?: string | null
          ror_id?: string | null
          website?: string | null
          wikidata_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institutions_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: true
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      kingdoms_or_states: {
        Row: {
          capital_place_id: string | null
          created_at: string | null
          dissolution_year: number | null
          founding_year: number | null
          id: string
          knowledge_item_id: string | null
          metadata: Json | null
          modern_countries: string[] | null
          name: string
          notable_rulers: string[] | null
          political_structure: string | null
        }
        Insert: {
          capital_place_id?: string | null
          created_at?: string | null
          dissolution_year?: number | null
          founding_year?: number | null
          id?: string
          knowledge_item_id?: string | null
          metadata?: Json | null
          modern_countries?: string[] | null
          name: string
          notable_rulers?: string[] | null
          political_structure?: string | null
        }
        Update: {
          capital_place_id?: string | null
          created_at?: string | null
          dissolution_year?: number | null
          founding_year?: number | null
          id?: string
          knowledge_item_id?: string | null
          metadata?: Json | null
          modern_countries?: string[] | null
          name?: string
          notable_rulers?: string[] | null
          political_structure?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kingdoms_or_states_capital_place_id_fkey"
            columns: ["capital_place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kingdoms_or_states_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: true
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_item_tags: {
        Row: {
          created_at: string | null
          knowledge_item_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          knowledge_item_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          knowledge_item_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_item_tags_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_item_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_items: {
        Row: {
          attribution: string
          content: string | null
          country_codes: string[] | null
          created_at: string | null
          date_imported: string | null
          date_published: string | null
          date_updated: string | null
          external_ids: Json | null
          id: string
          knowledge_type: Database["public"]["Enums"]["knowledge_type"]
          language_code: string | null
          license_type: Database["public"]["Enums"]["license_type"]
          license_url: string | null
          metadata: Json | null
          original_title: string | null
          original_url: string | null
          search_vector: unknown
          slug: string
          source_id: string | null
          source_record_id: string | null
          source_url: string | null
          summary: string
          time_period: string | null
          title: string
          updated_at: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          attribution?: string
          content?: string | null
          country_codes?: string[] | null
          created_at?: string | null
          date_imported?: string | null
          date_published?: string | null
          date_updated?: string | null
          external_ids?: Json | null
          id?: string
          knowledge_type: Database["public"]["Enums"]["knowledge_type"]
          language_code?: string | null
          license_type?: Database["public"]["Enums"]["license_type"]
          license_url?: string | null
          metadata?: Json | null
          original_title?: string | null
          original_url?: string | null
          search_vector?: unknown
          slug: string
          source_id?: string | null
          source_record_id?: string | null
          source_url?: string | null
          summary: string
          time_period?: string | null
          title: string
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          attribution?: string
          content?: string | null
          country_codes?: string[] | null
          created_at?: string | null
          date_imported?: string | null
          date_published?: string | null
          date_updated?: string | null
          external_ids?: Json | null
          id?: string
          knowledge_type?: Database["public"]["Enums"]["knowledge_type"]
          language_code?: string | null
          license_type?: Database["public"]["Enums"]["license_type"]
          license_url?: string | null
          metadata?: Json | null
          original_title?: string | null
          original_url?: string | null
          search_vector?: unknown
          slug?: string
          source_id?: string | null
          source_record_id?: string | null
          source_url?: string | null
          summary?: string
          time_period?: string | null
          title?: string
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_items_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      languages: {
        Row: {
          autonym: string | null
          created_at: string | null
          id: string
          iso_639_1: string | null
          iso_639_3: string | null
          knowledge_item_id: string | null
          language_family: string | null
          metadata: Json | null
          name: string
          regions: string[] | null
          scripts: string[] | null
          speaker_count: number | null
        }
        Insert: {
          autonym?: string | null
          created_at?: string | null
          id?: string
          iso_639_1?: string | null
          iso_639_3?: string | null
          knowledge_item_id?: string | null
          language_family?: string | null
          metadata?: Json | null
          name: string
          regions?: string[] | null
          scripts?: string[] | null
          speaker_count?: number | null
        }
        Update: {
          autonym?: string | null
          created_at?: string | null
          id?: string
          iso_639_1?: string | null
          iso_639_3?: string | null
          knowledge_item_id?: string | null
          language_family?: string | null
          metadata?: Json | null
          name?: string
          regions?: string[] | null
          scripts?: string[] | null
          speaker_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "languages_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: true
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          attribution: string
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          file_url: string
          height: number | null
          id: string
          is_hosted_internally: boolean | null
          knowledge_item_id: string | null
          license_type: Database["public"]["Enums"]["license_type"]
          license_url: string | null
          media_type: Database["public"]["Enums"]["media_type"]
          metadata: Json | null
          mime_type: string
          rights_statement: string | null
          source_id: string | null
          source_media_id: string | null
          storage_path: string | null
          thumbnail_url: string | null
          title: string
          width: number | null
          wikimedia_commons_id: string | null
        }
        Insert: {
          attribution: string
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          file_url: string
          height?: number | null
          id?: string
          is_hosted_internally?: boolean | null
          knowledge_item_id?: string | null
          license_type: Database["public"]["Enums"]["license_type"]
          license_url?: string | null
          media_type: Database["public"]["Enums"]["media_type"]
          metadata?: Json | null
          mime_type: string
          rights_statement?: string | null
          source_id?: string | null
          source_media_id?: string | null
          storage_path?: string | null
          thumbnail_url?: string | null
          title: string
          width?: number | null
          wikimedia_commons_id?: string | null
        }
        Update: {
          attribution?: string
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          file_url?: string
          height?: number | null
          id?: string
          is_hosted_internally?: boolean | null
          knowledge_item_id?: string | null
          license_type?: Database["public"]["Enums"]["license_type"]
          license_url?: string | null
          media_type?: Database["public"]["Enums"]["media_type"]
          metadata?: Json | null
          mime_type?: string
          rights_statement?: string | null
          source_id?: string | null
          source_media_id?: string | null
          storage_path?: string | null
          thumbnail_url?: string | null
          title?: string
          width?: number | null
          wikimedia_commons_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          alternative_names: string[] | null
          birth_place_id: string | null
          birth_year: number | null
          created_at: string | null
          death_place_id: string | null
          death_year: number | null
          era: string | null
          id: string
          is_approximate_dates: boolean | null
          knowledge_item_id: string | null
          metadata: Json | null
          name: string
          occupations: string[] | null
          wikidata_id: string | null
        }
        Insert: {
          alternative_names?: string[] | null
          birth_place_id?: string | null
          birth_year?: number | null
          created_at?: string | null
          death_place_id?: string | null
          death_year?: number | null
          era?: string | null
          id?: string
          is_approximate_dates?: boolean | null
          knowledge_item_id?: string | null
          metadata?: Json | null
          name: string
          occupations?: string[] | null
          wikidata_id?: string | null
        }
        Update: {
          alternative_names?: string[] | null
          birth_place_id?: string | null
          birth_year?: number | null
          created_at?: string | null
          death_place_id?: string | null
          death_year?: number | null
          era?: string | null
          id?: string
          is_approximate_dates?: boolean | null
          knowledge_item_id?: string | null
          metadata?: Json | null
          name?: string
          occupations?: string[] | null
          wikidata_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "people_birth_place_id_fkey"
            columns: ["birth_place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_death_place_id_fkey"
            columns: ["death_place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: true
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      philosophical_concepts: {
        Row: {
          created_at: string | null
          cultural_context: string | null
          definition: string
          ethical_framework: string | null
          id: string
          knowledge_item_id: string | null
          language_id: string | null
          metadata: Json | null
          name: string
          original_term: string | null
          related_concept_ids: string[] | null
          tradition: string | null
        }
        Insert: {
          created_at?: string | null
          cultural_context?: string | null
          definition: string
          ethical_framework?: string | null
          id?: string
          knowledge_item_id?: string | null
          language_id?: string | null
          metadata?: Json | null
          name: string
          original_term?: string | null
          related_concept_ids?: string[] | null
          tradition?: string | null
        }
        Update: {
          created_at?: string | null
          cultural_context?: string | null
          definition?: string
          ethical_framework?: string | null
          id?: string
          knowledge_item_id?: string | null
          language_id?: string | null
          metadata?: Json | null
          name?: string
          original_term?: string | null
          related_concept_ids?: string[] | null
          tradition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "philosophical_concepts_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: true
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "philosophical_concepts_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          created_at: string | null
          geonames_id: string | null
          historical_names: string[] | null
          historical_region: string | null
          id: string
          knowledge_item_id: string | null
          latitude: number | null
          longitude: number | null
          metadata: Json | null
          modern_country: string | null
          name: string
          wikidata_id: string | null
        }
        Insert: {
          created_at?: string | null
          geonames_id?: string | null
          historical_names?: string[] | null
          historical_region?: string | null
          id?: string
          knowledge_item_id?: string | null
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          modern_country?: string | null
          name: string
          wikidata_id?: string | null
        }
        Update: {
          created_at?: string | null
          geonames_id?: string | null
          historical_names?: string[] | null
          historical_region?: string | null
          id?: string
          knowledge_item_id?: string | null
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          modern_country?: string | null
          name?: string
          wikidata_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "places_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: true
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          articles_count: number | null
          avatar_url: string | null
          bio: string | null
          country: string | null
          cover_url: string | null
          created_at: string | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          id: string
          is_verified: boolean | null
          languages: string[] | null
          role: Database["public"]["Enums"]["user_role"] | null
          total_views: number | null
          updated_at: string | null
          username: string
          website: string | null
        }
        Insert: {
          articles_count?: number | null
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id: string
          is_verified?: boolean | null
          languages?: string[] | null
          role?: Database["public"]["Enums"]["user_role"] | null
          total_views?: number | null
          updated_at?: string | null
          username: string
          website?: string | null
        }
        Update: {
          articles_count?: number | null
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          languages?: string[] | null
          role?: Database["public"]["Enums"]["user_role"] | null
          total_views?: number | null
          updated_at?: string | null
          username?: string
          website?: string | null
        }
        Relationships: []
      }
      sources: {
        Row: {
          api_url: string | null
          base_url: string | null
          created_at: string | null
          default_license: Database["public"]["Enums"]["license_type"] | null
          id: string
          metadata: Json | null
          name: string
          slug: string
          source_type: string
          trust_score: number | null
          updated_at: string | null
        }
        Insert: {
          api_url?: string | null
          base_url?: string | null
          created_at?: string | null
          default_license?: Database["public"]["Enums"]["license_type"] | null
          id?: string
          metadata?: Json | null
          name: string
          slug: string
          source_type: string
          trust_score?: number | null
          updated_at?: string | null
        }
        Update: {
          api_url?: string | null
          base_url?: string | null
          created_at?: string | null
          default_license?: Database["public"]["Enums"]["license_type"] | null
          id?: string
          metadata?: Json | null
          name?: string
          slug?: string
          source_type?: string
          trust_score?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      work_authors: {
        Row: {
          author_id: string
          author_position: number | null
          institution_id: string | null
          work_id: string
        }
        Insert: {
          author_id: string
          author_position?: number | null
          institution_id?: string | null
          work_id: string
        }
        Update: {
          author_id?: string
          author_position?: number | null
          institution_id?: string | null
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_authors_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_authors_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_authors_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
        ]
      }
      works: {
        Row: {
          bibtex: string | null
          citation_count: number | null
          created_at: string | null
          doi: string | null
          id: string
          is_open_access: boolean | null
          knowledge_item_id: string | null
          landing_page_url: string | null
          metadata: Json | null
          open_access_pdf_url: string | null
          openalex_id: string | null
          publication_year: number | null
          venue_name: string | null
          work_type: string | null
        }
        Insert: {
          bibtex?: string | null
          citation_count?: number | null
          created_at?: string | null
          doi?: string | null
          id?: string
          is_open_access?: boolean | null
          knowledge_item_id?: string | null
          landing_page_url?: string | null
          metadata?: Json | null
          open_access_pdf_url?: string | null
          openalex_id?: string | null
          publication_year?: number | null
          venue_name?: string | null
          work_type?: string | null
        }
        Update: {
          bibtex?: string | null
          citation_count?: number | null
          created_at?: string | null
          doi?: string | null
          id?: string
          is_open_access?: boolean | null
          knowledge_item_id?: string | null
          landing_page_url?: string | null
          metadata?: Json | null
          open_access_pdf_url?: string | null
          openalex_id?: string | null
          publication_year?: number | null
          venue_name?: string | null
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "works_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: true
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      finish_ingestion_run_rpc: {
        Args: {
          p_discovered: number
          p_error_summary?: string
          p_failed: number
          p_imported: number
          p_run_id: string
          p_skipped: number
          p_status: Database["public"]["Enums"]["ingestion_status"]
          p_updated: number
        }
        Returns: undefined
      }
      log_ingestion_error_rpc: {
        Args: {
          p_error_code: string
          p_error_message: string
          p_external_id: string
          p_payload_sample?: Json
          p_run_id: string
          p_stage: Database["public"]["Enums"]["ingestion_stage"]
        }
        Returns: undefined
      }
      match_knowledge_chunks: {
        Args: {
          filter_knowledge_type?: Database["public"]["Enums"]["knowledge_type"]
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          attribution: string
          chunk_content: string
          chunk_id: string
          knowledge_item_id: string
          knowledge_type: Database["public"]["Enums"]["knowledge_type"]
          similarity: number
          source_url: string
          title: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      start_ingestion_run_rpc: {
        Args: {
          p_base_url?: string
          p_connector_type?: string
          p_source_name: string
          p_source_slug: string
          p_source_type: string
          p_worker_name?: string
        }
        Returns: Json
      }
      unaccent: { Args: { "": string }; Returns: string }
      upsert_knowledge_item_rpc: {
        Args: { p_item: Json; p_run_id: string; p_source_slug: string }
        Returns: Json
      }
    }
    Enums: {
      article_status: "draft" | "under_review" | "published" | "archived"
      ingestion_stage:
        | "fetch"
        | "normalize"
        | "classify"
        | "deduplicate"
        | "rights_check"
        | "write"
      ingestion_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "partial"
      knowledge_type:
        | "person"
        | "place"
        | "event"
        | "work"
        | "philosophical_concept"
        | "culture"
        | "kingdom_or_state"
        | "language"
        | "cultural_artifact"
        | "manuscript"
        | "article"
      license_type:
        | "public_domain"
        | "cc0"
        | "cc_by"
        | "cc_by_sa"
        | "cc_by_nc"
        | "cc_by_nc_sa"
        | "cc_by_nd"
        | "copyrighted_metadata_only"
        | "unknown"
      media_type: "image" | "document" | "audio" | "video" | "map" | "3d_model"
      user_role: "user" | "contributor" | "moderator" | "admin"
      verification_status: "raw" | "normalized" | "verified" | "flagged"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      article_status: ["draft", "under_review", "published", "archived"],
      ingestion_stage: [
        "fetch",
        "normalize",
        "classify",
        "deduplicate",
        "rights_check",
        "write",
      ],
      ingestion_status: [
        "pending",
        "running",
        "completed",
        "failed",
        "partial",
      ],
      knowledge_type: [
        "person",
        "place",
        "event",
        "work",
        "philosophical_concept",
        "culture",
        "kingdom_or_state",
        "language",
        "cultural_artifact",
        "manuscript",
        "article",
      ],
      license_type: [
        "public_domain",
        "cc0",
        "cc_by",
        "cc_by_sa",
        "cc_by_nc",
        "cc_by_nc_sa",
        "cc_by_nd",
        "copyrighted_metadata_only",
        "unknown",
      ],
      media_type: ["image", "document", "audio", "video", "map", "3d_model"],
      user_role: ["user", "contributor", "moderator", "admin"],
      verification_status: ["raw", "normalized", "verified", "flagged"],
    },
  },
} as const;

export type KnowledgeType = Database["public"]["Enums"]["knowledge_type"];
export type LicenseType = Database["public"]["Enums"]["license_type"];
