import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Student, Class, AppSettings } from '../types';
import Card, { CardHeader, CardTitle } from './ui/Card';
import QRCode from 'qrcode';
import { supabase, TablesInsert, TablesUpdate } from '../services/supabase';
import { useAuth } from './auth/Auth';

const StudentData: React.FC = () => {
    const { user } = useAuth();
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [qrStudent, setQrStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [studentsRes, classesRes] = await Promise.all([
                supabase.from('students').select('*').order('name', { ascending: true }),
                supabase.from('classes').select('*').order('name', { ascending: true })
            ]);

            if (studentsRes.error) throw studentsRes.error;
            if (classesRes.error) throw classesRes.error;

            const appStudents: Student[] = (studentsRes.data || []).map(dbStudent => ({
                id: dbStudent.id,
                name: dbStudent.name,
                classId: dbStudent.class_id,
                photoUrl: dbStudent.photo_url || `https://picsum.photos/seed/${dbStudent.id}/200`,
            }));
            
            setStudents(appStudents);
            setClasses(classesRes.data || []);
        } catch (err: any) {
            setError('Gagal memuat data: ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredStudents = useMemo(() => {
        return students.filter(student =>
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.id.includes(searchTerm)
        );
    }, [students, searchTerm]);

    const openModal = (student: Student | null = null) => {
        setEditingStudent(student);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingStudent(null);
    };

    const handleSave = async (student: Student) => {
        try {
            if (editingStudent) { // Update
                const studentToUpdate: TablesUpdate<'students'> = { name: student.name, class_id: student.classId };
                const { error } = await supabase
                    .from('students')
                    .update(studentToUpdate)
                    .eq('id', student.id);
                if (error) throw error;
            } else { // Insert
                 const newStudentData: TablesInsert<'students'> = {
                    id: student.id,
                    name: student.name,
                    class_id: student.classId,
                    photo_url: `https://picsum.photos/seed/${student.id}/200`
                };
                
                const { error } = await supabase
                    .from('students')
                    .insert(newStudentData);
                if (error) throw error;
            }
            fetchData(); // Refresh data
            closeModal();
        } catch(err: any) {
            alert('Gagal menyimpan data: ' + err.message);
        }
    };

    const handleDelete = async (studentId: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) {
            try {
                const { error } = await supabase
                    .from('students')
                    .delete()
                    .eq('id', studentId);
                if(error) throw error;
                // Optimistic UI update
                setStudents(prev => prev.filter(s => s.id !== studentId));
            } catch(err: any) {
                alert('Gagal menghapus data: ' + err.message);
            }
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <CardTitle>Data Siswa</CardTitle>
                    {user?.role === 'admin' && (
                        <button onClick={() => openModal()} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition w-full sm:w-auto">
                            Tambah Siswa
                        </button>
                    )}
                </div>
            </CardHeader>
            <input
                type="text"
                placeholder="Cari nama atau NIS siswa..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
             {loading && <p className="text-center py-4">Memuat data...</p>}
             {error && <p className="text-center py-4 text-red-500">{error}</p>}
             {!loading && !error && (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIS</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredStudents.map(student => (
                                <tr key={student.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{classMap.get(student.classId) || 'Tidak ada kelas'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end items-center gap-4">
                                            {user?.role === 'admin' && (
                                                <>
                                                    <button onClick={() => openModal(student)} className="text-primary-600 hover:text-primary-900">Edit</button>
                                                    <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:text-red-900">Hapus</button>
                                                </>
                                            )}
                                            <button onClick={() => setQrStudent(student)} className="text-green-600 hover:text-green-900">QR Code</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             )}
            {isModalOpen && <StudentModal student={editingStudent} classes={classes} onSave={handleSave} onClose={closeModal} />}
            {qrStudent && <QRCodeModal student={qrStudent} onClose={() => setQrStudent(null)} />}
        </Card>
    );
};

interface StudentModalProps {
    student: Student | null;
    classes: Class[];
    onSave: (student: Student) => void;
    onClose: () => void;
}

const StudentModal: React.FC<StudentModalProps> = ({ student, classes, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<Student>>(student || { id: '', name: '', classId: '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.id && formData.name && formData.classId) {
            setIsSaving(true);
            await onSave(formData as Student);
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">{student ? 'Edit Siswa' : 'Tambah Siswa'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="id" className="block text-sm font-medium text-gray-700">NIS</label>
                        <input type="text" name="id" id="id" value={formData.id} onChange={handleChange} required disabled={!!student} className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100" />
                    </div>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="classId" className="block text-sm font-medium text-gray-700">Kelas</label>
                        <select name="classId" id="classId" value={formData.classId} onChange={handleChange} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                            <option value="">Pilih Kelas</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300" disabled={isSaving}>Batal</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-300" disabled={isSaving}>
                            {isSaving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface QRCodeModalProps {
    student: Student;
    onClose: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ student, onClose }) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [schoolName, setSchoolName] = useState('SEKOLAH ANDA');

    useEffect(() => {
        QRCode.toDataURL(student.id, { width: 256, margin: 1, errorCorrectionLevel: 'H' })
            .then(url => setQrCodeUrl(url))
            .catch(err => console.error("Failed to generate QR code", err));
            
        const fetchSchoolName = async () => {
            const { data, error } = await supabase.from('app_settings').select('school_name').eq('id', 1).single();
            if (error) {
                console.error("Error fetching school name:", error);
                return;
            }
            if(data && data.school_name) {
                setSchoolName(data.school_name);
            }
        };
        fetchSchoolName();

    }, [student.id]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <style>
                {`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  .printable-card, .printable-card * {
                    visibility: visible;
                  }
                  .printable-card {
                    position: fixed;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    box-shadow: none !important;
                    border: 1px solid #333 !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                }
                `}
            </style>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center printable-area-container">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                    <div className="printable-card bg-white p-4 border-2 border-gray-200 rounded-lg text-center font-sans">
                        <h2 className="text-xl font-bold text-gray-800">KARTU TANDA SISWA</h2>
                        <p className="text-sm text-gray-500 mb-4 uppercase">{schoolName}</p>
                        <img src={student.photoUrl} alt={student.name} className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-primary-500 shadow-lg" />
                        <h3 className="text-2xl font-semibold mt-4">{student.name}</h3>
                        <p className="text-gray-600 text-lg">NIS: {student.id}</p>
                        {qrCodeUrl ? (
                             <img src={qrCodeUrl} alt="QR Code" className="mx-auto mt-4 w-48 h-48" />
                        ) : (
                            <div className="mx-auto mt-4 w-48 h-48 bg-gray-200 animate-pulse"></div>
                        )}
                    </div>
                    <div className="flex justify-end space-x-2 pt-4 no-print">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Tutup</button>
                        <button type="button" onClick={handlePrint} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Cetak</button>
                    </div>
                </div>
            </div>
        </>
    );
};


export default StudentData;
