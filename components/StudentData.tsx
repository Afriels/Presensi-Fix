
import React, { useState, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Student, Class } from '../types';
import Card, { CardHeader, CardTitle } from './ui/Card';

const StudentData: React.FC = () => {
    const [students, setStudents] = useLocalStorage<Student[]>('students', []);
    const [classes] = useLocalStorage<Class[]>('classes', []);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);

    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

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

    const handleSave = (student: Student) => {
        if (editingStudent) {
            setStudents(students.map(s => s.id === student.id ? student : s));
        } else {
            setStudents([...students, { ...student, id: student.id || Date.now().toString(), photoUrl: `https://picsum.photos/seed/${student.id || Date.now()}/200` }]);
        }
        closeModal();
    };

    const handleDelete = (studentId: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) {
            setStudents(students.filter(s => s.id !== studentId));
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Data Siswa</CardTitle>
                    <button onClick={() => openModal()} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition">
                        Tambah Siswa
                    </button>
                </div>
            </CardHeader>
            <input
                type="text"
                placeholder="Cari nama atau NIS siswa..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{classMap.get(student.classId)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => openModal(student)} className="text-primary-600 hover:text-primary-900 mr-4">Edit</button>
                                    <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:text-red-900">Hapus</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <StudentModal student={editingStudent} classes={classes} onSave={handleSave} onClose={closeModal} />}
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.id && formData.name && formData.classId) {
            onSave(formData as Student);
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
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentData;