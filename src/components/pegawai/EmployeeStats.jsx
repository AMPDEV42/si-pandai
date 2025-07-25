/**
 * Employee Statistics Component
 * Shows overview statistics for employee data
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, UserCheck, UserX, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const EmployeeStats = ({ employees }) => {
  if (!employees || employees.length === 0) {
    return null;
  }

  // Calculate statistics
  const totalEmployees = employees.length;
  
  // Group by unit kerja
  const unitStats = employees.reduce((acc, emp) => {
    const unit = emp.unitKerja || emp.unit_kerja || emp.unit || 'Tidak Diketahui';
    acc[unit] = (acc[unit] || 0) + 1;
    return acc;
  }, {});

  // Group by pangkat/golongan
  const pangkatStats = employees.reduce((acc, emp) => {
    const pangkat = emp.pangkatGolongan || emp.pangkat_golongan || emp.pangkat || emp.golongan || 'Tidak Diketahui';
    acc[pangkat] = (acc[pangkat] || 0) + 1;
    return acc;
  }, {});

  // Calculate age range
  const currentYear = new Date().getFullYear();
  const ages = employees
    .filter(emp => emp.tanggalLahir || emp.tanggal_lahir || emp.birth_date)
    .map(emp => {
      const birthDate = new Date(emp.tanggalLahir || emp.tanggal_lahir || emp.birth_date);
      return currentYear - birthDate.getFullYear();
    })
    .filter(age => age > 0 && age < 100);

  const avgAge = ages.length > 0 ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : 0;

  // Calculate average masa kerja
  const masaKerjaData = employees
    .filter(emp => (emp.masaKerja?.tahun || emp.masa_kerja?.tahun) !== undefined)
    .map(emp => emp.masaKerja?.tahun || emp.masa_kerja?.tahun || 0);
  
  const avgMasaKerja = masaKerjaData.length > 0 
    ? Math.round(masaKerjaData.reduce((sum, years) => sum + years, 0) / masaKerjaData.length) 
    : 0;

  // Get top units
  const topUnits = Object.entries(unitStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  // Get top pangkat
  const topPangkat = Object.entries(pangkatStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  const statCards = [
    {
      title: 'Total Pegawai',
      value: totalEmployees,
      icon: <Users className="w-6 h-6" />,
      color: 'bg-blue-500',
      change: null
    },
    {
      title: 'Unit Kerja',
      value: Object.keys(unitStats).length,
      icon: <Building2 className="w-6 h-6" />,
      color: 'bg-green-500',
      change: null
    },
    {
      title: 'Rata-rata Usia',
      value: avgAge > 0 ? `${avgAge} tahun` : 'N/A',
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-purple-500',
      change: null
    },
    {
      title: 'Rata-rata Masa Kerja',
      value: avgMasaKerja > 0 ? `${avgMasaKerja} tahun` : 'N/A',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-orange-500',
      change: null
    }
  ];

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-white/5 border-white/20 backdrop-blur-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}/20`}>
                    <div className={`text-${stat.color.replace('bg-', '').replace('-500', '')}-400`}>
                      {stat.icon}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Units */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white/5 border-white/20 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Unit Kerja Terbanyak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topUnits.map(([unit, count], index) => {
                  const percentage = Math.round((count / totalEmployees) * 100);
                  return (
                    <div key={unit} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm truncate flex-1 mr-2">
                          {unit}
                        </span>
                        <span className="text-white font-medium text-sm">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <motion.div
                          className="bg-blue-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Pangkat */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white/5 border-white/20 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Pangkat/Golongan Terbanyak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPangkat.map(([pangkat, count], index) => {
                  const percentage = Math.round((count / totalEmployees) * 100);
                  return (
                    <div key={pangkat} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm truncate flex-1 mr-2">
                          {pangkat}
                        </span>
                        <span className="text-white font-medium text-sm">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <motion.div
                          className="bg-green-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default EmployeeStats;
