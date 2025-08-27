
import React, { useState } from 'react';
import { AttendanceRecord, Student, AttendanceStatus } from '../../types';

interface AttendanceModalProps {
    record: Partial<AttendanceRecord> | null;
    students: Student[];
    onSave: (record: Partial<AttendanceRecord>) => void;
    onClose: () => void;
    isStudentFieldDisabled?: boolean;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({ record, students, onSave, onClose, isStudentFieldDisabled = false }) => {
    const [formData, setFormData] = useState<Partial<AttendanceRecord>>(record || {});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.studentId && formData.date && formData.status) {
            onSave(formData);
        } else {
            alert("Harap lengkapi semua field yang wajib diisi.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">{record?.id ? 'Edit Absensi' : 'Tambah Absensi'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">Siswa</label>
                        <select name="studentId" id="studentId" value={formData.studentId || ''} onChange={handleChange} required disabled={isStudentFieldDisabled || !!record?.studentId} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md disabled:bg-gray-100">
                            <option value="">Pilih Siswa</option>
                            {students.sort((a,b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">Tanggal</label>
                        <input type="date" name="date" id="date" value={formData.date || ''} onChange={handleChange} required className="mt-1 focus:ring-sky-500 focus:border-sky-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"/>
                    </div>
                     <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                        <select name="status" id="status" value={formData.status || ''} onChange={handleChange} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md">
                            {Object.values(AttendanceStatus).filter(s => s !== AttendanceStatus.ALPA).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700">Jam Masuk (Opsional)</label>
                        <input type="time" name="checkIn" id="checkIn" value={formData.checkIn || ''} onChange={handleChange} step="1" className="mt-1 focus:ring-sky-500 focus:border-sky-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"/>
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Keterangan (Opsional)</label>
                        <textarea name="notes" id="notes" value={formData.notes || ''} onChange={handleChange} rows={3} className="mt-1 focus:ring-sky-500 focus:border-sky-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"></textarea>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AttendanceModal;