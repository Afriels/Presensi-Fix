import React, { useState, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Student, Class, AttendanceRecord, AttendanceStatus } from '../types';
import Card, { CardHeader, CardTitle } from './ui/Card';
import { getTodayDateString, getCurrentTimeString } from '../services/dataService';
import { PlusIcon, PencilIcon, TrashIcon } from '../constants';

const DailyReport: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [selectedClass, setSelectedClass] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Partial<AttendanceRecord> | null>(null);

  const [students] = useLocalStorage<Student[]>('students', []);
  const [classes] = useLocalStorage<Class[]>('classes', []);
  const [attendance, setAttendance] = useLocalStorage<AttendanceRecord[]>('attendance', []);

  const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

  const reportData = useMemo(() => {
    const filteredStudents = selectedClass === 'all'
      ? students
      : students.filter(s => s.classId === selectedClass);
    
    const attendanceForDate = new Map(
        attendance
            .filter(a => a.date === selectedDate)
            .map(a => [a.studentId, a])
    );
    
    return filteredStudents.map(student => {
      const record = attendanceForDate.get(student.id);
      return {
        student,
        record: record || { id: `placeholder-${student.id}`, studentId: student.id, date: selectedDate, status: AttendanceStatus.ALPA, checkIn: null, checkOut: null, notes: 'Tanpa Keterangan' }
      };
    }).sort((a, b) => a.student.name.localeCompare(b.student.name));

  }, [selectedDate, selectedClass, students, attendance]);
  
  const handleOpenModal = (record: Partial<AttendanceRecord> | null) => {
    if (record) {
      setEditingRecord(record);
    } else {
      setEditingRecord({ date: selectedDate, status: AttendanceStatus.HADIR, checkIn: getCurrentTimeString() });
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const handleSave = (recordToSave: Partial<AttendanceRecord>) => {
    setAttendance(prev => {
      const existingIndex = prev.findIndex(r => r.id === recordToSave.id);
      if (existingIndex > -1) {
        // Update existing
        const updated = [...prev];
        updated[existingIndex] = recordToSave as AttendanceRecord;
        return updated;
      } else {
        // Add new
        const newRecord: AttendanceRecord = {
          id: `att-${recordToSave.studentId}-${recordToSave.date}-${Math.random()}`,
          ...recordToSave
        } as AttendanceRecord;
         const otherRecords = prev.filter(r => !(r.studentId === newRecord.studentId && r.date === newRecord.date));
        return [...otherRecords, newRecord];
      }
    });
    handleCloseModal();
  };

  const handleDelete = (recordId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data absensi ini?')) {
      setAttendance(prev => prev.filter(r => r.id !== recordId));
    }
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "NIS,Nama Siswa,Kelas,Status,Jam Masuk,Jam Pulang,Keterangan\n";
    
    reportData.forEach(({ student, record }) => {
      const row = [
        student.id,
        `"${student.name}"`,
        `"${classMap.get(student.classId) || ''}"`,
        record.status,
        record.checkIn || '-',
        record.checkOut || '-',
        `"${record.notes || ''}"`
      ].join(",");
      csvContent += row + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_harian_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch(status) {
      case AttendanceStatus.HADIR: return 'bg-green-100 text-green-800';
      case AttendanceStatus.TERLAMBAT: return 'bg-yellow-100 text-yellow-800';
      case AttendanceStatus.SAKIT: return 'bg-orange-100 text-orange-800';
      case AttendanceStatus.IJIN: return 'bg-blue-100 text-blue-800';
      case AttendanceStatus.ALPA: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Laporan Absensi Harian</CardTitle>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={() => handleOpenModal(null)} className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition">
              <PlusIcon className="h-4 w-4 mr-2" />
              Tambah
            </button>
            <button onClick={exportToCSV} className="flex-1 sm:flex-none px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition">
              Export
            </button>
          </div>
        </div>
      </CardHeader>
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1">
          <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700">Tanggal</label>
          <input type="date" id="date-filter" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md" />
        </div>
        <div className="flex-1">
          <label htmlFor="class-filter" className="block text-sm font-medium text-gray-700">Kelas</label>
          <select id="class-filter" value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
            <option value="all">Semua Kelas</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="overflow-x-auto hidden md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Siswa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Masuk</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reportData.map(({ student, record }) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-500">NIS: {student.id} | {classMap.get(student.classId)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.checkIn || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">{record.notes || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end items-center gap-2">
                    <button onClick={() => handleOpenModal(record)} className="p-2 text-primary-600 hover:text-primary-900 hover:bg-gray-100 rounded-full"><PencilIcon className="h-4 w-4"/></button>
                    { !record.id.startsWith('placeholder-') &&
                        <button onClick={() => handleDelete(record.id)} className="p-2 text-red-600 hover:text-red-900 hover:bg-gray-100 rounded-full"><TrashIcon className="h-4 w-4"/></button>
                    }
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {reportData.map(({ student, record }) => (
          <div key={student.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-800">{student.name}</p>
                <p className="text-sm text-gray-500">NIS: {student.id} | {classMap.get(student.classId)}</p>
              </div>
               <span className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                    {record.status}
                </span>
            </div>
            <div className="mt-4 border-t pt-4 space-y-2 text-sm">
               <p><strong className="text-gray-600">Jam Masuk:</strong> {record.checkIn || '-'}</p>
               <p><strong className="text-gray-600">Keterangan:</strong> {record.notes || '-'}</p>
            </div>
            <div className="mt-4 flex justify-end items-center gap-2 border-t pt-2">
                <button onClick={() => handleOpenModal(record)} className="p-2 text-primary-600 hover:bg-gray-100 rounded-full"><PencilIcon className="h-5 w-5"/></button>
                { !record.id.startsWith('placeholder-') &&
                    <button onClick={() => handleDelete(record.id)} className="p-2 text-red-600 hover:bg-gray-100 rounded-full"><TrashIcon className="h-5 w-5"/></button>
                }
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && <AttendanceModal record={editingRecord} students={students} onClose={handleCloseModal} onSave={handleSave} />}
    </Card>
  );
};


interface AttendanceModalProps {
    record: Partial<AttendanceRecord> | null;
    students: Student[];
    onSave: (record: Partial<AttendanceRecord>) => void;
    onClose: () => void;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({ record, students, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<AttendanceRecord>>(record || {});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.studentId && formData.date && formData.status) {
            onSave(formData);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">{record?.id ? 'Edit Absensi' : 'Tambah Absensi'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">Siswa</label>
                        <select name="studentId" id="studentId" value={formData.studentId} onChange={handleChange} required disabled={!!record?.id} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md disabled:bg-gray-100">
                            <option value="">Pilih Siswa</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">Tanggal</label>
                        <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"/>
                    </div>
                     <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                        <select name="status" id="status" value={formData.status} onChange={handleChange} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                            {Object.values(AttendanceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700">Jam Masuk (Opsional)</label>
                        <input type="time" name="checkIn" id="checkIn" value={formData.checkIn || ''} onChange={handleChange} step="1" className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"/>
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Keterangan (Opsional)</label>
                        <textarea name="notes" id="notes" value={formData.notes || ''} onChange={handleChange} rows={3} className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"></textarea>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DailyReport;