
import React, { useState, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Student, Class, AttendanceRecord, AttendanceStatus } from '../types';
import Card, { CardHeader, CardTitle } from './ui/Card';

const MonthlyReport: React.FC = () => {
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(`${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`);
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
        
        return filteredStudents.map(student => {
            const studentAttendance = attendance.filter(
                a => a.studentId === student.id && a.date.startsWith(selectedMonth)
            );
            
            const summary = {
                [AttendanceStatus.HADIR]: 0,
                [AttendanceStatus.TERLAMBAT]: 0,
                [AttendanceStatus.SAKIT]: 0,
                [AttendanceStatus.IJIN]: 0,
                [AttendanceStatus.ALPA]: 0,
            };
            
            studentAttendance.forEach(record => {
                if (summary[record.status] !== undefined) {
                    summary[record.status]++;
                }
            });

            // Note: This simplified version doesn't calculate ALPA based on school days.
            // A full implementation would need to know the number of school days in the month.
            
            return {
                student,
                summary
            };
        });
    }, [selectedMonth, selectedClass, students, attendance]);
    
    const exportToCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "NIS,Nama Siswa,Kelas,Hadir,Terlambat,Sakit,Ijin\n";
        
        reportData.forEach(({ student, summary }) => {
            const row = [
                student.id,
                `"${student.name}"`,
                `"${classMap.get(student.classId) || ''}"`,
                summary[AttendanceStatus.HADIR],
                summary[AttendanceStatus.TERLAMBAT],
                summary[AttendanceStatus.SAKIT],
                summary[AttendanceStatus.IJIN],
            ].join(",");
            csvContent += row + "\n";
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `rekap_bulanan_${selectedMonth}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Rekap Absensi Bulanan</CardTitle>
                    <button onClick={exportToCSV} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition">
                        Export ke Excel
                    </button>
                </div>
            </CardHeader>
            <div className="flex items-center space-x-4 mb-4">
                <div>
                    <label htmlFor="month-filter" className="block text-sm font-medium text-gray-700">Bulan</label>
                    <input type="month" id="month-filter" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md" />
                </div>
                <div>
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hadir</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Terlambat</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Sakit</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ijin</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.map(({ student, summary }) => (
                            <tr key={student.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                    <div className="text-sm text-gray-500">NIS: {student.id}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-800">{summary[AttendanceStatus.HADIR]}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-800">{summary[AttendanceStatus.TERLAMBAT]}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-800">{summary[AttendanceStatus.SAKIT]}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-800">{summary[AttendanceStatus.IJIN]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default MonthlyReport;