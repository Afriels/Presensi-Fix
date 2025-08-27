
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { Student, Class, AppSettings } from '../types';
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
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [multiPrintStudents, setMultiPrintStudents] = useState<Student[] | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | 'idle'; message: string }>({ type: 'idle', message: '' });

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
                photoUrl: dbStudent.photo_url || undefined,
                nisn: dbStudent.nisn || undefined,
                pob: dbStudent.pob || undefined,
                dob: dbStudent.dob || undefined,
                address: dbStudent.address || undefined,
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

    useEffect(() => {
        setSelectedStudentIds(new Set());
    }, [searchTerm]);

    const openModal = (student: Student | null = null) => {
        setEditingStudent(student);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingStudent(null);
    };

    const handleSave = async (student: Student, photoFile: File | null) => {
        try {
            let finalPhotoUrl = student.photoUrl;

            if (photoFile) {
                const fileExt = photoFile.name.split('.').pop();
                const filePath = `${student.id}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('student-photos')
                    .upload(filePath, photoFile, { upsert: true });
                
                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('student-photos')
                    .getPublicUrl(filePath);
                
                finalPhotoUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`;
            }

            const studentData: TablesInsert<'students'> = {
                id: student.id,
                name: student.name,
                class_id: student.classId,
                nisn: student.nisn,
                pob: student.pob,
                dob: student.dob,
                address: student.address,
                photo_url: finalPhotoUrl,
            };
            
            const { error } = await supabase.from('students').upsert(studentData);
            if (error) throw error;
            
            fetchData();
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
                setStudents(prev => prev.filter(s => s.id !== studentId));
            } catch(err: any) {
                alert('Gagal menghapus data: ' + err.message);
            }
        }
    };

    const handleSelectStudent = (id: string) => {
        const newSelection = new Set(selectedStudentIds);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedStudentIds(newSelection);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allIds = new Set(filteredStudents.map(s => s.id));
            setSelectedStudentIds(allIds);
        } else {
            setSelectedStudentIds(new Set());
        }
    };
    
    const handlePrintSelected = () => {
        const selected = students.filter(s => selectedStudentIds.has(s.id));
        setMultiPrintStudents(selected);
    };
    
    const handleDownloadTemplate = () => {
        const headers = ['id', 'name', 'class_id', 'nisn', 'pob', 'dob', 'address'];
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "template_import_siswa.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExport = () => {
        const headers = ['id', 'name', 'class_id', 'nisn', 'pob', 'dob', 'address', 'photo_url'];
        
        const rows = students.map(s => [
            s.id,
            `"${s.name.replace(/"/g, '""')}"`,
            s.classId,
            s.nisn || '',
            s.pob || '',
            s.dob || '',
            `"${(s.address || '').replace(/"/g, '""')}"`,
            s.photoUrl || ''
        ].join(','));
        
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `data_siswa_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportStatus({ type: 'idle', message: '' });

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
                if (lines.length < 2) throw new Error("File CSV kosong atau hanya berisi header.");

                const headerLine = lines[0].trim();
                const headers = headerLine.split(',').map(h => h.trim());
                
                const requiredHeaders = ['id', 'name', 'class_id'];
                for (const req of requiredHeaders) {
                    if (!headers.includes(req)) {
                        throw new Error(`Header yang dibutuhkan tidak ditemukan: ${req}`);
                    }
                }

                const studentsToUpsert: TablesInsert<'students'>[] = [];

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',');
                    const studentData: { [key: string]: any } = {};
                    headers.forEach((header, index) => {
                        studentData[header] = values[index]?.trim() || null;
                    });
                    
                    if (!studentData.id || !studentData.name || !studentData.class_id) {
                         console.warn(`Melewatkan baris ${i + 1} karena data wajib (id, name, class_id) tidak ada.`);
                         continue;
                    }

                    studentsToUpsert.push({
                        id: studentData.id,
                        name: studentData.name,
                        class_id: studentData.class_id,
                        nisn: studentData.nisn,
                        pob: studentData.pob,
                        dob: studentData.dob,
                        address: studentData.address,
                    });
                }
                
                if (studentsToUpsert.length === 0) throw new Error("Tidak ada data siswa yang valid untuk diimpor.");

                const { error: upsertError } = await supabase.from('students').upsert(studentsToUpsert);
                if (upsertError) throw upsertError;

                setImportStatus({ type: 'success', message: `${studentsToUpsert.length} data siswa berhasil diimpor/diperbarui.` });
                await fetchData();

            } catch (err: any) {
                setImportStatus({ type: 'error', message: `Gagal mengimpor: ${err.message}` });
            } finally {
                setIsImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };

        reader.onerror = () => {
             setImportStatus({ type: 'error', message: 'Gagal membaca file.' });
             setIsImporting(false);
        };
        
        reader.readAsText(file);
    };


    return (
        <Card>
            <CardHeader>
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <CardTitle>Data Siswa</CardTitle>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-start sm:justify-end">
                        {user?.role === 'admin' && (
                            <>
                                <input type="file" ref={fileInputRef} onChange={handleImport} accept=".csv" style={{ display: 'none' }} />
                                <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition disabled:bg-gray-400">
                                    {isImporting ? 'Mengimpor...' : 'Impor'}
                                </button>
                                <button onClick={handleExport} className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition">
                                    Ekspor
                                </button>
                                <button onClick={handleDownloadTemplate} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">
                                    Template
                                </button>
                            </>
                        )}
                        <button 
                            onClick={handlePrintSelected} 
                            disabled={selectedStudentIds.size === 0}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Cetak Kartu ({selectedStudentIds.size})
                        </button>
                        {user?.role === 'admin' && (
                            <button onClick={() => openModal()} className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition">
                                Tambah Siswa
                            </button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <input
                type="text"
                placeholder="Cari nama atau NIS siswa..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
            />
            {importStatus.message && (
                <div className={`my-4 p-3 rounded-md text-sm ${importStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {importStatus.message}
                </div>
            )}
             {loading && <p className="text-center py-4">Memuat data...</p>}
             {error && <p className="text-center py-4 text-red-500">{error}</p>}
             {!loading && !error && (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-sky-600 shadow-sm focus:border-sky-300 focus:ring focus:ring-sky-200 focus:ring-opacity-50"
                                        onChange={handleSelectAll}
                                        checked={filteredStudents.length > 0 && selectedStudentIds.size === filteredStudents.length}
                                        aria-label="Select all students"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIS</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredStudents.map(student => (
                                <tr key={student.id}>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-sky-600 shadow-sm focus:border-sky-300 focus:ring focus:ring-sky-200 focus:ring-opacity-50"
                                            checked={selectedStudentIds.has(student.id)}
                                            onChange={() => handleSelectStudent(student.id)}
                                            aria-labelledby={`student-name-${student.id}`}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.id}</td>
                                    <td id={`student-name-${student.id}`} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{classMap.get(student.classId) || 'Tidak ada kelas'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end items-center gap-4">
                                            {user?.role === 'admin' && (
                                                <>
                                                    <button onClick={() => openModal(student)} className="text-sky-600 hover:text-sky-900">Edit</button>
                                                    <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:text-red-900">Hapus</button>
                                                </>
                                            )}
                                            <button onClick={() => setQrStudent(student)} className="text-green-600 hover:text-green-900">Cetak Kartu</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             )}
            {isModalOpen && <StudentModal student={editingStudent} classes={classes} onSave={handleSave} onClose={closeModal} />}
            {qrStudent && <QRCodeModal student={qrStudent} studentClass={classMap.get(qrStudent.classId)} onClose={() => setQrStudent(null)} />}
            {multiPrintStudents && <MultiQRCodeModal students={multiPrintStudents} classMap={classMap} onClose={() => setMultiPrintStudents(null)} />}
        </Card>
    );
};

interface StudentModalProps {
    student: Student | null;
    classes: Class[];
    onSave: (student: Student, photoFile: File | null) => void;
    onClose: () => void;
}

const StudentModal: React.FC<StudentModalProps> = ({ student, classes, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<Student>>(student || { id: '', name: '', classId: '' });
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(student?.photoUrl || null);
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.id && formData.name && formData.classId) {
            setIsSaving(true);
            await onSave(formData as Student, photoFile);
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">{student ? 'Edit Siswa' : 'Tambah Siswa'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center justify-center mb-4">
                        {photoPreview ? (
                            <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover" />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M5.52 19c.64-2.2 1.84-3 3.22-3h6.52c1.38 0 2.58.8 3.22 3"/><circle cx="12" cy="10" r="3"/><circle cx="12" cy="12" r="10"/></svg>
                            </div>
                        )}
                    </div>
                     <div>
                        <label htmlFor="photoUrl" className="block text-sm font-medium text-gray-700">Foto Siswa</label>
                        <input type="file" name="photoUrl" id="photoUrl" accept="image/png, image/jpeg" onChange={handlePhotoChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"/>
                    </div>
                    <div>
                        <label htmlFor="id" className="block text-sm font-medium text-gray-700">No. Induk Siswa (NIS)</label>
                        <input type="text" name="id" id="id" value={formData.id} onChange={handleChange} required disabled={!!student} className="mt-1 focus:ring-sky-500 focus:border-sky-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100" />
                    </div>
                     <div>
                        <label htmlFor="nisn" className="block text-sm font-medium text-gray-700">NISN</label>
                        <input type="text" name="nisn" id="nisn" value={formData.nisn || ''} onChange={handleChange} className="mt-1 focus:ring-sky-500 focus:border-sky-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 focus:ring-sky-500 focus:border-sky-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                    </div>
                     <div>
                        <label htmlFor="pob" className="block text-sm font-medium text-gray-700">Tempat Lahir</label>
                        <input type="text" name="pob" id="pob" value={formData.pob || ''} onChange={handleChange} className="mt-1 focus:ring-sky-500 focus:border-sky-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="dob" className="block text-sm font-medium text-gray-700">Tanggal Lahir</label>
                        <input type="date" name="dob" id="dob" value={formData.dob || ''} onChange={handleChange} className="mt-1 focus:ring-sky-500 focus:border-sky-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Alamat</label>
                        <textarea name="address" id="address" value={formData.address || ''} onChange={handleChange} rows={3} className="mt-1 focus:ring-sky-500 focus:border-sky-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"></textarea>
                    </div>
                    <div>
                        <label htmlFor="classId" className="block text-sm font-medium text-gray-700">Kelas</label>
                        <select name="classId" id="classId" value={formData.classId} onChange={handleChange} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md">
                            <option value="">Pilih Kelas</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300" disabled={isSaving}>Batal</button>
                        <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-emerald-300" disabled={isSaving}>
                            {isSaving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DefaultSchoolLogo = () => (
    <svg viewBox="0 0 100 100" className="w-16 h-16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#FFFFFF" stroke="#0ea5e9" strokeWidth="4"/>
        <path d="M50 15L20 35V75L50 95L80 75V35L50 15Z" fill="#facc15" stroke="#0ea5e9" strokeWidth="2"/>
        <path d="M50 60L25 47.5V72.5L50 85L75 72.5V47.5L50 60Z" fill="#FFFFFF" stroke="#0ea5e9" strokeWidth="2"/>
        <text x="50" y="55" fontFamily="Arial" fontSize="20" fill="#0369a1" textAnchor="middle" fontWeight="bold">S</text>
    </svg>
);

const StudentCard: React.FC<{ student: Student; qrCodeUrl: string; settings: Partial<AppSettings> }> = ({ student, qrCodeUrl, settings }) => {
    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString + 'T00:00:00').toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };
    
    const cardIssueDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    const studentPhoto = student.photoUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5.52 19c.64-2.2 1.84-3 3.22-3h6.52c1.38 0 2.58.8 3.22 3'/%3E%3Ccircle cx='12' cy='10' r='3'/%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3C/svg%3E";

    return (
        <div className="relative w-[500px] h-[315px] bg-white mx-auto overflow-hidden font-sans rounded-xl shadow-lg border border-slate-200 flex flex-col justify-between">
            {/* Background Pattern */}
            <div 
                className="absolute inset-0 opacity-50" 
                style={{
                    backgroundImage: 'radial-gradient(circle, #cbd5e1 0.5px, transparent 0.5px)',
                    backgroundSize: '10px 10px',
                }}
            ></div>

            {/* Header */}
            <header className="relative z-10 p-4">
                <div className="absolute top-0 left-0 -z-10">
                    <svg width="500" height="150" viewBox="0 0 500 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M-52 62.1146C-28.9221 82.3588 47.9708 123.863 129.5 111.432C211.029 99.001 228.018 -32.4055 352.5 15.2891C476.982 62.9837 537.5 48.4318 537.5 48.4318V-38H-52V62.1146Z" fill="url(#paint0_linear_card_header)"/>
                        <defs>
                        <linearGradient id="paint0_linear_card_header" x1="242.75" y1="-38" x2="242.75" y2="111.432" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#38bdf8"/>
                        <stop offset="1" stopColor="#0ea5e9"/>
                        </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div className="flex justify-between items-center">
                    <div className="text-white">
                        <h1 className="text-sm font-bold tracking-wider">KARTU TANDA PELAJAR</h1>
                        <p className="text-xl font-black">{settings.schoolName || 'Nama Sekolah'}</p>
                        <p className="text-xs">{settings.foundationName || 'Nama Yayasan'}</p>
                    </div>
                    <div className="bg-white p-1 rounded-full shadow-md flex-shrink-0">
                        {settings.logoUrl ? (
                            <img src={settings.logoUrl} alt="Logo Sekolah" className="w-16 h-16 object-contain" />
                        ) : (
                            <DefaultSchoolLogo />
                        )}
                    </div>
                </div>
            </header>

            {/* Body */}
            <main className="relative z-10 flex items-center px-4 -mt-4">
                <div className="flex-shrink-0">
                    <img src={studentPhoto} alt={student.name} className="w-28 h-36 object-cover border-4 border-white bg-slate-200 rounded-lg shadow-md" />
                </div>
                <div className="pl-4 flex-grow">
                    <h2 className="text-2xl font-bold leading-tight tracking-tight text-slate-900">{student.name}</h2>
                    <p className="text-slate-500 font-medium mb-2">NIS: {student.id}</p>
                    <div className="grid grid-cols-[max-content,1fr] gap-x-2 gap-y-0.5 text-xs text-slate-700">
                        <strong className="font-semibold">NISN</strong><span>: {student.nisn || '-'}</span>
                        <strong className="font-semibold">TTL</strong><span className="truncate">: {`${student.pob || ''}, ${formatDate(student.dob)}`}</span>
                        <strong className="font-semibold">Alamat</strong><span className="truncate">: {student.address || '-'}</span>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 flex items-end justify-between px-4 pb-3">
                 <div className="flex items-center gap-2">
                    {qrCodeUrl ? (
                        <img src={qrCodeUrl} alt="QR Code" className="w-16 h-16 bg-white p-0.5 rounded-md" />
                     ) : (
                        <div className="w-16 h-16 bg-slate-200 animate-pulse rounded-md"></div>
                     )}
                     <p className="text-[9px] text-slate-500 max-w-[80px]">Berlaku selama menjadi siswa/i aktif.</p>
                 </div>
                <div className="text-center text-xs relative w-40">
                    <p>{settings.schoolCity || 'Kota'}, {cardIssueDate}</p>
                    <p>Kepala Sekolah,</p>
                    <div className="h-10 relative flex justify-center items-center">
                        {settings.stampUrl && (
                            <img src={settings.stampUrl} alt="Stempel Sekolah" className="absolute inset-0 w-full h-full object-contain opacity-70" />
                        )}
                        {settings.signatureUrl && (
                            <img src={settings.signatureUrl} alt="Tanda Tangan" className="relative z-10 h-10 max-w-full object-contain" />
                        )}
                    </div>
                    <p className="font-bold underline">{settings.headmasterName || 'Nama Kepala Sekolah'}</p>
                </div>
            </footer>
        </div>
    );
};

interface MultiQRCodeModalProps {
    students: Student[];
    classMap: Map<string, string>;
    onClose: () => void;
}

const MultiQRCodeModal: React.FC<MultiQRCodeModalProps> = ({ students, classMap, onClose }) => {
    const [qrCodeUrls, setQrCodeUrls] = useState<Map<string, string>>(new Map());
    const [settings, setSettings] = useState<Partial<AppSettings>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const generateQRCodesAndFetchSettings = async () => {
            setLoading(true);
            try {
                const settingsPromise = supabase.from('app_settings').select('*').eq('id', 1).single();
                
                const qrPromises = students.map(student =>
                    QRCode.toDataURL(student.id, { width: 128, margin: 1 })
                        .then(url => ({ id: student.id, url }))
                );
                
                const [settingsResult, qrResults] = await Promise.all([settingsPromise, Promise.all(qrPromises)]);

                const { data, error } = settingsResult;
                if (error && error.code !== 'PGRST116') throw error;
                if(data) {
                    setSettings({
                        schoolName: data.school_name,
                        foundationName: data.foundation_name,
                        headmasterName: data.headmaster_name,
                        schoolCity: data.school_city,
                        logoUrl: data.logo_url,
                        signatureUrl: data.signature_url,
                        stampUrl: data.stamp_url,
                    });
                }

                const urlMap = new Map<string, string>();
                qrResults.forEach(result => urlMap.set(result.id, result.url));
                setQrCodeUrls(urlMap);

            } catch (err) {
                console.error("Failed to generate QR codes or fetch settings", err);
            } finally {
                setLoading(false);
            }
        };

        if (students.length > 0) {
            generateQRCodesAndFetchSettings();
        } else {
            setLoading(false);
        }
    }, [students]);

    const handlePrint = () => window.print();

    return (
        <>
            <style>
                {`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  .printable-area-multi, .printable-area-multi * {
                    visibility: visible;
                  }
                  .printable-area-multi {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: auto;
                    overflow-y: visible !important;
                    background: none !important;
                  }
                  .printable-area-multi > .bg-white {
                    box-shadow: none !important;
                    border: none !important;
                    margin: 0 !important;
                    width: 100% !important;
                    max-width: 100% !important;
                  }
                  .printable-card-multi {
                    break-inside: avoid;
                    page-break-inside: avoid;
                    box-shadow: none !important; 
                    border: 1px dashed #ccc !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
                `}
            </style>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start p-4 overflow-y-auto printable-area-multi">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl my-8">
                     <div className="p-4 border-b no-print flex justify-between items-center">
                        <h3 className="text-lg font-medium">Cetak Kartu Siswa Terpilih ({students.length})</h3>
                        <div className="flex justify-end space-x-2">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Tutup</button>
                            <button type="button" onClick={handlePrint} disabled={loading} className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:bg-gray-400">
                                {loading ? 'Memuat...' : 'Cetak'}
                            </button>
                        </div>
                    </div>
                    <div className="p-4">
                         {loading ? (
                            <div className="text-center py-10">Memuat data kartu...</div>
                         ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {students.map(student => (
                                    <div key={student.id} className="printable-card-multi">
                                        <StudentCard 
                                            student={student} 
                                            qrCodeUrl={qrCodeUrls.get(student.id) || ''} 
                                            settings={settings} 
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};


interface QRCodeModalProps {
    student: Student;
    studentClass?: string;
    onClose: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ student, studentClass, onClose }) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [settings, setSettings] = useState<Partial<AppSettings>>({});

    useEffect(() => {
        QRCode.toDataURL(student.id, { width: 128, margin: 1 })
            .then(url => setQrCodeUrl(url))
            .catch(err => console.error("Failed to generate QR code", err));
            
        const fetchSettings = async () => {
            const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single();
            if (error && error.code !== 'PGRST116') {
                console.error("Error fetching settings:", error);
                return;
            }
            if(data) {
                setSettings({
                    schoolName: data.school_name,
                    foundationName: data.foundation_name,
                    headmasterName: data.headmaster_name,
                    schoolCity: data.school_city,
                    logoUrl: data.logo_url,
                    signatureUrl: data.signature_url,
                    stampUrl: data.stamp_url,
                });
            }
        };
        fetchSettings();
    }, [student.id]);

    const handlePrint = () => window.print();

    return (
        <>
            <style>
                {`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  .printable-area, .printable-area * {
                    visibility: visible;
                  }
                  .printable-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                  }
                  .printable-card {
                    margin: auto;
                    box-shadow: none !important; 
                    border: none !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
                `}
            </style>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 printable-area">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-lg pb-4">
                    <div className="overflow-x-auto p-4">
                        <div className="printable-card">
                           <StudentCard student={student} qrCodeUrl={qrCodeUrl} settings={settings} />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 px-4 no-print">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Tutup</button>
                        <button type="button" onClick={handlePrint} className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">Cetak</button>
                    </div>
                </div>
            </div>
        </>
    );
};


export default StudentData;
