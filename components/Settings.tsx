
import React, { useState, useEffect, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { AppSettings, Class, AcademicYear } from '../types';
import Card from './ui/Card';
import { PencilIcon, TrashIcon } from '../constants';
import { supabase } from '../services/supabase';

type Tab = 'identitas' | 'jam' | 'kelas' | 'akademik' | 'sistem';

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('identitas');

    return (
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Pengaturan</h1>
            <div className="border-b mb-6">
                <div className="flex items-center overflow-x-auto whitespace-nowrap">
                    <TabButton name="Identitas" tab="identitas" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton name="Jam Sekolah" tab="jam" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton name="Manajemen Kelas" tab="kelas" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton name="Tahun Pelajaran" tab="akademik" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton name="Sistem" tab="sistem" activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>
            </div>
            <div>
                {activeTab === 'identitas' && <IdentitySettings />}
                {activeTab === 'jam' && <TimeSettings />}
                {activeTab === 'kelas' && <ClassManagement />}
                {activeTab === 'akademik' && <AcademicYearManagement />}
                {activeTab === 'sistem' && <SystemSettings />}
            </div>
        </div>
    );
};

const TabButton: React.FC<{ name: string; tab: Tab; activeTab: Tab; setActiveTab: (tab: Tab) => void }> = ({ name, tab, activeTab, setActiveTab }) => (
    <button
        onClick={() => setActiveTab(tab)}
        className={`px-4 py-2 text-sm font-medium transition-colors duration-200 flex-shrink-0 ${
            activeTab === tab
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
        }`}
    >
        {name}
    </button>
);

const IdentitySettings: React.FC = () => {
    const [settings, setSettings] = useLocalStorage<AppSettings>('app_settings', {
        entryTime: '07:00',
        lateTime: '07:15',
        exitTime: '15:00',
        appName: 'Aplikasi Absensi Siswa',
        schoolName: 'SEKOLAH HARAPAN BANGSA',
    });
    const [localSettings, setLocalSettings] = useState(settings);
    const [message, setMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalSettings(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSettings(localSettings);
        setMessage('Pengaturan identitas berhasil disimpan!');
        setTimeout(() => setMessage(''), 3000);
    };
    
    return (
        <Card className="max-w-md">
            <h3 className="text-lg font-semibold mb-4">Atur Identitas Aplikasi & Sekolah</h3>
            <form onSubmit={handleSave} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nama Aplikasi</label>
                    <input type="text" name="appName" value={localSettings.appName || ''} onChange={handleChange} className="mt-1 p-2 border rounded-md w-full" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Nama Sekolah</label>
                    <input type="text" name="schoolName" value={localSettings.schoolName || ''} onChange={handleChange} className="mt-1 p-2 border rounded-md w-full" />
                </div>
                <div className="flex justify-end">
                    <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Simpan Perubahan</button>
                </div>
            </form>
            {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
        </Card>
    );
};

const TimeSettings: React.FC = () => {
    const [settings, setSettings] = useLocalStorage<AppSettings>('app_settings', { entryTime: '07:00', lateTime: '07:15', exitTime: '15:00' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings(prev => ({...prev, [e.target.name]: e.target.value}));
    };
    
    return (
        <Card className="max-w-md">
            <h3 className="text-lg font-semibold mb-4">Atur Jam Masuk dan Pulang</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Jam Masuk</label>
                    <input type="time" name="entryTime" value={settings.entryTime} onChange={handleChange} className="mt-1 p-2 border rounded-md w-full" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Batas Terlambat</label>
                    <input type="time" name="lateTime" value={settings.lateTime} onChange={handleChange} className="mt-1 p-2 border rounded-md w-full" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Jam Pulang</label>
                    <input type="time" name="exitTime" value={settings.exitTime} onChange={handleChange} className="mt-1 p-2 border rounded-md w-full" />
                </div>
            </div>
        </Card>
    );
};

const ClassManagement: React.FC = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [newClassName, setNewClassName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchClasses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.from('classes').select('*').order('name');
            if (error) throw error;
            setClasses(data || []);
        } catch (err: any) {
            setError('Gagal memuat data kelas: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    const handleAddClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newClassName.trim()) {
            try {
                const newClass = { id: `cls-${Date.now()}`, name: newClassName.trim() };
                const { error } = await supabase.from('classes').insert(newClass);
                if (error) throw error;
                setClasses(prev => [...prev, newClass].sort((a,b) => a.name.localeCompare(b.name)));
                setNewClassName('');
            } catch (err: any) {
                alert('Gagal menambahkan kelas: ' + err.message);
            }
        }
    };
    
    const handleDelete = async (id: string) => {
        const confirmationMessage = 'Menghapus kelas akan mengatur ulang kelas siswa yang bersangkutan (menjadi tidak memiliki kelas). Anda yakin?';
        if (window.confirm(confirmationMessage)) {
            try {
                const { error } = await supabase.from('classes').delete().eq('id', id);
                if (error) throw error;
                setClasses(prev => prev.filter(c => c.id !== id));
            } catch (err: any) {
                alert('Gagal menghapus kelas: ' + err.message);
            }
        }
    };
    
    return (
        <Card className="max-w-md">
            <h3 className="text-lg font-semibold mb-4">Daftar Kelas</h3>
             <form onSubmit={handleAddClass} className="flex mb-4">
                <input type="text" value={newClassName} onChange={e => setNewClassName(e.target.value)} placeholder="Nama kelas baru" className="flex-grow p-2 border rounded-l-md" />
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-r-md">Tambah</button>
            </form>
            {loading && <p>Memuat kelas...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!loading && !error && (
                <ul className="space-y-2">
                    {classes.map(c => (
                        <li key={c.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                            <span>{c.name}</span>
                            <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700">Hapus</button>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
};

const AcademicYearManagement: React.FC = () => {
    const [years, setYears] = useLocalStorage<AcademicYear[]>('academic_years', []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);

    const setActiveYear = (id: string) => {
        setYears(years.map(y => ({ ...y, isActive: y.id === id })));
    };

    const handleOpenModal = (year: AcademicYear | null) => {
        setEditingYear(year);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingYear(null);
    };

    const handleSave = (yearToSave: AcademicYear) => {
        if (editingYear) {
            setYears(years.map(y => y.id === yearToSave.id ? yearToSave : y));
        } else {
            setYears([...years, { ...yearToSave, id: Date.now().toString(), isActive: years.length === 0 }]);
        }
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus tahun pelajaran ini?')) {
            setYears(years.filter(y => y.id !== id));
        }
    };
    
    return (
        <Card className="max-w-lg">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-semibold">Tahun Pelajaran & Semester</h3>
                 <button onClick={() => handleOpenModal(null)} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm">Tambah Baru</button>
            </div>
             <ul className="space-y-2">
                {years.map(y => (
                    <li key={y.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                        <span>{y.year} - Semester {y.semester}</span>
                        <div className="flex items-center gap-2">
                             <button 
                                onClick={() => setActiveYear(y.id)}
                                disabled={y.isActive}
                                className={`px-3 py-1 text-xs rounded-full ${y.isActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                {y.isActive ? 'Aktif' : 'Aktifkan'}
                            </button>
                            <button onClick={() => handleOpenModal(y)} className="p-2 text-primary-600 hover:text-primary-900 hover:bg-gray-100 rounded-full"><PencilIcon className="h-4 w-4"/></button>
                            <button onClick={() => handleDelete(y.id)} className="p-2 text-red-600 hover:text-red-900 hover:bg-gray-100 rounded-full"><TrashIcon className="h-4 w-4"/></button>
                        </div>
                    </li>
                ))}
            </ul>
            {isModalOpen && <AcademicYearModal year={editingYear} onSave={handleSave} onClose={handleCloseModal} />}
        </Card>
    );
};

interface AcademicYearModalProps {
    year: AcademicYear | null;
    onSave: (year: AcademicYear) => void;
    onClose: () => void;
}

const AcademicYearModal: React.FC<AcademicYearModalProps> = ({ year, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<AcademicYear>>(year || { year: '', semester: 'Ganjil' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.year && formData.semester) {
            onSave(formData as AcademicYear);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">{year ? 'Edit Tahun Pelajaran' : 'Tambah Tahun Pelajaran'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="year" className="block text-sm font-medium text-gray-700">Tahun Pelajaran (e.g., 2023/2024)</label>
                        <input type="text" name="year" id="year" value={formData.year} onChange={handleChange} required className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="semester" className="block text-sm font-medium text-gray-700">Semester</label>
                        <select name="semester" id="semester" value={formData.semester} onChange={handleChange} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                            <option value="Ganjil">Ganjil</option>
                            <option value="Genap">Genap</option>
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


const SystemSettings: React.FC = () => {
    const handleBackup = () => {
        const dataToBackup = {
            students: JSON.parse(localStorage.getItem('students') || '[]'),
            classes: JSON.parse(localStorage.getItem('classes') || '[]'),
            attendance: JSON.parse(localStorage.getItem('attendance') || '[]'),
            settings: JSON.parse(localStorage.getItem('app_settings') || '{}'),
            academic_years: JSON.parse(localStorage.getItem('academic_years') || '[]'),
        };
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToBackup, null, 2))}`;
        const link = document.createElement('a');
        link.href = jsonString;
        link.download = `backup_absensi_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
    };
    
    const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error("File content is not readable.");
                }
                const data = JSON.parse(text);

                // Basic validation
                if (!data.students || !data.classes || !data.attendance || !data.settings || !data.academic_years) {
                    throw new Error("Invalid backup file format.");
                }

                if (window.confirm('Apakah Anda yakin ingin memulihkan data? Ini akan menimpa semua data yang ada saat ini.')) {
                    localStorage.setItem('students', JSON.stringify(data.students));
                    localStorage.setItem('classes', JSON.stringify(data.classes));
                    localStorage.setItem('attendance', JSON.stringify(data.attendance));
                    localStorage.setItem('app_settings', JSON.stringify(data.settings));
                    localStorage.setItem('academic_years', JSON.stringify(data.academic_years));
                    
                    alert('Data berhasil dipulihkan! Aplikasi akan dimuat ulang.');
                    window.location.reload();
                }
            } catch (error) {
                console.error("Failed to restore data:", error);
                alert(`Gagal memulihkan data. Pastikan file backup valid. Error: ${error instanceof Error ? error.message : String(error)}`);
            } finally {
                // Reset the input value to allow re-uploading the same file
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-6">
            <Card className="max-w-md">
                <h3 className="text-lg font-semibold mb-4">Cadangkan Data (Lokal)</h3>
                <p className="text-sm text-gray-600 mb-4">Simpan data dari LocalStorage (pengaturan, tahun ajaran, dll.) ke file JSON. Data siswa dan kelas tidak termasuk karena sudah di Supabase.</p>
                <button onClick={handleBackup} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                    Download Backup Lokal
                </button>
            </Card>
            <Card className="max-w-md">
                <h3 className="text-lg font-semibold mb-4">Pulihkan Data (Lokal)</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Pulihkan data lokal dari file backup. 
                    <strong className="text-red-600"> Perhatian:</strong> Hanya akan menimpa data pengaturan, tahun ajaran, dan data lokal lainnya.
                </p>
                <label className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition inline-block">
                    <span>Pilih File Backup</span>
                    <input type="file" accept=".json" className="hidden" onChange={handleRestore} />
                </label>
            </Card>
        </div>
    );
}

export default Settings;