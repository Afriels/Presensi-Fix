

import React, { useState, useEffect, useCallback } from 'react';
import type { AppSettings, Class, AcademicYear } from '../types';
import Card from './ui/Card';
import { PencilIcon, TrashIcon } from '../constants';
import { supabase, Enums, Tables, TablesUpdate, TablesInsert } from '../services/supabase';
import { useAuth } from './auth/Auth';

type Tab = 'identitas' | 'jam' | 'kelas' | 'akademik' | 'sistem' | 'users';

// This type now reflects the data returned from our secure RPC function
type UserProfile = {
    id: string;
    email: string;
    role: Enums<'user_role'>;
};


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
                ? 'border-b-2 border-sky-500 text-sky-600'
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
    
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [faviconFile, setFaviconFile] = useState<File | null>(null);
    const [signatureFile, setSignatureFile] = useState<File | null>(null);
    const [stampFile, setStampFile] = useState<File | null>(null);
    
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
    const [stampPreview, setStampPreview] = useState<string | null>(null);
    
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single();
            if (error && error.code !== 'PGRST116') {
                console.error("Error fetching settings:", error);
            } else if (data) {
                setSettings({
                    id: data.id,
                    appName: data.app_name || '',
                    foundationName: data.foundation_name || '',
                    schoolName: data.school_name || '',
                    headmasterName: data.headmaster_name || '',
                    schoolAddress: data.school_address || '',
                    schoolPhone: data.school_phone || '',
                    schoolEmail: data.school_email || '',
                    schoolCity: data.school_city || '',
                    logoUrl: data.logo_url || '',
                    faviconUrl: data.favicon_url || '',
                    signatureUrl: data.signature_url || '',
                    stampUrl: data.stamp_url || '',
                });
                if (data.logo_url) setLogoPreview(data.logo_url);
                if (data.signature_url) setSignaturePreview(data.signature_url);
                if (data.stamp_url) setStampPreview(data.stamp_url);
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setSettings(prev => ({...prev, [e.target.name]: e.target.value}));
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon' | 'signature' | 'stamp') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                if (type === 'logo') {
                    setLogoFile(file);
                    setLogoPreview(result);
                } else if (type === 'favicon') {
                    setFaviconFile(file);
                } else if (type === 'signature') {
                    setSignatureFile(file);
                    setSignaturePreview(result);
                } else if (type === 'stamp') {
                    setStampFile(file);
                    setStampPreview(result);
                }
            };
            reader.readAsDataURL(file);
        }
    };


    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let logoUrlToSave = settings.logoUrl;
            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop();
                const filePath = `logo.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('app-assets').upload(filePath, logoFile, { upsert: true });
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('app-assets').getPublicUrl(filePath);
                logoUrlToSave = `${urlData.publicUrl}?t=${new Date().getTime()}`;
            }
            
            let faviconUrlToSave = settings.faviconUrl;
            if (faviconFile) {
                const fileExt = faviconFile.name.split('.').pop();
                const filePath = `favicon.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('app-assets').upload(filePath, faviconFile, { upsert: true });
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('app-assets').getPublicUrl(filePath);
                faviconUrlToSave = `${urlData.publicUrl}?t=${new Date().getTime()}`;
            }

            let signatureUrlToSave = settings.signatureUrl;
            if (signatureFile) {
                const fileExt = signatureFile.name.split('.').pop();
                const filePath = `signature.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('app-assets').upload(filePath, signatureFile, { upsert: true });
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('app-assets').getPublicUrl(filePath);
                signatureUrlToSave = `${urlData.publicUrl}?t=${new Date().getTime()}`;
            }

            let stampUrlToSave = settings.stampUrl;
            if (stampFile) {
                const fileExt = stampFile.name.split('.').pop();
                const filePath = `stamp.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('app-assets').upload(filePath, stampFile, { upsert: true });
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('app-assets').getPublicUrl(filePath);
                stampUrlToSave = `${urlData.publicUrl}?t=${new Date().getTime()}`;
            }
            
            const settingsToUpdate: TablesUpdate<'app_settings'> = {
                app_name: settings.appName,
                school_name: settings.schoolName,
                foundation_name: settings.foundationName,
                school_address: settings.schoolAddress,
                school_phone: settings.schoolPhone,
                school_email: settings.schoolEmail,
                headmaster_name: settings.headmasterName,
                school_city: settings.schoolCity,
                logo_url: logoUrlToSave,
                favicon_url: faviconUrlToSave,
                signature_url: signatureUrlToSave,
                stamp_url: stampUrlToSave,
            };
            const { error } = await supabase.from('app_settings').update(settingsToUpdate).eq('id', 1);

            if (error) throw error;

            setMessage('Pengaturan berhasil disimpan! Refresh halaman untuk melihat perubahan logo/favicon.');
            setTimeout(() => setMessage(''), 5000);
        } catch (err: any) {
            alert('Gagal menyimpan pengaturan: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading) return <p>Memuat pengaturan...</p>;

    return (
        <Card className="max-w-3xl">
            <form onSubmit={handleSave} className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold mb-4">Atur Identitas Aplikasi & Sekolah</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Aplikasi</label>
                            <input type="text" name="appName" value={settings.appName || ''} onChange={handleChange} className="mt-1 p-2 border rounded-md w-full" disabled={user?.role !== 'admin'} />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Yayasan</label>
                            <input type="text" name="foundationName" value={settings.foundationName || ''} onChange={handleChange} className="mt-1 p-2 border rounded-md w-full" disabled={user?.role !== 'admin'}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Sekolah</label>
                            <input type="text" name="schoolName" value={settings.schoolName || ''} onChange={handleChange} className="mt-1 p-2 border rounded-md w-full" disabled={user?.role !== 'admin'}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Kepala Sekolah</label>
                            <input type="text" name="headmasterName" value={settings.headmasterName || ''} onChange={handleChange} className="mt-1 p-2 border rounded-md w-full" disabled={user?.role !== 'admin'}/>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Alamat Sekolah</label>
                            <textarea name="schoolAddress" value={settings.schoolAddress || ''} onChange={handleChange} rows={3} className="mt-1 p-2 border rounded-md w-full" disabled={user?.role !== 'admin'}></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Telepon Sekolah</label>
                            <input type="text" name="schoolPhone" value={settings.schoolPhone || ''} onChange={handleChange} className="mt-1 p-2 border rounded-md w-full" disabled={user?.role !== 'admin'}/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Email Sekolah</label>
                            <input type="email" name="schoolEmail" value={settings.schoolEmail || ''} onChange={handleChange} className="mt-1 p-2 border rounded-md w-full" disabled={user?.role !== 'admin'}/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Kota (untuk ttd. kartu)</label>
                            <input type="text" name="schoolCity" value={settings.schoolCity || ''} onChange={handleChange} className="mt-1 p-2 border rounded-md w-full" disabled={user?.role !== 'admin'}/>
                        </div>
                    </div>
                </div>

                <div className="border-t pt-6">
                     <h3 className="text-lg font-semibold mb-4">Logo & Favicon</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Logo Sekolah</label>
                            <p className="text-xs text-gray-500 mb-2">Akan ditampilkan di sidebar & kartu siswa.</p>
                            {logoPreview && (
                                <div className="mt-2 p-2 border rounded-md inline-block">
                                    <img src={logoPreview} alt="Logo Preview" className="h-20 w-auto object-contain" />
                                </div>
                            )}
                            <input type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={(e) => handleFileChange(e, 'logo')} className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100" disabled={user?.role !== 'admin'}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Favicon</label>
                             <p className="text-xs text-gray-500 mb-2">Ikon yang muncul di tab browser.</p>
                            <input type="file" accept="image/x-icon, image/png, image/svg+xml" onChange={(e) => handleFileChange(e, 'favicon')} className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100" disabled={user?.role !== 'admin'}/>
                        </div>
                     </div>
                </div>

                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Tanda Tangan & Stempel</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tanda Tangan Kepala Sekolah</label>
                            <p className="text-xs text-gray-500 mb-2">Gunakan .png transparan untuk hasil terbaik.</p>
                            {signaturePreview && (
                                <div className="mt-2 p-2 border rounded-md inline-block bg-gray-100">
                                    <img src={signaturePreview} alt="Signature Preview" className="h-20 w-auto object-contain" />
                                </div>
                            )}
                            <input type="file" accept="image/png" onChange={(e) => handleFileChange(e, 'signature')} className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100" disabled={user?.role !== 'admin'} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Stempel Sekolah</label>
                            <p className="text-xs text-gray-500 mb-2">Gunakan .png transparan untuk hasil terbaik.</p>
                            {stampPreview && (
                                <div className="mt-2 p-2 border rounded-md inline-block">
                                    <img src={stampPreview} alt="Stamp Preview" className="h-20 w-auto object-contain" />
                                </div>
                            )}
                            <input type="file" accept="image/png" onChange={(e) => handleFileChange(e, 'stamp')} className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100" disabled={user?.role !== 'admin'} />
                        </div>
                    </div>
                </div>

                {user?.role === 'admin' && (
                    <div className="flex justify-end mt-4 border-t pt-4">
                        <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-emerald-300" disabled={isSaving}>
                            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
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
                id: 1,
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
                    <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">Simpan Perubahan</button>
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
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-r-md hover:bg-emerald-700">Tambah</button>
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
            setYears((data || []).map(y => ({
                id: y.id,
                year: y.year,
                semester: y.semester as 'Ganjil' | 'Genap',
                isActive: y.is_active,
            })));
        }
        setLoading(false);
    }, []);
    
    useEffect(() => { fetchYears() }, [fetchYears]);

    const setActiveYear = async (id: number) => {
        try {
            const { error: errorInactive } = await supabase.from('academic_years').update({ is_active: false }).eq('is_active', true);
            if (errorInactive) throw errorInactive;
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
                 <button onClick={() => handleOpenModal(null)} className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-sm">Tambah Baru</button>
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
                            <button onClick={() => handleOpenModal(y)} className="p-2 text-sky-600 hover:text-sky-900 hover:bg-gray-100 rounded-full"><PencilIcon className="h-4 w-4"/></button>
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
                        <input type="text" name="year" id="year" value={formData.year} onChange={handleChange} required className="mt-1 focus:ring-sky-500 focus:border-sky-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="semester" className="block text-sm font-medium text-gray-700">Semester</label>
                        <select name="semester" id="semester" value={formData.semester} onChange={handleChange} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md">
                            <option value="Ganjil">Ganjil</option>
                            <option value="Genap">Genap</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">Simpan</button>
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
            const { data, error: rpcError } = await supabase.rpc('get_users_with_email');

            if (rpcError) throw rpcError;

            setUsers(data || []);

        } catch (err: any) {
            setError('Gagal memuat daftar pengguna. Pastikan fungsi "get_users_with_email" ada di database Supabase Anda.');
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