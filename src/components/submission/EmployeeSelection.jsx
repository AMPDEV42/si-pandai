/**
 * Employee Selection Component
 * Allows users to search and select employee for submission
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, Building2, Calendar, Check, User, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { employeeService } from '../../services/employeeService';
import { apiLogger } from '../../lib/logger';
import NetworkErrorHandler from '../common/NetworkErrorHandler';

const EmployeeSelection = ({ selectedEmployee, onEmployeeSelect, className = '' }) => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load employees
  const loadEmployees = useCallback(async (search = '') => {
    try {
      setIsLoading(true);
      setError(null);

      const filters = {};
      if (search.trim()) {
        filters.search = search.trim();
        filters.limit = 20;
      } else {
        filters.limit = 10; // Show only 10 when no search
      }

      const result = await employeeService.getEmployees(filters);
      
      if (result.error) {
        throw result.error;
      }

      setEmployees(result.data || []);
      
      apiLogger.debug('Employees loaded', {
        count: result.data?.length || 0,
        searchTerm: search
      });

    } catch (err) {
      apiLogger.error('Failed to load employees', err);
      setError('Gagal memuat data pegawai. Silakan coba lagi.');
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') {
        loadEmployees(searchTerm);
      } else {
        loadEmployees();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, loadEmployees]);

  const handleEmployeeSelect = (employee) => {
    onEmployeeSelect(employee);
    apiLogger.info('Employee selected for submission', {
      employeeId: employee.id,
      employeeName: employee.full_name,
      nip: employee.nip
    });
  };

  const getRankBadgeColor = (rank) => {
    if (!rank) return 'bg-gray-500';
    const level = rank.split('/')[0];
    switch (level) {
      case 'I': return 'bg-blue-500';
      case 'II': return 'bg-green-500';
      case 'III': return 'bg-yellow-500';
      case 'IV': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className={`glass-effect border-white/20 ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="w-5 h-5" />
          Pilih Data Pegawai
        </CardTitle>
        <p className="text-gray-300 text-sm">
          Pilih pegawai yang akan diajukan usulannya
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Cari berdasarkan nama atau NIP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus-ring"
          />
        </div>

        {/* Selected Employee Display */}
        {selectedEmployee && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-lg bg-green-500/20 border border-green-500/30"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-green-500/20 rounded-full">
                  <Check className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{selectedEmployee.full_name}</h4>
                  <div className="flex items-center gap-3 text-sm text-gray-300 mt-1">
                    <span>NIP: {selectedEmployee.nip}</span>
                    <Badge className={`${getRankBadgeColor(selectedEmployee.rank)} text-white text-xs`}>
                      {selectedEmployee.rank || 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {selectedEmployee.unit_kerja}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {selectedEmployee.position || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEmployeeSelect(null)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Ganti
              </Button>
            </div>
          </motion.div>
        )}

        {/* Employee List */}
        {!selectedEmployee && (
          <div className="max-h-80 overflow-y-auto scrollbar-hide">
            {error ? (
              <div className="text-center py-8 text-red-400">
                <p>{error}</p>
                <Button 
                  onClick={() => loadEmployees(searchTerm)}
                  size="sm"
                  variant="outline"
                  className="mt-2"
                >
                  Coba Lagi
                </Button>
              </div>
            ) : isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10 animate-pulse">
                    <div className="space-y-2">
                      <div className="h-4 bg-white/10 rounded w-3/4"></div>
                      <div className="h-3 bg-white/10 rounded w-1/2"></div>
                      <div className="h-3 bg-white/10 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{searchTerm ? 'Tidak ada pegawai ditemukan' : 'Belum ada data pegawai'}</p>
                <p className="text-xs mt-1">
                  {searchTerm ? 'Coba ubah kata kunci pencarian' : 'Silakan tambahkan data pegawai terlebih dahulu'}
                </p>
              </div>
            ) : (
              <AnimatePresence>
                <div className="space-y-2">
                  {employees.map((employee, index) => (
                    <motion.div
                      key={employee.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      className="p-4 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all duration-200"
                      onClick={() => handleEmployeeSelect(employee)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-white">{employee.full_name}</h4>
                            <div className="flex items-center gap-3 text-sm text-gray-300 mt-1">
                              <span>NIP: {employee.nip}</span>
                              {employee.rank && (
                                <Badge className={`${getRankBadgeColor(employee.rank)} text-white text-xs`}>
                                  {employee.rank}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Badge 
                            className={`text-xs ${employee.status === 'active' ? 'bg-green-500' : 'bg-gray-500'} text-white`}
                          >
                            {employee.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {employee.unit_kerja}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {employee.position || 'N/A'}
                          </div>
                        </div>

                        {employee.email && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="w-3 h-3" />
                            {employee.email}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>
        )}

        {/* Help Text */}
        {!selectedEmployee && employees.length > 0 && (
          <p className="text-xs text-gray-500 text-center">
            Klik pada data pegawai untuk memilih
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeeSelection;
