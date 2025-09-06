import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Student, AttendanceStatus, AppSettings, Class } from '../types';
import { getTodayDateString, getCurrentTimeString } from '../services/dataService';
import Card from './ui/Card';
import { SOUNDS } from '../constants';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase, TablesInsert } from '../services/supabase';

type ScanStatus = 'idle' | 'success' | 'error' | 'warning' | 'loading';
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
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [classes, setClasses] = useState<Class[]>([]);

  const [settings, setSettings] = useState<AppSettings>({ entryTime: '07:00', lateTime: '07:15', exitTime: '15:00' });
  const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

  useEffect(() => {
    const fetchInitialData = async () => {
        const { data: settingsData, error: settingsError } = await supabase.from('app_settings').select('entry_time, late_time, exit_time').eq('id', 1).single();

        if (settingsError && settingsError.code !== 'PGRST116') {
            console.error("Error fetching app settings:", settingsError);
        } else if (settingsData) {
            setSettings({
                entryTime: settingsData.entry_time,
                lateTime: settingsData.late_time,
                exitTime: settingsData.exit_time,
            });
        }
        
        const { data: classesData, error: classesError } = await supabase.from('classes').select('*');
        
        if (classesError) {
            console.error("Error fetching classes:", classesError);
        } else if (classesData) {
            setClasses(classesData);
        }
    };
    fetchInitialData();
  }, []);
  
  const playSound = (sound: string) => {
    new Audio(sound).play().catch(e => console.error("Error playing sound:", e));
  };

  const handleScan = useCallback(async (id: string) => {
    setScanResult({ status: 'loading', message: 'Memproses...' });
    const today = getTodayDateString();
    const currentTime = getCurrentTimeString();
    
    try {
        const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select(`*`)
            .eq('id', id)
            .single();

        if (studentError || !studentData) {
            setScanResult({ status: 'error', message: 'Siswa tidak terdaftar!' });
            playSound(SOUNDS.ERROR);
            return;
        }

        const student: Student = {
            id: studentData.id,
            name: studentData.name,
            classId: studentData.class_id,
            photoUrl: studentData.photo_url || undefined
        };
        
        const studentClassName = classMap.get(student.classId);
        const studentClass: Class | undefined = studentClassName ? { id: student.classId, name: studentClassName } : undefined;

        const { data: existingRecord, error: existingError } = await supabase
            .from('attendance_records')
            .select('check_in')
            .eq('student_id', id)
            .eq('date', today)
            .maybeSingle();
        
        if (existingError) throw existingError;

        if (existingRecord?.check_in) {
            setScanResult({ status: 'warning', message: `Sudah Absen Masuk`, student, class: studentClass, time: existingRecord.check_in });
            playSound(SOUNDS.WARNING);
            return;
        }

        const currentTimeDate = new Date(`${today}T${currentTime}`);
        const lateTimeDate = new Date(`${today}T${settings.lateTime}:00`);
        const status = currentTimeDate > lateTimeDate ? AttendanceStatus.TERLAMBAT : AttendanceStatus.HADIR;

        const newRecord: TablesInsert<'attendance_records'> = {
            student_id: id,
            date: today,
            check_in: currentTime,
            check_out: null,
            status: status,
        };
        
        const { error: insertError } = await supabase.from('attendance_records').insert(newRecord);
        if (insertError) throw insertError;
        
        setScanResult({ status: 'success', message: `Absensi Berhasil`, student, class: studentClass, time: currentTime });
        playSound(SOUNDS.SUCCESS);

    } catch (err: any) {
        console.error("Error during scan handling:", err);
        setScanResult({ status: 'error', message: 'Terjadi Kesalahan Server' });
        playSound(SOUNDS.ERROR);
    }

  }, [settings.lateTime, classMap]);
  
  useEffect(() => {
    if (!isScannerVisible) return;

    const scanner = new Html5QrcodeScanner("reader", { qrbox: { width: 250, height: 250 }, fps: 10 }, false);
    let isScanning = true;
    const onScanSuccess = (decodedText: string) => {
        if (isScanning) {
            isScanning = false;
            handleScan(decodedText);
            scanner.clear().catch(error => console.error("Failed to clear scanner", error));
            setIsScannerVisible(false);
        }
    };
    scanner.render(onScanSuccess, () => {});
    return () => {
        if (scanner && scanner.getState()) scanner.clear().catch(e => console.error("Cleanup error", e));
    };
  }, [isScannerVisible, handleScan]);


  useEffect(() => {
    if (scanResult.status !== 'idle' && scanResult.status !== 'loading') {
        const timer = setTimeout(() => {
            setScanResult({ status: 'idle', message: 'Pindai barcode kartu siswa Anda.' });
        }, 5000);
        return () => clearTimeout(timer);
    }
  }, [scanResult]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (studentId.trim()) {
      handleScan(studentId.trim());
      setStudentId('');
    }
  };
  
  const handleCameraOpen = async () => {
    playSound(SOUNDS.CAMERA_OPEN);
    setIsScannerVisible(true);
  };
  
  const resultBorders = {
    idle: 'border-slate-200/80',
    success: 'border-emerald-500',
    error: 'border-rose-500',
    warning: 'border-amber-500',
    loading: 'border-sky-500',
  };
  const resultIcons = {
    success: <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    error: <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    warning: <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  }

  return (
    <div className="flex flex-col items-center h-full gap-8 animate-fade-in">
      <Card className="w-full max-w-2xl text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Pindai Kehadiran</h1>
        {isScannerVisible ? (
            <div className="mt-4">
                <div id="reader" className="w-full max-w-sm mx-auto rounded-lg overflow-hidden border-2 border-slate-300"></div>
                <button
                    onClick={() => { playSound(SOUNDS.CAMERA_CLOSE); setIsScannerVisible(false); }}
                    className="mt-4 px-6 py-2 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 transition-colors"
                >
                    Tutup Kamera
                </button>
            </div>
        ) : (
            <div>
                <p className="text-slate-500 mb-6">Arahkan barcode kartu ke kamera atau ketik NIS manual.</p>
                <form onSubmit={handleSubmit} className="mb-4">
                    <input
                        ref={inputRef}
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="w-full px-4 py-3 text-center text-2xl border-slate-300 rounded-lg focus:ring-sky-500 focus:border-sky-500 transition"
                        placeholder="Ketik NIS disini..."
                        autoFocus
                    />
                </form>
                <button
                    onClick={handleCameraOpen}
                    className="px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition flex items-center justify-center w-full sm:w-auto mx-auto shadow-md"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
                    Pindai dengan Kamera
                </button>
            </div>
        )}
      </Card>
      
      <div className={`w-full max-w-4xl border-2 bg-white rounded-xl shadow-sm transition-all duration-300 ${resultBorders[scanResult.status]}`}>
        { (scanResult.status === 'idle' || scanResult.status === 'loading') && (
             <div className="text-center p-8 min-h-[280px] flex flex-col justify-center items-center">
                <p className="text-2xl font-medium text-slate-500">{scanResult.message}</p>
                 {scanResult.status === 'loading' && <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>}
             </div>
        )}
        { (scanResult.status !== 'idle' && scanResult.status !== 'loading') && (
            <div className="p-6 animate-fade-in">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  {resultIcons[scanResult.status as keyof typeof resultIcons]}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <p className={`text-4xl font-bold ${scanResult.status === 'success' ? 'text-emerald-600' : scanResult.status === 'error' ? 'text-rose-600' : 'text-amber-600'}`}>
                      {scanResult.message}
                  </p>
                  {scanResult.student ? (
                    <>
                      <p className="text-3xl text-slate-800 mt-2">{scanResult.student.name}</p>
                      <p className="text-xl text-slate-500">NIS: {scanResult.student.id} | Kelas: {scanResult.class?.name || 'N/A'}</p>
                      <p className="text-2xl font-semibold text-slate-700 mt-2">Waktu: {scanResult.time}</p>
                    </>
                  ) : (
                     <p className="text-xl text-slate-600 mt-2">Pastikan NIS sudah benar dan terdaftar.</p>
                  )}
                </div>
                {scanResult.student?.photoUrl && (
                    <img src={scanResult.student.photoUrl} alt={scanResult.student.name} className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-lg" />
                )}
              </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default BarcodeScanner;