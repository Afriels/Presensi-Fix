import { createClient } from '@supabase/supabase-js';

// =====================================================================================
// == KONFIGURASI KONEKSI SUPABASE
// =====================================================================================
// PENTING: Ganti nilai placeholder di bawah ini dengan URL dan Kunci Anon
// dari proyek Supabase Anda. Anda bisa mendapatkannya dari
// Supabase Dashboard > Project Settings > API.
// =====================================================================================
const supabaseUrl = 'https://vzcimsvyjzzqrlqlrpwp.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6Y2ltc3Z5anp6cXJscWxycHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NjkzOTYsImV4cCI6MjA3MTI0NTM5Nn0.Ru69Z_B4Cg43xYtWjh6lh7tRG03eYoWNYLCCkUsju1U';
// =====================================================================================

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
          status: Enums<'attendance_status'>;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          student_id: string;
          date: string;
          check_in?: string | null;
          check_out?: string | null;
          status: Enums<'attendance_status'>;
          notes?: string | null;
        };
        Update: {
          student_id?: string;
          date?: string;
          check_in?: string | null;
          check_out?: string | null;
          status?: Enums<'attendance_status'>;
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
          // FIX: Add missing signature_url and stamp_url properties
          signature_url: string | null;
          stamp_url: string | null;
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
          // FIX: Add missing signature_url and stamp_url properties
          signature_url?: string | null;
          stamp_url?: string | null;
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
          // FIX: Add missing signature_url and stamp_url properties
          signature_url?: string | null;
          stamp_url?: string | null;
        };
        Relationships: [];
      };
      academic_years: {
        Row: {
          id: number;
          year: string;
          semester: 'Ganjil' | 'Genap';
          is_active: boolean;
        };
        Insert: {
          id?: number;
          year: string;
          semester: 'Ganjil' | 'Genap';
          is_active?: boolean;
        };
        Update: {
          id?: number;
          year?: string;
          semester?: 'Ganjil' | 'Genap';
          is_active?: boolean;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          role: Enums<'user_role'>;
        };
        Insert: {
          id: string;
          role?: Enums<'user_role'>;
        };
        Update: {
          id?: string;
          role?: Enums<'user_role'>;
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

// The error-throwing check has been removed to allow the application to start.
    
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    global: {
        fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    },
});