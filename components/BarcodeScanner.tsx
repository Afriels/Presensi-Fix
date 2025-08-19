
import React, { useState, useRef, useEffect, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Student, AttendanceRecord, AttendanceStatus, AppSettings, Class } from '../types';
import { getTodayDateString, getCurrentTimeString } from '../services/dataService';
import Card from './ui/Card';
import { SOUNDS } from '../constants';

type ScanStatus = 'idle' | 'success' | 'error' | 'warning';
interface ScanResult {
    status: ScanStatus;
    message: string;
    student?: Student;
    class?: Class;
    time?: string;
}

const BarcodeScanner: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult>({ status: 'idle', message: 'Pindai barcode kartu siswa Anda.' });
  const inputRef = useRef<HTMLInputElement>(null);

  const [students] = useLocalStorage<Student[]>('students', []);
  const [classes] = useLocalStorage<Class[]>('classes', []);
  const [attendance, setAttendance] = useLocalStorage<AttendanceRecord[]>('attendance', []);
  const [settings] = useLocalStorage<AppSettings>('app_settings', { entryTime: '07:00', lateTime: '07:15', exitTime: '15:00' });
  
  const playSound = (sound: string) => {
    new Audio(sound).play().catch(e => console.error("Error playing sound:", e));
  };

  const handleScan = useCallback((id: string) => {
    const today = getTodayDateString();
    const currentTime = getCurrentTimeString();
    const currentTimeDate = new Date(`${today}T${currentTime}`);
    
    const student = students.find(s => s.id === id);

    if (!student) {
        setScanResult({ status: 'error', message: 'Nomor induk tidak terdaftar!' });
        playSound(SOUNDS.ERROR);
        return;
    }

    const studentClass = classes.find(c => c.id === student.classId);
    
    const existingRecord = attendance.find(a => a.studentId === id && a.date === today);
    if (existingRecord?.checkIn) {
        setScanResult({ status: 'warning', message: `Siswa sudah absen masuk pada jam ${existingRecord.checkIn}.`, student, class: studentClass, time: existingRecord.checkIn });
        playSound(SOUNDS.WARNING);
        return;
    }

    const lateTimeDate = new Date(`${today}T${settings.lateTime}:00`);
    const status = currentTimeDate > lateTimeDate ? AttendanceStatus.TERLAMBAT : AttendanceStatus.HADIR;

    const newRecord: AttendanceRecord = {
        id: `att-${id}-${today}`,
        studentId: id,
        date: today,
        checkIn: currentTime,
        checkOut: null,
        status: status,
    };
    
    setAttendance(prev => {
        const otherRecords = prev.filter(r => !(r.studentId === id && r.date === today));
        return [...otherRecords, newRecord];
    });

    setScanResult({ status: 'success', message: `Absensi berhasil: ${status}`, student, class: studentClass, time: currentTime });
    playSound(SOUNDS.SUCCESS);

  }, [students, attendance, settings.lateTime, setAttendance, classes]);

  useEffect(() => {
    if (scanResult.status !== 'idle') {
        const timer = setTimeout(() => {
            setScanResult({ status: 'idle', message: 'Pindai barcode kartu siswa Anda.' });
        }, 5000);
        return () => clearTimeout(timer);
    }
  }, [scanResult]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [scanResult]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (studentId.trim()) {
      handleScan(studentId.trim());
      setStudentId('');
    }
  };
  
  const resultColors = {
    idle: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Card className="w-full max-w-4xl text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Absensi Barcode</h1>
        <p className="text-gray-600 mb-6">Arahkan pemindai barcode ke kartu siswa. Input akan diproses secara otomatis.</p>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full px-4 py-3 text-2xl border-2 border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition"
            placeholder="Menunggu ID Siswa..."
            autoFocus
          />
        </form>
      </Card>
      
      <Card className={`w-full max-w-4xl mt-6 transition-all duration-300 ${resultColors[scanResult.status]}`}>
        {scanResult.status === 'idle' && (
             <div className="text-center py-12">
                <p className="text-2xl font-medium text-gray-500">{scanResult.message}</p>
             </div>
        )}
        {scanResult.status !== 'idle' && (
            <div className="flex flex-col md:flex-row items-center p-4">
                {scanResult.student?.photoUrl && (
                    <img src={scanResult.student.photoUrl} alt={scanResult.student.name} className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg mb-4 md:mb-0 md:mr-6" />
                )}
                <div className="text-center md:text-left">
                    <p className={`text-3xl font-bold ${scanResult.status === 'success' ? 'text-green-700' : scanResult.status === 'error' ? 'text-red-700' : 'text-yellow-700'}`}>
                        {scanResult.message}
                    </p>
                    {scanResult.student && (
                        <>
                            <p className="text-2xl text-gray-800 mt-2">{scanResult.student.name}</p>
                            <p className="text-lg text-gray-600">NIS: {scanResult.student.id} | Kelas: {scanResult.class?.name}</p>
                            <p className="text-xl font-semibold text-gray-700 mt-1">Waktu: {scanResult.time}</p>
                        </>
                    )}
                </div>
            </div>
        )}
      </Card>
    </div>
  );
};

export default BarcodeScanner;