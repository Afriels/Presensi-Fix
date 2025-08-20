import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Student, AttendanceStatus, AppSettings, Class } from '../types';
import { getTodayDateString, getCurrentTimeString } from '../services/dataService';
import Card from './ui/Card';
import { SOUNDS } from '../constants';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '../services/supabase';

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
        const settingsPromise = supabase.from('app_settings').select('*').eq('id', 1).single();
        const classesPromise = supabase.from('classes').select('*');

        const [settingsResult, classesResult] = await Promise.all([settingsPromise, classesPromise]);

        if (settingsResult.error) {
            console.error("Error fetching app settings:", settingsResult.error);
        } else if (settingsResult.data) {
            setSettings({
                entryTime: settingsResult.data.entry_time,
                lateTime: settingsResult.data.late_time,
                exitTime: settingsResult.data.exit_time,
            });
        }
        
        if (classesResult.error) {
            console.error("Error fetching classes:", classesResult.error);
        } else if (classesResult.data) {
            setClasses(classesResult.data);
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
        // 1. Find student
        const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select(`*`)
            .eq('id', id)
            .single();

        if (studentError || !studentData) {
            setScanResult({ status: 'error', message: 'Nomor induk tidak terdaftar!' });
            playSound(SOUNDS.ERROR);
            return;
        }

        const student: Student = {
            id: studentData.id,
            name: studentData.name,
            classId: studentData.class_id,
            photoUrl: studentData.photo_url || `https://picsum.photos/seed/${studentData.id}/200`
        };
        
        const studentClassName = classMap.get(student.classId);
        const studentClass: Class | undefined = studentClassName ? { id: student.classId, name: studentClassName } : undefined;


        // 2. Check for existing attendance
        const { data: existingRecord, error: existingError } = await supabase
            .from('attendance_records')
            .select('check_in')
            .eq('student_id', id)
            .eq('date', today)
            .maybeSingle();
        
        if (existingError) throw existingError;

        if (existingRecord?.check_in) {
            setScanResult({ status: 'warning', message: `Siswa sudah absen masuk pada jam ${existingRecord.check_in}.`, student, class: studentClass, time: existingRecord.check_in });
            playSound(SOUNDS.WARNING);
            return;
        }

        // 3. Determine status and create new record
        const currentTimeDate = new Date(`${today}T${currentTime}`);
        const lateTimeDate = new Date(`${today}T${settings.lateTime}:00`);
        const status = currentTimeDate > lateTimeDate ? AttendanceStatus.TERLAMBAT : AttendanceStatus.HADIR;

        const newRecord = {
            student_id: id,
            date: today,
            check_in: currentTime,
            check_out: null,
            status: status,
        };
        
        const { error: insertError } = await supabase.from('attendance_records').insert(newRecord);
        if (insertError) throw insertError;
        
        setScanResult({ status: 'success', message: `Absensi berhasil: ${status}`, student, class: studentClass, time: currentTime });
        playSound(SOUNDS.SUCCESS);

    } catch (err: any) {
        console.error("Error during scan handling:", err);
        setScanResult({ status: 'error', message: 'Terjadi kesalahan: ' + err.message });
        playSound(SOUNDS.ERROR);
    }

  }, [settings.lateTime, classMap]);
  
  useEffect(() => {
    if (!isScannerVisible) return;

    const scanner = new Html5QrcodeScanner(
        "reader",
        {
            qrbox: { width: 250, height: 250 },
            fps: 10,
            videoConstraints: {
                facingMode: "environment"
            }
        },
        false
    );

    let isScanning = true;

    const onScanSuccess = (decodedText: string) => {
        if (isScanning) {
            isScanning = false;
            handleScan(decodedText);
            scanner.clear().catch(error => console.error("Failed to clear scanner", error));
            setIsScannerVisible(false);
        }
    };

    const onScanFailure = (error: any) => { /* ignore */ };

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
        if (scanner && scanner.getState()) {
            scanner.clear().catch(error => console.error("Failed to clear scanner on cleanup", error));
        }
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
    loading: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="flex flex-col items-center h-full">
      <Card className="w-full max-w-4xl text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Absensi Barcode</h1>
        
        {isScannerVisible ? (
            <div>
                <div id="reader" className="w-full max-w-sm mx-auto rounded-lg overflow-hidden border-2 border-gray-200"></div>
                <button
                    onClick={() => {
                        playSound(SOUNDS.CAMERA_CLOSE);
                        setIsScannerVisible(false);
                    }}
                    className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                >
                    Tutup Kamera
                </button>
            </div>
        ) : (
            <div>
                <p className="text-gray-600 mb-6">Letakkan kartu di depan kamera atau ketik NIS secara manual.</p>
                <form onSubmit={handleSubmit} className="mb-4">
                    <input
                        ref={inputRef}
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="w-full px-4 py-3 text-2xl border-2 border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition"
                        placeholder="Ketik NIS..."
                        autoFocus
                    />
                </form>
                <button
                    onClick={() => {
                        playSound(SOUNDS.CAMERA_OPEN);
                        setIsScannerVisible(true);
                    }}
                    className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition flex items-center justify-center w-full sm:w-auto mx-auto shadow-md"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
                    Pindai dengan Kamera
                </button>
            </div>
        )}
      </Card>
      
      <Card className={`w-full max-w-4xl mt-6 transition-all duration-300 ${resultColors[scanResult.status]}`}>
        { (scanResult.status === 'idle' || scanResult.status === 'loading') && (
             <div className="text-center py-12">
                <p className="text-2xl font-medium text-gray-500">{scanResult.message}</p>
                 {scanResult.status === 'loading' && <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>}
             </div>
        )}
        { (scanResult.status !== 'idle' && scanResult.status !== 'loading') && (
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