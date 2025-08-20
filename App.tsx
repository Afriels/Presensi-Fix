
import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './components/Dashboard';
import BarcodeScanner from './components/BarcodeScanner';
import DailyReport from './components/DailyReport';
import MonthlyReport from './components/MonthlyReport';
import ManualInput from './components/ManualInput';
import StudentData from './components/StudentData';
import Settings from './components/Settings';
import UserGuide from './components/UserGuide';

const App: React.FC = () => {

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/scan" element={<BarcodeScanner />} />
        <Route path="/laporan-harian" element={<DailyReport />} />
        <Route path="/laporan-bulanan" element={<MonthlyReport />} />
        <Route path="/input-manual" element={<ManualInput />} />
        <Route path="/data-siswa" element={<StudentData />} />
        <Route path="/pengaturan" element={<Settings />} />
        <Route path="/petunjuk" element={<UserGuide />} />
      </Routes>
    </Layout>
  );
};

export default App;