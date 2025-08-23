import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Briefcase, TrendingUp, ArrowLeftRight } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const ReportCard = ({ icon, title, value, bgColor, iconColor }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm flex items-center border border-gray-200">
        <div className={`p-3 rounded-lg mr-4 ${bgColor}`}>
            {React.cloneElement(icon, { className: `w-6 h-6 ${iconColor}` })}
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

function Reporting() {
  const { employees } = useAppContext();

  const { headcountData, stats } = useMemo(() => {
    if (!employees) return { headcountData: [], stats: {} };

    // Calculate Headcount Growth by month for the current year
    const monthlyHeadcount = {};
    const currentYear = new Date().getFullYear();

    employees.forEach(emp => {
      if (emp.hireDate) {
        const hireDate = new Date(emp.hireDate);
        if (hireDate.getFullYear() <= currentYear) {
            const month = hireDate.getMonth();
            for (let m = month; m < 12; m++) {
                const monthKey = new Date(currentYear, m).toLocaleString('default', { month: 'short' });
                monthlyHeadcount[m] = (monthlyHeadcount[m] || 0) + 1;
            }
        }
      }
    });

    const chartData = Array.from({ length: 12 }, (_, i) => {
        const monthName = new Date(currentYear, i).toLocaleString('default', { month: 'short' });
        return { name: monthName, headcount: monthlyHeadcount[i] || 0 };
    });

    // Calculate Stats
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const newHiresThisMonth = employees.filter(emp => {
        if (!emp.hireDate) return false;
        const hireDate = new Date(emp.hireDate);
        return hireDate >= firstDayOfMonth;
    }).length;

    const departmentCount = new Set(employees.map(e => e.department).filter(Boolean)).size;

    const calculatedStats = {
      totalHeadcount: employees.length,
      newHires: newHiresThisMonth,
      departments: departmentCount,
    };

    return { headcountData: chartData, stats: calculatedStats };
  }, [employees]);

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Reporting</h1>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ReportCard icon={<Users />} title="Total Headcount" value={stats.totalHeadcount} bgColor="bg-blue-100" iconColor="text-blue-600" />
        <ReportCard icon={<Briefcase />} title="Departments" value={stats.departments} bgColor="bg-green-100" iconColor="text-green-600" />
        <ReportCard icon={<TrendingUp />} title="New Hires This Month" value={stats.newHires} bgColor="bg-purple-100" iconColor="text-purple-600" />
        <ReportCard icon={<ArrowLeftRight />} title="Turnover Rate" value="5%" bgColor="bg-orange-100" iconColor="text-orange-600" />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Headcount Growth ({new Date().getFullYear()})</h2>
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={headcountData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip 
                        contentStyle={{ 
                            borderRadius: '0.5rem', 
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                            border: '1px solid #e5e7eb'
                        }}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="headcount" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Reporting;