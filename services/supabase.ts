
import { createClient } from '@supabase/supabase-js';

// SQL to update database schema. Run this in your Supabase SQL Editor.
/*
-- RUN THESE IF YOU HAVEN'T ALREADY FROM THE PREVIOUS UPDATE --

-- 1. Add new columns to the students table
ALTER TABLE public.students
ADD COLUMN nisn TEXT,
ADD COLUMN pob TEXT, -- Place of Birth
ADD COLUMN dob DATE, -- Date of Birth
ADD COLUMN address TEXT;

-- 2. Add new columns to the app_settings table for the ID card
ALTER TABLE public.app_settings
ADD COLUMN foundation_name TEXT,
ADD COLUMN school_address TEXT,
ADD COLUMN school_phone TEXT,
ADD COLUMN school_email TEXT,
ADD COLUMN headmaster_name TEXT,
ADD COLUMN school_city TEXT;

-- NEW SQL FOR THIS UPDATE --

-- 3. Add columns for logo and favicon URLs
ALTER TABLE public.app_settings
ADD COLUMN logo_url TEXT,
ADD COLUMN favicon_url TEXT;

-- SETUP FOR STUDENT PHOTO UPLOADS (if not done) --

-- 1. Create a new storage bucket named 'student-photos'
-- Go to 'Storage' in your Supabase dashboard and click 'New bucket'.
-- Enter 'student-photos' as the name and make sure 'Public bucket' is checked.
-- 2. Setup policies (see previous instructions if needed)

-- SETUP FOR APP ASSETS (LOGO, FAVICON) --

-- 1. Create a public storage bucket named 'app-assets'
-- Go to 'Storage' in your Supabase dashboard, click 'New bucket', enter 'app-assets' and check 'Public bucket'.

-- 2. Add policies for the new bucket. Go to 'Authentication' -> 'Policies' and create new policies for 'storage.objects'.
CREATE POLICY "Public Read Access for App Assets"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'app-assets' );

CREATE POLICY "Allow Admin CUD for App Assets"
ON storage.objects FOR ALL -- Covers INSERT, SELECT, UPDATE, DELETE
TO authenticated
USING ( bucket_id = 'app-assets' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' )
WITH CHECK ( bucket_id = 'app-assets' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );


-- PENTING: KEBIJAKAN RLS UNTUK `app_settings` --
-- Aplikasi perlu membaca pengaturan seperti logo dan favicon sebelum pengguna login.
-- Anda WAJIB mengaktifkan RLS pada tabel `app_settings` dan membuat kebijakan untuk akses baca publik.

-- 1. Aktifkan RLS pada tabel (jika belum aktif)
-- Buka Authentication -> Policies di dasbor Supabase Anda dan aktifkan RLS untuk 'app_settings'.
-- Atau jalankan SQL ini:
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 2. Buat kebijakan untuk mengizinkan siapa saja membaca pengaturan
CREATE POLICY "Allow public read access to app settings"
ON public.app_settings FOR SELECT
TO public
USING (true);

-- 3. Buat kebijakan untuk mengizinkan HANYA ADMIN memperbarui pengaturan
-- Ini adalah praktik keamanan yang baik.
CREATE POLICY "Allow admin users to update app settings"
ON public.app_settings FOR UPDATE
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

*/


// Define the types for your database schema here.
// This will provide type-safety for all Supabase operations.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          name: string;
          class_id: string;
          photo_url: string | null;
          nisn: string | null;
          pob: string | null;
          dob: string | null;
          address: string | null;
        };
        Insert: {
          id: string;
          name: string;
          class_id: string;
          photo_url?: string | null;
          nisn?: string | null;
          pob?: string | null;
          dob?: string | null;
          address?: string | null;
        };
        Update: {
          name?: string;
          class_id?: string;
          photo_url?: string | null;
          nisn?: string | null;
          pob?: string | null;
          dob?: string | null;
          address?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
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
      attendance_records: {
        Row: {
          id: number;
          student_id: string;
          date: string;
          check_in: string | null;
          check_out: string | null;
          status: 'Hadir' | 'Terlambat' | 'Sakit' | 'Ijin' | 'Alpa';
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          student_id: string;
          date: string;
          check_in?: string | null;
          check_out?: string | null;
          status: 'Hadir' | 'Terlambat' | 'Sakit' | 'Ijin' | 'Alpa';
          notes?: string | null;
        };
        Update: {
          student_id?: string;
          date?: string;
          check_in?: string | null;
          check_out?: string | null;
          status?: 'Hadir' | 'Terlambat' | 'Sakit' | 'Ijin' | 'Alpa';
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          }
        ];
      };
      app_settings: {
        Row: {
          id: number;
          entry_time: string;
          late_time: string;
          exit_time: string;
          app_name: string | null;
          school_name: string | null;
          foundation_name: string | null;
          school_address: string | null;
          school_phone: string | null;
          school_email: string | null;
          headmaster_name: string | null;
          school_city: string | null;
          logo_url: string | null;
          favicon_url: string | null;
        };
        Insert: {
          id?: number;
          entry_time: string;
          late_time: string;
          exit_time: string;
          app_name?: string | null;
          school_name?: string | null;
          foundation_name?: string | null;
          school_address?: string | null;
          school_phone?: string | null;
          school_email?: string | null;
          headmaster_name?: string | null;
          school_city?: string | null;
          logo_url?: string | null;
          favicon_url?: string | null;
        };
        Update: {
          id?: number;
          entry_time?: string;
          late_time?: string;
          exit_time?: string;
          app_name?: string | null;
          school_name?: string | null;
          foundation_name?: string | null;
          school_address?: string | null;
          school_phone?: string | null;
          school_email?: string | null;
          headmaster_name?: string | null;
          school_city?: string | null;
          logo_url?: string | null;
          favicon_url?: string | null;
        };
        Relationships: [];
      };
      academic_years: {
        Row: {
          id: number;
          year: string;
          semester: string;
          is_active: boolean;
        };
        Insert: {
          id?: number;
          year: string;
          semester: string;
          is_active?: boolean;
        };
        Update: {
          id?: number;
          year?: string;
          semester?: string;
          is_active?: boolean;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          role: 'admin' | 'guru' | 'siswa';
        };
        Insert: {
          id: string;
          role?: 'admin' | 'guru' | 'siswa';
        };
        Update: {
          id?: string;
          role?: 'admin' | 'guru' | 'siswa';
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_users_with_email: {
        Args: Record<string, never>
        Returns: {
          id: string
          email: string
          role: Enums<'user_role'>
        }[]
      }
    };
    Enums: {
      user_role: 'admin' | 'guru' | 'siswa';
      attendance_status: 'Hadir' | 'Terlambat' | 'Sakit' | 'Ijin' | 'Alpa';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'] & Database['public']['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'] &
        Database['public']['Views'])
    ? (Database['public']['Tables'] &
        Database['public']['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database['public']['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof Database['public']['Enums']
    ? Database['public']['Enums'][PublicEnumNameOrOptions]
    : never


const supabaseUrl = 'https://vzcimsvyjzzqrlqlrpwp.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6Y2ltc3Z5anp6cXJscWxycHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NjkzOTYsImV4cCI6MjA3MTI0NTM5Nn0.Ru69Z_B4Cg43xYtWjh6lh7tRG03eYoWNYLCCkUsju1U';
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    global: {
        fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    },
});