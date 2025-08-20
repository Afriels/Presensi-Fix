import React, { useState, useEffect, useCallback } from 'react';
import type { AppSettings, Class, AcademicYear } from '../types';
import Card from './ui/Card';
import { PencilIcon, TrashIcon } from '../constants';
import { supabase, Enums, Tables, TablesUpdate, TablesInsert } from '../services/supabase';
import { useAuth } from './auth/Auth';

type Tab = 'identitas' | 'jam' | 'kelas' | 'akademik' | 'sistem' | 'users';
type UserProfile = Tables<'profiles'> & { email?: string };

const Settings: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('identitas');
    
    const tabs: { name: string; tab: Tab; adminOnly: boolean }[] = [
        { name: 'Identitas', tab: 'identitas', adminOnly: false },
        { name: 'Jam Sekolah', tab: 'jam', adminOnly: false },
        { name: 'Manajemen Kelas', tab: 'kelas', adminOnly: true },
        { name: 'Tahun Pelajaran', tab: 'akademik', adminOnly: true },
        { name: 'Manajemen User', tab: 'users', adminOnly: true },
        { name: 'Sistem', tab: 'sistem', adminOnly: false },
    ];
    
    const availableTabs = tabs.filter(tab => !tab.adminOnly || user?.role === 'admin');

    return (
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Pengaturan</h1>
            <div className="border-b mb-6">
                <div className="flex items-center overflow-x-auto whitespace-nowrap">
                    {availableTabs.map(t => (
                        <TabButton key={t.tab} name={t.name} tab={t.tab} activeTab={activeTab} setActiveTab={setActiveTab} />
                    ))}
                </div>
            </div>
            <div>
                {activeTab === 'identitas' && <IdentitySettings />}
                {activeTab === 'jam' && <TimeSettings />}
                {activeTab === 'kelas' && user?.role === 'admin' && <ClassManagement />}
                {activeTab === 'akademik' && user?.role === 'admin' && <AcademicYearManagement />}
                {activeTab === 'users' && user?.role === 'admin' && <UserManagement />}
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
    const { user } = useAuth();
    const [settings, setSettings] = useState<Partial<AppSettings>>({});
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('app_settings').select('app_name, school_name').eq('id', 1).single();
            if (error && error.code !== 'PGRST116') {
                console.error("Error fetching settings:", error);
            } else if (data) {
                setSettings({ appName: data.app_name || '', schoolName: data.school_name || ''});
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const settingsToUpdate: TablesUpdate<'app_settings'> = {
                app_name: settings.appName,
                school_name: settings.schoolName
            };
            const { error } = await supabase.from('app_settings').update(settingsToUpdate).eq('id', 1);

            if (error) throw error;

            setMessage('Pengaturan identitas berhasil disimpan!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err: any) {
            alert('Gagal menyimpan pengaturan: ' + err.message);
        }
    };
    
    if (loading) return <p>Memuat pengaturan...</p>;

    return (
        <Card className="max-w-md">
            <h3 className="text-lg font-semibold mb-4">Atur Identitas Aplikasi & Sekolah</h3>
            <form onSubmit={handleSave} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nama Aplikasi</label>
                    <input type="text" name="appName" value={settings.appName || ''} onChange={handleChange} className="mt-1 p-2 border rounded-md w-full" disabled={user?.role !== 'admin'} />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Nama Sekolah</label>
                    <input type="text" name="schoolName" value={settings.schoolName || ''} onChange={handleChange} className="mt-1 p-2 border rounded-md w-full" disabled={user?.role !== 'admin'}/>
                </div>
                {user?.role === 'admin' && (
                    <div className="flex justify-end">
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Simpan Perubahan</button>
                    </div>
                )}
            </form>
            {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
        </Card>
    );
};

const TimeSettings: React.FC = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState<Partial<AppSettings>>({ entryTime: '07:00', lateTime: '07:15', exitTime: '15:00' });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('app_settings').select('entry_time, late_time, exit_time').eq('id', 1).single();
        if (error && error.code !== 'PGRST116') {
            console.error("Error fetching time settings:", error);
        } else if (data) {
            setSettings({ entryTime: data.entry_time, lateTime: data.late_time, exitTime: data.exit_time });
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchSettings() }, [fetchSettings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleSave = async () => {
        try {
            const settingsToUpsert: TablesInsert<'app_settings'> = {
                id: 1, // Primary key for the single settings row
                entry_time: settings.entryTime!,
                late_time: settings.lateTime!,
                exit_time: settings.exitTime!
            };
            const { error } = await supabase.from('app_settings').upsert(settingsToUpsert);
            if (error) throw error;
            setMessage('Pengaturan jam berhasil disimpan!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err: any) {
             alert('Gagal menyimpan pengaturan: ' + err.message);
        }
    }
    
    if (loading) return <p>Memuat pengaturan...</p>;

    return (
        <Card className="max-w-md">
            <h3 className="text-lg font-semibold mb-4">Atur Jam Masuk dan Pulang</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Jam Masuk</label>
                    <input type="time" name="entryTime" value={settings.entryTime} onChange={handleChange} className="mt-1 p-2 border rounded-md w-full" disabled={user?.role !== 'admin'}/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Batas Terlambat</label>
                    <input type="time" name="lateTime" value={settings.lateTime} onChange={handleChange} className="mt-1 p-2 border rounded-md w-full" disabled={user?.role !== 'admin'}/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Jam Pulang</label>
                    <input type="time" name="exitTime" value={settings.exitTime} onChange={handleChange} className="mt-1 p-2 border rounded-md w-full" disabled={user?.role !== 'admin'}/>
                </div>
            </div>
             {user?.role === 'admin' && (
                <div className="flex justify-end mt-4">
                    <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Simpan Perubahan</button>
                </div>
             )}
            {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
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
                const newClass: TablesInsert<'classes'> = { id: `cls-${Date.now()}`, name: newClassName.trim() };
                const { data, error } = await supabase.from('classes').insert(newClass).select().single();
                if (error) throw error;
                if (data) {
                    setClasses(prev => [...prev, data as Class].sort((a,b) => a.name.localeCompare(b.name)));
                }
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
    const [years, setYears] = useState<AcademicYear[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);

    const fetchYears = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('academic_years').select('*').order('year', { ascending: false });
        if (error) {
            console.error("Error fetching academic years:", error);
        } else if (data) {
            setYears((data || []).map(y => ({...y, semester: y.semester as 'Ganjil' | 'Genap'})));
        }
        setLoading(false);
    }, []);
    
    useEffect(() => { fetchYears() }, [fetchYears]);

    const setActiveYear = async (id: number) => {
        try {
            // Set all to inactive
            const { error: errorInactive } = await supabase.from('academic_years').update({ is_active: false }).eq('is_active', true);
            if (errorInactive) throw errorInactive;
            // Set selected to active
            const { error: errorActive } = await supabase.from('academic_years').update({ is_active: true }).eq('id', id);
            if(errorActive) throw errorActive;
            fetchYears();
        } catch (err: any) {
            alert('Gagal mengaktifkan tahun ajaran: ' + err.message);
        }
    };

    const handleOpenModal = (year: AcademicYear | null) => {
        setEditingYear(year);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingYear(null);
    };

    const handleSave = async (yearToSave: Partial<AcademicYear>) => {
        try {
            if (editingYear) {
                const yearToUpdate: TablesUpdate<'academic_years'> = { year: yearToSave.year, semester: yearToSave.semester };
                const { error } = await supabase.from('academic_years').update(yearToUpdate).eq('id', editingYear.id);
                if(error) throw error;
            } else {
                 const yearToInsert: TablesInsert<'academic_years'> = { year: yearToSave.year!, semester: yearToSave.semester!, is_active: years.length === 0 };
                const { error } = await supabase.from('academic_years').insert(yearToInsert);
                if(error) throw error;
            }
            fetchYears();
            handleCloseModal();
        } catch (err: any) {
            alert('Gagal menyimpan data: ' + err.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus tahun pelajaran ini?')) {
            try {
                const { error } = await supabase.from('academic_years').delete().eq('id', id);
                if(error) throw error;
                setYears(years.filter(y => y.id !== id));
            } catch (err: any) {
                alert('Gagal menghapus data: ' + err.message);
            }
        }
    };
    
    if (loading) return <p>Memuat data...</p>;

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
    onSave: (year: Partial<AcademicYear>) => void;
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
            onSave(formData);
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
    return (
        <div className="space-y-6">
            <Card className="max-w-md">
                <h3 className="text-lg font-semibold mb-4">Penyimpanan Data</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Seluruh data aplikasi ini (data siswa, absensi, kelas, dan pengaturan) sekarang 
                    disimpan dengan aman di database cloud (Supabase).
                </p>
                <p className="text-sm text-gray-600">
                    Ini berarti Anda tidak perlu lagi melakukan backup manual. Data Anda akan selalu
                    tersinkronisasi dan dapat diakses dari perangkat manapun.
                </p>
            </Card>
        </div>
    );
}

const UserManagement = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // This is a bit advanced: Supabase doesn't let you join auth.users easily.
            // We fetch profiles, then fetch the user emails.
            const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('*');
            if (profilesError) throw profilesError;

            const { data: authUsersData, error: authError } = await supabase.auth.admin.listUsers();
            if (authError) throw authError;
            
            const usersMap = new Map(authUsersData.users.map(u => [u.id, u.email]));
            
            const combinedUsers = (profilesData || []).map(profile => ({
                ...profile,
                email: usersMap.get(profile.id) || 'N/A'
            }));

            setUsers(combinedUsers);
        } catch (err: any) {
            setError('Gagal memuat pengguna. Pastikan Anda memiliki hak akses admin di Supabase.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleRoleChange = async (userId: string, newRole: Enums<'user_role'>) => {
        try {
            const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
            if (error) throw error;
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch(err: any) {
            alert('Gagal mengubah peran: ' + err.message);
        }
    }

    return (
        <Card className="max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Manajemen Pengguna</h3>
            {loading && <p>Memuat pengguna...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!loading && !error && (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peran</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <select 
                                            value={u.role} 
                                            onChange={(e) => handleRoleChange(u.id, e.target.value as Enums<'user_role'>)}
                                            className="p-1 border rounded-md"
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="guru">Guru</option>
                                            <option value="siswa">Siswa</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
}

export default Settings;