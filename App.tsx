import React from 'react';
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
import LoginPage from './components/auth/LoginPage';
import { ProtectedRoute } from './components/auth/Auth';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/*" 
        element={
          <ProtectedRoute>
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
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

export default App;