import React, { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { AppSettings, Class, AcademicYear } from '../types';
import Card from './ui/Card';

type Tab = 'jam' | 'kelas' | 'akademik' | 'sistem';

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('jam');

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Pengaturan</h1>
            <div className="flex border-b mb-6">
                <TabButton name="Jam Sekolah" tab="jam" activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabButton name="Manajemen Kelas" tab="kelas" activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabButton name="Tahun Pelajaran" tab="akademik" activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabButton name="Sistem" tab="sistem" activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
            <div>
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
        className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
            activeTab === tab
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
        }`}
    >
        {name}
    </button>
);

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
    const [classes, setClasses] = useLocalStorage<Class[]>('classes', []);
    const [newClassName, setNewClassName] = useState('');

    const handleAddClass = (e: React.FormEvent) => {
        e.preventDefault();
        if (newClassName.trim()) {
            const newClass = { id: Date.now().toString(), name: newClassName.trim() };
            setClasses([...classes, newClass]);
            setNewClassName('');
        }
    };
    
    const handleDelete = (id: string) => {
        setClasses(classes.filter(c => c.id !== id));
    };
    
    return (
        <Card className="max-w-md">
            <h3 className="text-lg font-semibold mb-4">Daftar Kelas</h3>
             <form onSubmit={handleAddClass} className="flex mb-4">
                <input type="text" value={newClassName} onChange={e => setNewClassName(e.target.value)} placeholder="Nama kelas baru" className="flex-grow p-2 border rounded-l-md" />
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-r-md">Tambah</button>
            </form>
            <ul className="space-y-2">
                {classes.map(c => (
                    <li key={c.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                        <span>{c.name}</span>
                        <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700">Hapus</button>
                    </li>
                ))}
            </ul>
        </Card>
    );
};

const AcademicYearManagement: React.FC = () => {
    const [years, setYears] = useLocalStorage<AcademicYear[]>('academic_years', []);
    
    const setActiveYear = (id: string) => {
        setYears(years.map(y => ({ ...y, isActive: y.id === id })));
    };
    
    return (
        <Card className="max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Tahun Pelajaran & Semester</h3>
             <ul className="space-y-2">
                {years.map(y => (
                    <li key={y.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                        <span>{y.year} - Semester {y.semester}</span>
                        <button 
                            onClick={() => setActiveYear(y.id)}
                            disabled={y.isActive}
                            className={`px-3 py-1 text-xs rounded-full ${y.isActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            {y.isActive ? 'Aktif' : 'Aktifkan'}
                        </button>
                    </li>
                ))}
            </ul>
        </Card>
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
    
    return (
        <Card className="max-w-md">
            <h3 className="text-lg font-semibold mb-4">Cadangkan Database</h3>
            <p className="text-sm text-gray-600 mb-4">Simpan semua data aplikasi (siswa, kelas, absensi, pengaturan) ke dalam sebuah file JSON.</p>
            <button onClick={handleBackup} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                Download Backup
            </button>
        </Card>
    );
}

export default Settings;