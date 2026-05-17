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
      api_keys: {
        Row: {
          created_at: string | null
          encrypted_value: string | null
          id: string
          last_four: string | null
          service: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          encrypted_value?: string | null
          id?: string
          last_four?: string | null
          service?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          encrypted_value?: string | null
          id?: string
          last_four?: string | null
          service?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_fingerprints: {
        Row: {
          blocked_at: string | null
          blocked_by: string | null
          business_name: string | null
          business_phone: string | null
          city: string | null
          country: string | null
          created_at: string | null
          fingerprint: string
          id: string
          last_reviewed_at: string | null
          reason: string | null
          region: string | null
          updated_at: string | null
        }
        Insert: {
          blocked_at?: string | null
          blocked_by?: string | null
          business_name?: string | null
          business_phone?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          fingerprint: string
          id?: string
          last_reviewed_at?: string | null
          reason?: string | null
          region?: string | null
          updated_at?: string | null
        }
        Update: {
          blocked_at?: string | null
          blocked_by?: string | null
          business_name?: string | null
          business_phone?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          fingerprint?: string
          id?: string
          last_reviewed_at?: string | null
          reason?: string | null
          region?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_fingerprints_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      call_attempts: {
        Row: {
          actor_id: string | null
          callback_at: string | null
          callback_note: string | null
          called_at: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          lead_id: string | null
          next_contact_date: string | null
          notes: string | null
          objection: string | null
          objection_other: string | null
          opener_variant_id: string | null
          outcome: string | null
          prospect_local_day: number | null
          prospect_local_hour: number | null
          result: string | null
          sentiment_score: number | null
          sub_outcome: string | null
          tags: Json | null
          updated_at: string | null
        }
        Insert: {
          actor_id?: string | null
          callback_at?: string | null
          callback_note?: string | null
          called_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          lead_id?: string | null
          next_contact_date?: string | null
          notes?: string | null
          objection?: string | null
          objection_other?: string | null
          opener_variant_id?: string | null
          outcome?: string | null
          prospect_local_day?: number | null
          prospect_local_hour?: number | null
          result?: string | null
          sentiment_score?: number | null
          sub_outcome?: string | null
          tags?: Json | null
          updated_at?: string | null
        }
        Update: {
          actor_id?: string | null
          callback_at?: string | null
          callback_note?: string | null
          called_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          lead_id?: string | null
          next_contact_date?: string | null
          notes?: string | null
          objection?: string | null
          objection_other?: string | null
          opener_variant_id?: string | null
          outcome?: string | null
          prospect_local_day?: number | null
          prospect_local_hour?: number | null
          result?: string | null
          sentiment_score?: number | null
          sub_outcome?: string | null
          tags?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_attempts_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_attempts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_attempts_opener_variant_id_fkey"
            columns: ["opener_variant_id"]
            isOneToOne: false
            referencedRelation: "pitch_opener_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_jobs: {
        Row: {
          actual_cost_usd: number | null
          blocklist_skip_count: number | null
          city: string | null
          completed_at: string | null
          cost_breakdown: Json | null
          country: string | null
          created_at: string | null
          dedup_skip_count: number | null
          delivered_count: number | null
          error_log: string | null
          estimated_cost_usd: number | null
          filters: Json | null
          id: string
          niche_id: string | null
          postal_code: string | null
          region: string | null
          requested_count: number | null
          started_at: string | null
          started_by: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          actual_cost_usd?: number | null
          blocklist_skip_count?: number | null
          city?: string | null
          completed_at?: string | null
          cost_breakdown?: Json | null
          country?: string | null
          created_at?: string | null
          dedup_skip_count?: number | null
          delivered_count?: number | null
          error_log?: string | null
          estimated_cost_usd?: number | null
          filters?: Json | null
          id?: string
          niche_id?: string | null
          postal_code?: string | null
          region?: string | null
          requested_count?: number | null
          started_at?: string | null
          started_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_cost_usd?: number | null
          blocklist_skip_count?: number | null
          city?: string | null
          completed_at?: string | null
          cost_breakdown?: Json | null
          country?: string | null
          created_at?: string | null
          dedup_skip_count?: number | null
          delivered_count?: number | null
          error_log?: string | null
          estimated_cost_usd?: number | null
          filters?: Json | null
          id?: string
          niche_id?: string | null
          postal_code?: string | null
          region?: string | null
          requested_count?: number | null
          started_at?: string | null
          started_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generation_jobs_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_jobs_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_type: string | null
          actor_id: string | null
          created_at: string | null
          id: string
          lead_id: string | null
          payload: Json | null
          updated_at: string | null
        }
        Insert: {
          activity_type?: string | null
          actor_id?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          payload?: Json | null
          updated_at?: string | null
        }
        Update: {
          activity_type?: string | null
          actor_id?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          payload?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          additional_contacts: Json | null
          address: string | null
          ai_summary: string | null
          annual_revenue_estimate: number | null
          assigned_to: string | null
          bbb_accredited: boolean | null
          bbb_rating: string | null
          blocked_at: string | null
          blocked_by: string | null
          blocked_reason: string | null
          business_hours: Json | null
          business_name: string
          business_phone: string | null
          business_phone_label: string | null
          city: string | null
          country: string | null
          created_at: string | null
          current_opener_variant_id: string | null
          employee_count_estimate: number | null
          employee_count_source: string | null
          fingerprint: string
          google_rating: number | null
          google_review_count: number | null
          has_website: boolean | null
          id: string
          is_blocked: boolean | null
          last_called_at: string | null
          last_outcome: string | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          niche_id: string | null
          owner_email: string | null
          owner_email_source: string | null
          owner_email_status: string | null
          owner_linkedin_url: string | null
          business_registration: Json | null
          enriched_at: string | null
          owner_name: string | null
          owner_phone: string | null
          owner_phone_confidence: string | null
          owner_phone_source: string | null
          postal_code: string | null
          region: string | null
          review_count_history: Json | null
          seen_again_count: number | null
          socials: Json | null
          source_log: Json | null
          status: string | null
          website_snapshot_at: string | null
          website_snapshot_hash: string | null
          times_called: number | null
          timezone: string | null
          updated_at: string | null
          website: string | null
          yelp_rating: number | null
          yelp_review_count: number | null
        }
        Insert: {
          additional_contacts?: Json | null
          address?: string | null
          ai_summary?: string | null
          annual_revenue_estimate?: number | null
          assigned_to?: string | null
          bbb_accredited?: boolean | null
          bbb_rating?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          business_hours?: Json | null
          business_name: string
          business_phone?: string | null
          business_phone_label?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          current_opener_variant_id?: string | null
          employee_count_estimate?: number | null
          employee_count_source?: string | null
          fingerprint: string
          google_rating?: number | null
          google_review_count?: number | null
          has_website?: boolean | null
          id?: string
          is_blocked?: boolean | null
          last_called_at?: string | null
          last_outcome?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          niche_id?: string | null
          owner_email?: string | null
          owner_email_source?: string | null
          owner_email_status?: string | null
          owner_linkedin_url?: string | null
          business_registration?: Json | null
          enriched_at?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          owner_phone_confidence?: string | null
          owner_phone_source?: string | null
          postal_code?: string | null
          region?: string | null
          review_count_history?: Json | null
          seen_again_count?: number | null
          socials?: Json | null
          source_log?: Json | null
          status?: string | null
          times_called?: number | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
          website_snapshot_at?: string | null
          website_snapshot_hash?: string | null
          yelp_rating?: number | null
          yelp_review_count?: number | null
        }
        Update: {
          additional_contacts?: Json | null
          address?: string | null
          ai_summary?: string | null
          annual_revenue_estimate?: number | null
          assigned_to?: string | null
          bbb_accredited?: boolean | null
          bbb_rating?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          business_hours?: Json | null
          business_name?: string
          business_phone?: string | null
          business_phone_label?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          current_opener_variant_id?: string | null
          employee_count_estimate?: number | null
          employee_count_source?: string | null
          fingerprint?: string
          google_rating?: number | null
          google_review_count?: number | null
          has_website?: boolean | null
          id?: string
          is_blocked?: boolean | null
          last_called_at?: string | null
          last_outcome?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          niche_id?: string | null
          owner_email?: string | null
          owner_email_source?: string | null
          owner_email_status?: string | null
          owner_linkedin_url?: string | null
          business_registration?: Json | null
          enriched_at?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          owner_phone_confidence?: string | null
          owner_phone_source?: string | null
          postal_code?: string | null
          region?: string | null
          review_count_history?: Json | null
          seen_again_count?: number | null
          socials?: Json | null
          source_log?: Json | null
          status?: string | null
          times_called?: number | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
          website_snapshot_at?: string | null
          website_snapshot_hash?: string | null
          yelp_rating?: number | null
          yelp_review_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
        ]
      }
      niche_intelligence: {
        Row: {
          automation_demand_score: number | null
          avg_ticket_high: number | null
          avg_ticket_low: number | null
          best_regions: string[] | null
          cold_call_viability_score: number | null
          country: string | null
          created_at: string | null
          currency: string | null
          edited_by: string | null
          existing_automation_adoption: string | null
          generated_at: string | null
          generation_source: string | null
          id: string
          last_refreshed_at: string | null
          market_fragmentation: string | null
          niche_id: string | null
          pain_points: string[] | null
          phone_dependency: string | null
          summary: string | null
          twentyfour_fit_score: number | null
          twentyfour_pitch_angles: string[] | null
          typical_bookings_per_month_high: number | null
          typical_bookings_per_month_low: number | null
          typical_monthly_revenue_high: number | null
          typical_monthly_revenue_low: number | null
          typical_owner_persona: string | null
          updated_at: string | null
        }
        Insert: {
          automation_demand_score?: number | null
          avg_ticket_high?: number | null
          avg_ticket_low?: number | null
          best_regions?: string[] | null
          cold_call_viability_score?: number | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          edited_by?: string | null
          existing_automation_adoption?: string | null
          generated_at?: string | null
          generation_source?: string | null
          id?: string
          last_refreshed_at?: string | null
          market_fragmentation?: string | null
          niche_id?: string | null
          pain_points?: string[] | null
          phone_dependency?: string | null
          summary?: string | null
          twentyfour_fit_score?: number | null
          twentyfour_pitch_angles?: string[] | null
          typical_bookings_per_month_high?: number | null
          typical_bookings_per_month_low?: number | null
          typical_monthly_revenue_high?: number | null
          typical_monthly_revenue_low?: number | null
          typical_owner_persona?: string | null
          updated_at?: string | null
        }
        Update: {
          automation_demand_score?: number | null
          avg_ticket_high?: number | null
          avg_ticket_low?: number | null
          best_regions?: string[] | null
          cold_call_viability_score?: number | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          edited_by?: string | null
          existing_automation_adoption?: string | null
          generated_at?: string | null
          generation_source?: string | null
          id?: string
          last_refreshed_at?: string | null
          market_fragmentation?: string | null
          niche_id?: string | null
          pain_points?: string[] | null
          phone_dependency?: string | null
          summary?: string | null
          twentyfour_fit_score?: number | null
          twentyfour_pitch_angles?: string[] | null
          typical_bookings_per_month_high?: number | null
          typical_bookings_per_month_low?: number | null
          typical_monthly_revenue_high?: number | null
          typical_monthly_revenue_low?: number | null
          typical_owner_persona?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "niche_intelligence_edited_by_fkey"
            columns: ["edited_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "niche_intelligence_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
        ]
      }
      niche_learned_intelligence: {
        Row: {
          avg_call_duration_seconds: number | null
          best_call_day_local: number | null
          best_call_hour_local: number | null
          close_rate: number | null
          country: string | null
          created_at: string | null
          id: string
          last_recomputed_at: string | null
          meeting_rate: number | null
          niche_id: string | null
          pickup_rate: number | null
          pickup_rate_by_rating_band: Json | null
          pickup_rate_by_review_count_band: Json | null
          region: string | null
          top_objections: Json | null
          top_pitch_opener_variant_id: string | null
          total_calls: number | null
          total_customers: number | null
          total_meetings_set: number | null
          total_pickups: number | null
          updated_at: string | null
        }
        Insert: {
          avg_call_duration_seconds?: number | null
          best_call_day_local?: number | null
          best_call_hour_local?: number | null
          close_rate?: number | null
          country?: string | null
          created_at?: string | null
          id?: string
          last_recomputed_at?: string | null
          meeting_rate?: number | null
          niche_id?: string | null
          pickup_rate?: number | null
          pickup_rate_by_rating_band?: Json | null
          pickup_rate_by_review_count_band?: Json | null
          region?: string | null
          top_objections?: Json | null
          top_pitch_opener_variant_id?: string | null
          total_calls?: number | null
          total_customers?: number | null
          total_meetings_set?: number | null
          total_pickups?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_call_duration_seconds?: number | null
          best_call_day_local?: number | null
          best_call_hour_local?: number | null
          close_rate?: number | null
          country?: string | null
          created_at?: string | null
          id?: string
          last_recomputed_at?: string | null
          meeting_rate?: number | null
          niche_id?: string | null
          pickup_rate?: number | null
          pickup_rate_by_rating_band?: Json | null
          pickup_rate_by_review_count_band?: Json | null
          region?: string | null
          top_objections?: Json | null
          top_pitch_opener_variant_id?: string | null
          total_calls?: number | null
          total_customers?: number | null
          total_meetings_set?: number | null
          total_pickups?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "niche_learned_intelligence_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "niche_learned_intelligence_top_pitch_opener_variant_id_fkey"
            columns: ["top_pitch_opener_variant_id"]
            isOneToOne: false
            referencedRelation: "pitch_opener_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      niches: {
        Row: {
          country_scope: string[] | null
          created_at: string | null
          id: string
          is_actively_pitching: boolean | null
          is_favorited: boolean | null
          is_shortlist: boolean | null
          naics_code: string | null
          name: string
          parent_sector: string | null
          updated_at: string | null
          weather_sensitive: boolean | null
        }
        Insert: {
          country_scope?: string[] | null
          created_at?: string | null
          id?: string
          is_actively_pitching?: boolean | null
          is_favorited?: boolean | null
          is_shortlist?: boolean | null
          naics_code?: string | null
          name: string
          parent_sector?: string | null
          updated_at?: string | null
          weather_sensitive?: boolean | null
        }
        Update: {
          country_scope?: string[] | null
          created_at?: string | null
          id?: string
          is_actively_pitching?: boolean | null
          is_favorited?: boolean | null
          is_shortlist?: boolean | null
          naics_code?: string | null
          name?: string
          parent_sector?: string | null
          updated_at?: string | null
          weather_sensitive?: boolean | null
        }
        Relationships: []
      }
      pitch_opener_variants: {
        Row: {
          conversion_rate: number | null
          country: string | null
          created_at: string | null
          created_by_id: string | null
          hook_type: string | null
          id: string
          is_active: boolean | null
          is_edited: boolean | null
          is_personalized: boolean | null
          lead_id: string | null
          meetings_set: number | null
          name: string | null
          niche_id: string | null
          opener_text: string
          personalization_signals_used: Json | null
          predicted_open_rate: number | null
          times_used: number | null
          trigger_event_id: string | null
          updated_at: string | null
        }
        Insert: {
          conversion_rate?: number | null
          country?: string | null
          created_at?: string | null
          created_by_id?: string | null
          hook_type?: string | null
          id?: string
          is_active?: boolean | null
          is_edited?: boolean | null
          is_personalized?: boolean | null
          lead_id?: string | null
          meetings_set?: number | null
          name?: string | null
          niche_id?: string | null
          opener_text: string
          personalization_signals_used?: Json | null
          predicted_open_rate?: number | null
          times_used?: number | null
          trigger_event_id?: string | null
          updated_at?: string | null
        }
        Update: {
          conversion_rate?: number | null
          country?: string | null
          created_at?: string | null
          created_by_id?: string | null
          hook_type?: string | null
          id?: string
          is_active?: boolean | null
          is_edited?: boolean | null
          is_personalized?: boolean | null
          lead_id?: string | null
          meetings_set?: number | null
          name?: string | null
          niche_id?: string | null
          opener_text?: string
          personalization_signals_used?: Json | null
          predicted_open_rate?: number | null
          times_used?: number | null
          trigger_event_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pitch_opener_variants_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pitch_opener_variants_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pitch_opener_variants_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_config: {
        Row: {
          cost_usd: number | null
          created_at: string | null
          id: string
          notes: string | null
          source: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          source?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          source?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scraper_health: {
        Row: {
          consecutive_failures: number | null
          created_at: string | null
          id: string
          is_disabled: boolean | null
          last_check_at: string | null
          last_error: string | null
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          consecutive_failures?: number | null
          created_at?: string | null
          id?: string
          is_disabled?: boolean | null
          last_check_at?: string | null
          last_error?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          consecutive_failures?: number | null
          created_at?: string | null
          id?: string
          is_disabled?: boolean | null
          last_check_at?: string | null
          last_error?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          is_active: boolean | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      trigger_events: {
        Row: {
          actioned_at: string | null
          actioned_by: string | null
          created_at: string | null
          dedupe_key: string | null
          details: Json | null
          detected_at: string | null
          expires_at: string | null
          id: string
          is_actioned: boolean | null
          lead_id: string | null
          severity: string | null
          trigger_type: string | null
          updated_at: string | null
        }
        Insert: {
          actioned_at?: string | null
          actioned_by?: string | null
          created_at?: string | null
          dedupe_key?: string | null
          details?: Json | null
          detected_at?: string | null
          expires_at?: string | null
          id?: string
          is_actioned?: boolean | null
          lead_id?: string | null
          severity?: string | null
          trigger_type?: string | null
          updated_at?: string | null
        }
        Update: {
          actioned_at?: string | null
          actioned_by?: string | null
          created_at?: string | null
          dedupe_key?: string | null
          details?: Json | null
          detected_at?: string | null
          expires_at?: string | null
          id?: string
          is_actioned?: boolean | null
          lead_id?: string | null
          severity?: string | null
          trigger_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trigger_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_insights: {
        Row: {
          actionable_insights: Json | null
          created_at: string | null
          dismissed_by: string[] | null
          experiments_to_try: Json | null
          generated_at: string | null
          generated_by: string | null
          headline_observation: string | null
          id: string
          insight_text: string | null
          source_metrics: Json | null
          updated_at: string | null
          week_starting: string | null
        }
        Insert: {
          actionable_insights?: Json | null
          created_at?: string | null
          dismissed_by?: string[] | null
          experiments_to_try?: Json | null
          generated_at?: string | null
          generated_by?: string | null
          headline_observation?: string | null
          id?: string
          insight_text?: string | null
          source_metrics?: Json | null
          updated_at?: string | null
          week_starting?: string | null
        }
        Update: {
          actionable_insights?: Json | null
          created_at?: string | null
          dismissed_by?: string[] | null
          experiments_to_try?: Json | null
          generated_at?: string | null
          generated_by?: string | null
          headline_observation?: string | null
          id?: string
          insight_text?: string | null
          source_metrics?: Json | null
          updated_at?: string | null
          week_starting?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_activity_feed: {
        Args: {
          p_start: string
          p_end: string
          p_user_ids: string[] | null
          p_include_calls: boolean
          p_activity_types: string[] | null
          p_include_generation: boolean
          p_include_triggers: boolean
          p_lead_search: string | null
          p_niche_id: string | null
          p_cursor: string | null
          p_limit: number
        }
        Returns: {
          kind: string
          occurred_at: string
          user_id: string | null
          lead_id: string | null
          payload: Json
          source_id: string
          business_name: string | null
          city: string | null
          region: string | null
          niche_name: string | null
          actor_name: string | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
