import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import useLocalStorage from '../hooks/useLocalStorage';
import { AttendanceRecord, AttendanceStatus, Student } from '../types';
import Card, { CardTitle } from './ui/Card';
import { getTodayDateString } from '../services/dataService';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card className="flex items-center">
    <div className={`p-3 rounded-full ${color}`}>
      {icon}
    </div>
    <div className="ml-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </Card>
);

const Dashboard: React.FC = () => {
  const [students] = useLocalStorage<Student[]>('students', []);
  const [attendance] = useLocalStorage<AttendanceRecord[]>('attendance', []);

  const todayStats = useMemo(() => {
    const today = getTodayDateString();
    const todayAttendance = attendance.filter(a => a.date === today);

    const present = todayAttendance.filter(a => a.status === AttendanceStatus.HADIR).length;
    const late = todayAttendance.filter(a => a.status === AttendanceStatus.TERLAMBAT).length;
    const sick = todayAttendance.filter(a => a.status === AttendanceStatus.SAKIT).length;
    const permitted = todayAttendance.filter(a => a.status === AttendanceStatus.IJIN).length;

    const attendedIds = new Set(todayAttendance.map(a => a.studentId));
    const notPresent = students.length - attendedIds.size;

    return { present, late, sick, permitted, notPresent };
  }, [attendance, students]);

  const chartData = [
    { name: 'Hadir', value: todayStats.present },
    { name: 'Terlambat', value: todayStats.late },
    { name: 'Ijin', value: todayStats.permitted },
    { name: 'Sakit', value: todayStats.sick },
    { name: 'Belum Absen', value: todayStats.notPresent },
  ];

  const COLORS = ['#16a34a', '#facc15', '#3b82f6', '#f97316', '#9ca3af'];

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Dashboard Pemantauan</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <StatCard title="Hadir" value={todayStats.present} color="bg-green-100 text-green-600" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>} />
        <StatCard title="Terlambat" value={todayStats.late} color="bg-yellow-100 text-yellow-600" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="6" x2="12" y2="12"/><line x1="12" y1="12" x2="16" y2="14"/></svg>} />
        <StatCard title="Ijin" value={todayStats.permitted} color="bg-blue-100 text-blue-600" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12h4"/><path d="M10 16h4"/><path d="M8 12h.01"/><path d="M8 16h.01"/></svg>} />
        <StatCard title="Sakit" value={todayStats.sick} color="bg-orange-100 text-orange-600" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>} />
        <StatCard title="Belum Absen" value={todayStats.notPresent} color="bg-gray-100 text-gray-600" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v.01"/><path d="M12 8a4 4 0 0 0-4 4"/></svg>} />
      </div>
      <Card>
        <CardTitle>Rekap Kehadiran Hari Ini</CardTitle>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
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
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;