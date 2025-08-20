import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Student, Class, AttendanceRecord, AttendanceStatus } from '../types';
import Card, { CardHeader, CardTitle } from './ui/Card';
import { getTodayDateString, getCurrentTimeString } from '../services/dataService';
import { PlusIcon, PencilIcon, TrashIcon } from '../constants';
import AttendanceModal from './modals/AttendanceModal';
import { supabase } from '../services/supabase';
import { useAuth } from './auth/Auth';

const DailyReport: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [selectedClass, setSelectedClass] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Partial<AttendanceRecord> | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsRes, classesRes, attendanceRes] = await Promise.all([
        supabase.from('students').select('*'),
        supabase.from('classes').select('*'),
        supabase.from('attendance_records').select('*').eq('date', selectedDate)
      ]);
      if (studentsRes.error) throw studentsRes.error;
      if (classesRes.error) throw classesRes.error;
      if (attendanceRes.error) throw attendanceRes.error;

      setStudents((studentsRes.data || []).map(s => ({ id: s.id, name: s.name, classId: s.class_id, photoUrl: s.photo_url || '' })));
      setClasses(classesRes.data || []);
      setAttendance((attendanceRes.data || []).map(a => ({
        id: a.id, studentId: a.student_id, date: a.date, checkIn: a.check_in, checkOut: a.check_out, status: a.status as AttendanceStatus, notes: a.notes || undefined
      })));

    } catch (err) {
      console.error("Error fetching daily report data:", err);
      alert('Gagal memuat data laporan harian.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const reportData = useMemo(() => {
    const filteredStudents = selectedClass === 'all'
      ? students
      : students.filter(s => s.classId === selectedClass);
    
    const attendanceForDate = new Map(attendance.map(a => [a.studentId, a]));
    
    return filteredStudents.map(student => {
      const record = attendanceForDate.get(student.id);
      return {
        student,
        record: record || { studentId: student.id, date: selectedDate, status: AttendanceStatus.ALPA, checkIn: null, checkOut: null, notes: 'Tanpa Keterangan' }
      };
    }).sort((a, b) => a.student.name.localeCompare(b.student.name));
  }, [selectedClass, students, attendance, selectedDate]);
  
  const handleOpenModal = (record: Partial<AttendanceRecord> | null) => {
    if (record) {
      if(!record.id) { // This is a placeholder for an 'ALPA' student
          setEditingRecord({
              studentId: record.studentId,
              date: selectedDate,
              status: AttendanceStatus.HADIR,
              checkIn: getCurrentTimeString()
          });
      } else {
          setEditingRecord(record);
      }
    } else {
      setEditingRecord({ date: selectedDate, status: AttendanceStatus.HADIR, checkIn: getCurrentTimeString() });
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const handleSave = async (recordToSave: Partial<AttendanceRecord>) => {
    try {
      if (recordToSave.id) { // Update
        const { error } = await supabase.from('attendance_records').update({
          date: recordToSave.date,
          status: recordToSave.status,
          check_in: recordToSave.checkIn,
          notes: recordToSave.notes
        }).eq('id', recordToSave.id);
        if (error) throw error;
      } else { // Insert
        const { error } = await supabase.from('attendance_records').insert({
          student_id: recordToSave.studentId!,
          date: recordToSave.date!,
          status: recordToSave.status!,
          check_in: recordToSave.checkIn,
          notes: recordToSave.notes
        });
        if (error) throw error;
      }
      fetchData(); // Refresh data
      handleCloseModal();
    } catch (err: any) {
      alert("Gagal menyimpan data: " + err.message);
    }
  };

  const handleDelete = async (recordId: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data absensi ini?')) {
      try {
        const { error } = await supabase.from('attendance_records').delete().eq('id', recordId);
        if (error) throw error;
        setAttendance(prev => prev.filter(r => r.id !== recordId)); // Optimistic UI update
      } catch (err: any) {
        alert("Gagal menghapus data: " + err.message);
      }
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
            {user?.role === 'admin' && (
              <button onClick={() => handleOpenModal(null)} className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition">
                <PlusIcon className="h-4 w-4 mr-2" />
                Tambah
              </button>
            )}
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

      {loading ? <p className="text-center py-4">Memuat data laporan...</p> : (
        <>
          {/* Desktop Table View */}
          <div className="overflow-x-auto hidden md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Siswa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Masuk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
                  {user?.role === 'admin' && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>}
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
                    {user?.role === 'admin' && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center gap-2">
                            <button onClick={() => handleOpenModal(record)} className="p-2 text-primary-600 hover:text-primary-900 hover:bg-gray-100 rounded-full"><PencilIcon className="h-4 w-4"/></button>
                            { 'id' in record && record.id &&
                                <button onClick={() => handleDelete(record.id!)} className="p-2 text-red-600 hover:text-red-900 hover:bg-gray-100 rounded-full"><TrashIcon className="h-4 w-4"/></button>
                            }
                        </div>
                        </td>
                    )}
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
                {user?.role === 'admin' && (
                    <div className="mt-4 flex justify-end items-center gap-2 border-t pt-2">
                        <button onClick={() => handleOpenModal(record)} className="p-2 text-primary-600 hover:bg-gray-100 rounded-full"><PencilIcon className="h-5 w-5"/></button>
                        { 'id' in record && record.id &&
                            <button onClick={() => handleDelete(record.id!)} className="p-2 text-red-600 hover:bg-gray-100 rounded-full"><TrashIcon className="h-5 w-5"/></button>
                        }
                    </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {isModalOpen && <AttendanceModal record={editingRecord} students={students} onClose={handleCloseModal} onSave={handleSave} />}
    </Card>
  );
};

export default DailyReport;