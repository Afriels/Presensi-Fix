
import { createClient } from '@supabase/supabase-js';

// Define the types for your database schema here.
// This will provide type-safety for all Supabase operations.
export type Database = {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          name: string;
          class_id: string;
          photo_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          class_id: string;
          photo_url?: string | null;
        };
        Update: {
          name?: string;
          class_id?: string;
          photo_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          }
        ];
      };
      classes: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id: string;
          name: string;
        };
        Update: {
          name?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};


// =================================================================================
// PENTING: GANTI DENGAN KREDENSIAL SUPABASE ANDA YANG SEBENARNYA!
// Anda bisa mendapatkannya dari Project Settings > API di dashboard Supabase.
// URL proyek Anda akan terlihat seperti: https://<project-id>.supabase.co
// =================================================================================
const supabaseUrl = 'https://vzcimsvyjzzqrlqlrpwp.supabase.co'; // CONTOH: Ganti dengan URL Supabase Anda
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6Y2ltc3Z5anp6cXJscWxycHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NjkzOTYsImV4cCI6MjA3MTI0NTM5Nn0.Ru69Z_B4Cg43xYtWjh6lh7tRG03eYoWNYLCCkUsju1U'; // CONTOH: Ganti dengan Anon Key Anda
// =================================================================================

// Cek apakah kredensial masih placeholder
if (supabaseUrl.includes('vzcimsvyjzzqrlqlrpwp') || supabaseKey.includes('Ru69Z_B4Cg43xYtWjh6lh7tRG03eYoWNYLCCkUsju1U')) {
    const warningMessage = 'PERINGATAN: Anda masih menggunakan URL dan Kunci API Supabase placeholder. Silakan ganti dengan kredensial asli Anda di file `services/supabase.ts` untuk menjalankan aplikasi.';
    console.warn(warningMessage);
}

// Provide the Database type to the client for type-safety.
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
