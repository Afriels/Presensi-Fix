
import React, { useState, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Student, Class, AttendanceRecord, AttendanceStatus } from '../types';
import Card, { CardHeader, CardTitle } from './ui/Card';
import { PencilIcon, TrashIcon, PlusIcon } from '../constants';
import AttendanceModal from './modals/AttendanceModal';
import { getCurrentTimeString, getTodayDateString } from '../services/dataService';

const MonthlyReport: React.FC = () => {
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(`${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`);
    const [selectedClass, setSelectedClass] = useState('all');
    
    const [students] = useLocalStorage<Student[]>('students', []);
    const [classes] = useLocalStorage<Class[]>('classes', []);
    const [attendance, setAttendance] = useLocalStorage<AttendanceRecord[]>('attendance', []);
    
    const [detailModalStudent, setDetailModalStudent] = useState<Student | null>(null);
    const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<Partial<AttendanceRecord> | null>(null);

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
                [AttendanceStatus.HADIR]: studentAttendance.filter(a => a.status === AttendanceStatus.HADIR).length,
                [AttendanceStatus.TERLAMBAT]: studentAttendance.filter(a => a.status === AttendanceStatus.TERLAMBAT).length,
                [AttendanceStatus.SAKIT]: studentAttendance.filter(a => a.status === AttendanceStatus.SAKIT).length,
                [AttendanceStatus.IJIN]: studentAttendance.filter(a => a.status === AttendanceStatus.IJIN).length,
                [AttendanceStatus.ALPA]: 0 // Alpa is calculated differently if needed, here we just count records
            };
            
            return { student, summary };
        }).sort((a, b) => {
            const nameComparison = a.student.name.localeCompare(b.student.name);
            if (nameComparison !== 0) return nameComparison;
            return a.student.id.localeCompare(b.student.id);
        });
    }, [selectedMonth, selectedClass, students, attendance]);

    const handleOpenCrudModal = (record: Partial<AttendanceRecord> | null) => {
        if (record) {
            setEditingRecord(record);
        } else {
            setEditingRecord({
                studentId: detailModalStudent?.id,
                date: getTodayDateString(),
                status: AttendanceStatus.HADIR,
                checkIn: getCurrentTimeString(),
            });
        }
        setIsCrudModalOpen(true);
    };

    const handleCloseCrudModal = () => {
        setIsCrudModalOpen(false);
        setEditingRecord(null);
    };

    const handleSave = (recordToSave: Partial<AttendanceRecord>) => {
        setAttendance(prev => {
            const existingIndex = prev.findIndex(r => r.id === recordToSave.id);
            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex] = { ...updated[existingIndex], ...recordToSave } as AttendanceRecord;
                return updated;
            } else {
                const otherRecords = prev.filter(r => !(r.studentId === recordToSave.studentId && r.date === recordToSave.date));
                const newRecord: AttendanceRecord = {
                    id: `att-${recordToSave.studentId}-${recordToSave.date}-${Date.now()}`,
                    checkOut: null,
                    ...recordToSave
                } as AttendanceRecord;
                return [...otherRecords, newRecord];
            }
        });
        handleCloseCrudModal();
    };

    const handleDelete = (recordId: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus data absensi ini?')) {
            setAttendance(prev => prev.filter(r => r.id !== recordId));
        }
    };
    
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <CardTitle>Rekap Absensi Bulanan</CardTitle>
                    <button onClick={exportToCSV} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition w-full sm:w-auto">
                        Export ke CSV
                    </button>
                </div>
            </CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                    <label htmlFor="month-filter" className="block text-sm font-medium text-gray-700">Bulan</label>
                    <input type="month" id="month-filter" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md" />
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hadir</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Terlambat</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Sakit</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ijin</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.map(({ student, summary }) => (
                            <tr key={student.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                    <div className="text-sm text-gray-500">NIS: {student.id} | {classMap.get(student.classId)}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-green-600">{summary[AttendanceStatus.HADIR]}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-yellow-600">{summary[AttendanceStatus.TERLAMBAT]}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-orange-600">{summary[AttendanceStatus.SAKIT]}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-blue-600">{summary[AttendanceStatus.IJIN]}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => setDetailModalStudent(student)} className="text-primary-600 hover:text-primary-900">Detail</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {reportData.map(({ student, summary }) => (
                    <div key={student.id} className="bg-white p-4 rounded-lg shadow">
                         <div>
                            <p className="font-bold text-gray-800">{student.name}</p>
                            <p className="text-sm text-gray-500">NIS: {student.id} | {classMap.get(student.classId)}</p>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 text-center border-t pt-4">
                            <div><p className="text-xs text-gray-500">Hadir</p><p className="font-bold text-lg text-green-600">{summary[AttendanceStatus.HADIR]}</p></div>
                            <div><p className="text-xs text-gray-500">Terlambat</p><p className="font-bold text-lg text-yellow-600">{summary[AttendanceStatus.TERLAMBAT]}</p></div>
                            <div><p className="text-xs text-gray-500">Sakit</p><p className="font-bold text-lg text-orange-600">{summary[AttendanceStatus.SAKIT]}</p></div>
                            <div><p className="text-xs text-gray-500">Ijin</p><p className="font-bold text-lg text-blue-600">{summary[AttendanceStatus.IJIN]}</p></div>
                        </div>
                        <div className="mt-4 border-t pt-2 text-right">
                             <button onClick={() => setDetailModalStudent(student)} className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200">Lihat Detail</button>
                        </div>
                    </div>
                ))}
            </div>

            {detailModalStudent && (
                <StudentDetailModal
                    student={detailModalStudent}
                    month={selectedMonth}
                    attendance={attendance}
                    onClose={() => setDetailModalStudent(null)}
                    onEdit={handleOpenCrudModal}
                    onAdd={() => handleOpenCrudModal(null)}
                    onDelete={handleDelete}
                />
            )}
            
            {isCrudModalOpen && detailModalStudent && (
                <AttendanceModal
                    record={editingRecord}
                    students={[detailModalStudent]}
                    onClose={handleCloseCrudModal}
                    onSave={handleSave}
                    isStudentFieldDisabled={true}
                />
            )}
        </Card>
    );
};


interface StudentDetailModalProps {
  student: Student;
  month: string;
  attendance: AttendanceRecord[];
  onClose: () => void;
  onEdit: (record: AttendanceRecord) => void;
  onAdd: () => void;
  onDelete: (recordId: string) => void;
}

const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ student, month, attendance, onClose, onEdit, onAdd, onDelete }) => {
  const studentMonthlyAttendance = useMemo(() => {
    return attendance
      .filter(a => a.studentId === student.id && a.date.startsWith(month))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [student.id, month, attendance]);

  const getStatusColor = (status: AttendanceStatus) => {
    switch(status) {
      case AttendanceStatus.HADIR: return 'bg-green-100 text-green-800';
      case AttendanceStatus.TERLAMBAT: return 'bg-yellow-100 text-yellow-800';
      case AttendanceStatus.SAKIT: return 'bg-orange-100 text-orange-800';
      case AttendanceStatus.IJIN: return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-4 border-b">
                <div>
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Detail Absensi: {student.name}</h3>
                    <p className="text-sm text-gray-500">Bulan: {new Date(month + '-02').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
                </div>
                <button onClick={onAdd} className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
                    <PlusIcon className="h-4 w-4 mr-1"/> Tambah
                </button>
            </div>
            <div className="flex-grow overflow-y-auto">
                {studentMonthlyAttendance.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {studentMonthlyAttendance.map(record => (
                            <li key={record.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex-1 mb-2 sm:mb-0">
                                    <div className="flex items-center">
                                        <span className="font-semibold">{new Date(record.date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                        <span className={`ml-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>{record.status}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {record.checkIn ? `Masuk: ${record.checkIn}` : 'Tidak ada jam masuk'}
                                        {record.notes && ` | Ket: ${record.notes}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 self-end sm:self-center">
                                    <button onClick={() => onEdit(record)} className="p-2 text-primary-600 hover:bg-gray-100 rounded-full"><PencilIcon className="h-4 w-4"/></button>
                                    <button onClick={() => onDelete(record.id)} className="p-2 text-red-600 hover:bg-gray-100 rounded-full"><TrashIcon className="h-4 w-4"/></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500 py-8">Tidak ada data absensi untuk bulan ini.</p>
                )}
            </div>
            <div className="flex justify-end pt-4 mt-4 border-t">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Tutup</button>
            </div>
        </div>
    </div>
  )
};

export default MonthlyReport;