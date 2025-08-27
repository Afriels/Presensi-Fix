
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { AttendanceStatus } from '../types';
import Card, { CardTitle } from './ui/Card';
import { getTodayDateString } from '../services/dataService';
import { supabase } from '../services/supabase';
import { useAuth } from './auth/Auth';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card className="flex items-center p-4">
    <div className={`p-3 rounded-lg ${color}`}>
      {icon}
    </div>
    <div className="ml-4">
      <p className="text-3xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500">{title}</p>
    </div>
  </Card>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    present: 0,
    late: 0,
    sick: 0,
    permitted: 0,
    notPresent: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const today = getTodayDateString();

      try {
        const { count: totalStudents, error: studentsError } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true });

        if (studentsError) throw studentsError;

        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance_records')
          .select('status, student_id')
          .eq('date', today);

        if (attendanceError) throw attendanceError;
        
        if (attendanceData) {
            const present = attendanceData.filter(a => a.status === AttendanceStatus.HADIR).length;
            const late = attendanceData.filter(a => a.status === AttendanceStatus.TERLAMBAT).length;
            const sick = attendanceData.filter(a => a.status === AttendanceStatus.SAKIT).length;
            const permitted = attendanceData.filter(a => a.status === AttendanceStatus.IJIN).length;
            
            const attendedIds = new Set(attendanceData.map(a => a.student_id));
            const notPresent = (totalStudents || 0) - attendedIds.size;

            setStats({ present, late, sick, permitted, notPresent: Math.max(0, notPresent) });
        } else {
            setStats({ present: 0, late: 0, sick: 0, permitted: 0, notPresent: totalStudents || 0 });
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const chartData = [
    { name: 'Hadir', value: stats.present },
    { name: 'Terlambat', value: stats.late },
    { name: 'Ijin', value: stats.permitted },
    { name: 'Sakit', value: stats.sick },
    { name: 'Belum Absen', value: stats.notPresent },
  ];

  const COLORS = ['#10b981', '#facc15', '#0ea5e9', '#f97316', '#94a3b8'];
  
  const displayValue = (value: number) => loading ? '...' : value;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Selamat Datang, {user?.email}!</h1>
        <p className="text-slate-500 mt-1">Berikut adalah ringkasan absensi untuk hari ini.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard title="Hadir" value={displayValue(stats.present)} color="bg-emerald-100 text-emerald-600" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>} />
        <StatCard title="Terlambat" value={displayValue(stats.late)} color="bg-amber-100 text-amber-600" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="6" x2="12" y2="12"/><line x1="12" y1="12" x2="16" y2="14"/></svg>} />
        <StatCard title="Ijin" value={displayValue(stats.permitted)} color="bg-sky-100 text-sky-600" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12h4"/><path d="M10 16h4"/><path d="M8 12h.01"/><path d="M8 16h.01"/></svg>} />
        <StatCard title="Sakit" value={displayValue(stats.sick)} color="bg-orange-100 text-orange-600" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>} />
        <StatCard title="Belum Absen" value={displayValue(stats.notPresent)} color="bg-slate-100 text-slate-600" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v.01"/><path d="M12 8a4 4 0 0 0-4 4"/></svg>} />
      </div>
      <Card>
        <CardTitle>Grafik Kehadiran Hari Ini</CardTitle>
        <div className="w-full h-96 mt-4">
          {loading ? (
            <div className="flex justify-center items-center h-full"><p className="text-slate-500">Memuat data chart...</p></div>
          ) : (
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;