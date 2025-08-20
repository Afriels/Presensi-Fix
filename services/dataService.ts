

import type { Student, Class, AttendanceRecord, AppSettings, AcademicYear, AttendanceStatus } from '../types';

export function getTodayDateString() {
    return new Date().toISOString().slice(0, 10);
}

export function getCurrentTimeString() {
    return new Date().toTimeString().slice(0, 8);
}