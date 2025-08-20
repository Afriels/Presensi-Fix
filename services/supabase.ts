import { createClient } from '@supabase/supabase-js';
import { Student, Class, AttendanceRecord, AcademicYear, AppSettings } from '../types';

// =================================================================================
// TODO: GANTI DENGAN URL DAN ANON KEY SUPABASE ANDA
// Anda bisa mendapatkannya dari Project Settings > API di dashboard Supabase
// =================================================================================
const supabaseUrl = 'https://supabase.com/dashboard/project/vzcimsvyjzzqrlqlrpwp'; // Ganti dengan URL Supabase Anda
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6Y2ltc3Z5anp6cXJscWxycHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NjkzOTYsImV4cCI6MjA3MTI0NTM5Nn0.Ru69Z_B4Cg43xYtWjh6lh7tRG03eYoWNYLCCkUsju1U'; // Ganti dengan Anon Key Anda
// =================================================================================

// Pastikan untuk tidak membiarkan nilai default di atas saat production.
if (supabaseUrl === 'https://supabase.com/dashboard/project/vzcimsvyjzzqrlqlrpwp' || supabaseKey === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6Y2ltc3Z5anp6cXJscWxycHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NjkzOTYsImV4cCI6MjA3MTI0NTM5Nn0.Ru69Z_B4Cg43xYtWjh6lh7tRG03eYoWNYLCCkUsju1U') {
    console.warn('PENTING: Harap konfigurasi URL dan Anon Key Supabase Anda di services/supabase.ts');
}

interface Database {
  public: {
    Tables: {
      students: {
        Row: Student;
        Insert: Omit<Student, 'photoUrl'> & { photoUrl?: string };
        Update: Partial<Student>;
      };
      classes: {
        Row: Class;
        Insert: Class;
        Update: Partial<Class>;
      };
      attendance_records: {
        Row: AttendanceRecord;
        Insert: Omit<AttendanceRecord, 'id'>;
        Update: Partial<AttendanceRecord>;
      };
      academic_years: {
        Row: AcademicYear;
        Insert: Omit<AcademicYear, 'id'>;
        Update: Partial<AcademicYear>;
      };
      app_settings: {
        Row: AppSettings;
        Insert: AppSettings;
        Update: Partial<AppSettings>;
      };
    };
  };
}


export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
