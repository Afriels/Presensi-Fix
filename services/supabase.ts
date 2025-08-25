import { createClient } from '@supabase/supabase-js';

// SQL to update database schema. Run this in your Supabase SQL Editor.
/*
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
          photo_url: string;
          nisn: string | null;
          pob: string | null;
          dob: string | null;
          address: string | null;
        };
        Insert: {
          id: string;
          name: string;
          class_id: string;
          photo_url?: string;
          nisn?: string | null;
          pob?: string | null;
          dob?: string | null;
          address?: string | null;
        };
        Update: {
          name?: string;
          class_id?: string;
          photo_url?: string;
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

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
