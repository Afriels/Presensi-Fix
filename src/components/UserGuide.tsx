import React, { useState } from 'react';
import Card, { CardHeader, CardTitle } from './ui/Card';

const guideSections = [
    {
        title: 'Dashboard',
        content: 'Halaman Dashboard menampilkan ringkasan data absensi untuk hari ini secara real-time. Anda dapat melihat jumlah siswa yang hadir, terlambat, ijin, sakit, dan yang belum melakukan absensi. Terdapat juga diagram lingkaran untuk visualisasi data yang lebih mudah dipahami.'
    },
    {
        title: 'Scan Barcode',
        content: 'Menu ini adalah fitur utama untuk mencatat kehadiran. Siswa cukup menghadapkan kartu pelajar yang memiliki barcode ke kamera. Sistem akan otomatis mencatat waktu kehadiran. Jika tidak ada kamera, Nomor Induk Siswa (NIS) juga bisa diketik manual.'
    },
    {
        title: 'Input Manual',
        content: 'Gunakan fitur ini untuk mencatat absensi siswa yang tidak bisa melakukan scan, misalnya karena sakit, ijin, atau lupa membawa kartu. Pilih nama siswa, tanggal, dan status, lalu simpan. Data akan langsung masuk ke laporan.'
    },
    {
        title: 'Laporan Harian',
        content: 'Halaman ini menampilkan detail absensi semua siswa pada tanggal yang dipilih. Anda bisa memfilter berdasarkan kelas. Laporan ini juga dilengkapi fitur CRUD (Create, Read, Update, Delete) untuk mengelola data absensi. Data dapat diekspor ke format Excel (CSV).'
    },
    {
        title: 'Rekap Bulanan',
        content: 'Menampilkan rekapitulasi total kehadiran (hadir, terlambat, sakit, ijin) untuk setiap siswa dalam satu bulan penuh. Fitur ini sangat membantu dalam pembuatan laporan bulanan. Data juga dapat diekspor ke Excel (CSV).'
    },
    {
        title: 'Data Siswa',
        content: 'Di sini Anda dapat mengelola data semua siswa, termasuk menambah siswa baru, mengedit data yang sudah ada (nama, kelas), dan menghapus data siswa. Anda juga bisa mencetak kartu siswa yang sudah dilengkapi QR Code dari menu ini.'
    },
    {
        title: 'Pengaturan',
        content: 'Menu Pengaturan memungkinkan Anda untuk mengkonfigurasi jam masuk, batas toleransi keterlambatan, dan jam pulang. Selain itu, Anda bisa mengelola daftar kelas, tahun ajaran, dan melakukan backup seluruh data aplikasi ke dalam sebuah file.'
    }
];

const AccordionItem: React.FC<{ title: string; children: React.ReactNode; isOpen: boolean; onClick: () => void; }> = ({ title, children, isOpen, onClick }) => {
    return (
        <div className="border-b">
            <h2>
                <button
                    type="button"
                    className="flex justify-between items-center w-full p-5 font-medium text-left text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    onClick={onClick}
                    aria-expanded={isOpen}
                >
                    <span className="text-lg">{title}</span>
                    <svg className={`w-6 h-6 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                </button>
            </h2>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                <div className="p-5 border-t border-gray-200">
                    <p className="text-gray-600 leading-relaxed">{children}</p>
                </div>
            </div>
        </div>
    );
};

const UserGuide: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const handleClick = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Petunjuk Penggunaan Aplikasi</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Klik pada setiap judul untuk melihat penjelasan detailnya.</p>
            </CardHeader>
            <div className="border rounded-md">
                {guideSections.map((section, index) => (
                    <AccordionItem
                        key={index}
                        title={section.title}
                        isOpen={openIndex === index}
                        onClick={() => handleClick(index)}
                    >
                        {section.content}
                    </AccordionItem>
                ))}
            </div>
        </Card>
    );
};

export default UserGuide;