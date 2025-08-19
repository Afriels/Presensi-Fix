
import React, { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Student, AttendanceRecord, AttendanceStatus } from '../types';
import Card, { CardHeader, CardTitle } from './ui/Card';
import { getTodayDateString } from '../services/dataService';

const ManualInput: React.FC = () => {
    const [studentId, setStudentId] = useState('');
    const [date, setDate] = useState(getTodayDateString());
    const [status, setStatus] = useState<AttendanceStatus>(AttendanceStatus.IJIN);
    const [notes, setNotes] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'idle', text: string }>({ type: 'idle', text: '' });
    
    const [students] = useLocalStorage<Student[]>('students', []);
    const [attendance, setAttendance] = useLocalStorage<AttendanceRecord[]>('attendance', []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!studentId) {
            setMessage({ type: 'error', text: 'Silakan pilih siswa.' });
            return;
        }

        const student = students.find(s => s.id === studentId);
        if (!student) {
            setMessage({ type: 'error', text: 'Siswa tidak ditemukan.' });
            return;
        }

        const newRecord: AttendanceRecord = {
            id: `att-${studentId}-${date}-${Math.random()}`, // Add random factor to avoid collision
            studentId,
            date,
            checkIn: null,
            checkOut: null,
            status,
            notes,
        };

        setAttendance(prev => {
            const otherRecords = prev.filter(r => !(r.studentId === studentId && r.date === date));
            return [...otherRecords, newRecord];
        });

        setMessage({ type: 'success', text: `Absensi untuk ${student.name} berhasil disimpan.` });
        setStudentId('');
        setNotes('');
        setStatus(AttendanceStatus.IJIN);
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Input Absensi Manual</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Gunakan form ini untuk siswa yang ijin, sakit, atau lupa membawa kartu.</p>
            </CardHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="student" className="block text-sm font-medium text-gray-700">Siswa</label>
                    <select id="student" value={studentId} onChange={e => setStudentId(e.target.value)} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                        <option value="">Pilih Siswa</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">Tanggal</label>
                    <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                </div>
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                    <select id="status" value={status} onChange={e => setStatus(e.target.value as AttendanceStatus)} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                        <option value={AttendanceStatus.IJIN}>Ijin</option>
                        <option value={AttendanceStatus.SAKIT}>Sakit</option>
                        <option value={AttendanceStatus.HADIR}>Hadir (Lupa Kartu)</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Keterangan (Opsional)</label>
                    <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"></textarea>
                </div>
                <div className="flex justify-end">
                    <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition">
                        Simpan
                    </button>
                </div>
            </form>
            {message.text && (
                <div className={`mt-4 p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}
        </Card>
    );
};

export default ManualInput;