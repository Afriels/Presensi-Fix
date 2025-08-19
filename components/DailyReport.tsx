import React, { useState, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Student, Class, AttendanceRecord, AttendanceStatus } from '../types';
import Card, { CardHeader, CardTitle } from './ui/Card';
import { getTodayDateString } from '../services/dataService';

const DailyReport: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [selectedClass, setSelectedClass] = useState('all');
  
  const [students] = useLocalStorage<Student[]>('students', []);
  const [classes] = useLocalStorage<Class[]>('classes', []);
  const [attendance] = useLocalStorage<AttendanceRecord[]>('attendance', []);

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
        record: record || { status: AttendanceStatus.ALPA, checkIn: null, checkOut: null, notes: 'Tanpa Keterangan' }
      };
    });

  }, [selectedDate, selectedClass, students, attendance]);
  
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
          <button onClick={exportToCSV} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition w-full sm:w-auto">
            Export ke Excel
          </button>
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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIS</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Siswa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Masuk</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reportData.map(({ student, record }) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{classMap.get(student.classId)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.checkIn || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default DailyReport;