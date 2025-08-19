
import { Student, Class, AttendanceRecord, AppSettings, AcademicYear, AttendanceStatus } from '../types';

const DUMMY_CLASSES: Class[] = [
  { id: '10A', name: 'Kelas 10-A' },
  { id: '10B', name: 'Kelas 10-B' },
  { id: '11A', name: 'Kelas 11-A' },
];

const DUMMY_STUDENTS: Student[] = [
  { id: '1001', name: 'Budi Santoso', classId: '10A', photoUrl: 'https://picsum.photos/seed/1001/200' },
  { id: '1002', name: 'Citra Lestari', classId: '10A', photoUrl: 'https://picsum.photos/seed/1002/200' },
  { id: '1003', name: 'Doni Firmansyah', classId: '10A', photoUrl: 'https://picsum.photos/seed/1003/200' },
  { id: '1004', name: 'Eka Putri', classId: '10B', photoUrl: 'https://picsum.photos/seed/1004/200' },
  { id: '1005', name: 'Fajar Nugraha', classId: '10B', photoUrl: 'https://picsum.photos/seed/1005/200' },
  { id: '1101', name: 'Gita Prameswari', classId: '11A', photoUrl: 'https://picsum.photos/seed/1101/200' },
];

const DUMMY_ACADEMIC_YEARS: AcademicYear[] = [
    { id: '2324-1', year: '2023/2024', semester: 'Ganjil', isActive: false },
    { id: '2324-2', year: '2023/2024', semester: 'Genap', isActive: true },
];

const DEFAULT_SETTINGS: AppSettings = {
    entryTime: '07:00',
    lateTime: '07:15',
    exitTime: '15:00',
};

export const initializeDummyData = () => {
    if (!localStorage.getItem('students')) {
        localStorage.setItem('students', JSON.stringify(DUMMY_STUDENTS));
    }
    if (!localStorage.getItem('classes')) {
        localStorage.setItem('classes', JSON.stringify(DUMMY_CLASSES));
    }
    if (!localStorage.getItem('academic_years')) {
        localStorage.setItem('academic_years', JSON.stringify(DUMMY_ACADEMIC_YEARS));
    }
    if (!localStorage.getItem('app_settings')) {
        localStorage.setItem('app_settings', JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem('attendance')) {
        // Add some dummy attendance for today
        const today = new Date().toISOString().slice(0, 10);
        const dummyAttendance: AttendanceRecord[] = [
            { id: `att-1001-${today}`, studentId: '1001', date: today, checkIn: '07:05:12', checkOut: null, status: AttendanceStatus.HADIR },
            { id: `att-1002-${today}`, studentId: '1002', date: today, checkIn: '07:20:01', checkOut: null, status: AttendanceStatus.TERLAMBAT },
            { id: `att-1004-${today}`, studentId: '1004', date: today, checkIn: null, checkOut: null, status: AttendanceStatus.SAKIT, notes: 'Surat dokter terlampir' },
        ];
        localStorage.setItem('attendance', JSON.stringify(dummyAttendance));
    }
};

export function getTodayDateString() {
    return new Date().toISOString().slice(0, 10);
}

export function getCurrentTimeString() {
    return new Date().toTimeString().slice(0, 8);
}