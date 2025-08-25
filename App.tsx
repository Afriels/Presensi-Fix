
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
import LoginPage from './components/auth/LoginPage';
import { ProtectedRoute } from './components/auth/Auth';
import { supabase } from './services/supabase';

const App: React.FC = () => {

  useEffect(() => {
    const setFavicon = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('favicon_url')
          .eq('id', 1)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data?.favicon_url) {
          const faviconLink = document.getElementById('favicon-link') as HTMLLinkElement;
          if (faviconLink) {
            faviconLink.href = data.favicon_url;
            const ext = data.favicon_url.split('.').pop()?.toLowerCase() || '';
            if (ext.includes('ico')) faviconLink.type = 'image/x-icon';
            else if (ext.includes('png')) faviconLink.type = 'image/png';
            else if (ext.includes('svg')) faviconLink.type = 'image/svg+xml';
            else faviconLink.type = 'image/jpeg';
          }
        }
      } catch (error: any) {
        // Improved error logging to help diagnose RLS issues.
        if (error && error.message && error.message.includes('security violation')) {
          console.warn(
            "Security policy violation when fetching app settings. " +
            "This is likely due to missing Row Level Security (RLS) policies on the 'app_settings' table. " +
            "Please ensure public read access is enabled for this table in your Supabase settings."
          );
        } else {
          console.error("Error setting favicon:", error);
        }
      }
    };
    setFavicon();
  }, []);

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