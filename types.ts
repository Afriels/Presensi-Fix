
export enum AttendanceStatus {
  HADIR = 'Hadir',
  TERLAMBAT = 'Terlambat',
  SAKIT = 'Sakit',
  IJIN = 'Ijin',
  ALPA = 'Alpa',
}

export interface Student {
  id: string; // Nomor Induk Siswa
  name: string;
  classId: string;
  photoUrl: string;
}

export interface Class {
  id: string;
  name: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  checkIn: string | null; // HH:mm:ss
  checkOut: string | null; // HH:mm:ss
  status: AttendanceStatus;
  notes?: string;
}

export interface AcademicYear {
    id: string;
    year: string; // e.g., "2023/2024"
    semester: 'Ganjil' | 'Genap';
    isActive: boolean;
}

export interface AppSettings {
    entryTime: string; // HH:mm
    lateTime: string; // HH:mm
    exitTime: string; // HH:mm
    appName?: string;
    schoolName?: string;
}