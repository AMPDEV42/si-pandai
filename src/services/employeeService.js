/**
 * Employee Service
 * Handles all employee-related database operations
 */

import { supabase, withErrorHandling } from '../lib/customSupabaseClient';
import { apiLogger } from '../lib/logger';

class EmployeeService {
  /**
   * Get all employees with optional filters
   */
  async getEmployees(filters = {}) {
    return withErrorHandling(async () => {
      let query = supabase
        .from('pegawai')
        .select(`*`);

      // Apply filters based on available columns
      if (filters.search) {
        // Use a more flexible search that works with common column names
        query = query.or(`nama.ilike.%${filters.search}%,nip.ilike.%${filters.search}%,unit.ilike.%${filters.search}%`);
      }

      if (filters.unitKerja) {
        query = query.eq('unit', filters.unitKerja);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      // Order by a common column that likely exists
      query = query.order('nama', { ascending: true });

      const result = await query;

      // Transform data to expected format if needed
      if (result.data) {
        result.data = result.data.map(pegawai => ({
          ...pegawai,
          // Map common field names to expected format
          id: pegawai.id,
          full_name: pegawai.nama || pegawai.full_name || pegawai.name || 'N/A',
          nip: pegawai.nip || 'N/A',
          email: pegawai.email || 'N/A',
          phone: pegawai.phone || pegawai.telepon || pegawai.no_hp || null,
          unit_kerja: pegawai.unit || pegawai.unit_kerja || pegawai.bagian || 'N/A',
          position: pegawai.position || pegawai.jabatan || pegawai.posisi || 'N/A',
          rank: pegawai.rank || pegawai.pangkat || pegawai.golongan || 'N/A',
          employee_type: pegawai.employee_type || pegawai.jenis_pegawai || pegawai.status_kepegawaian || 'PNS',
          status: pegawai.status || 'active',
          created_at: pegawai.created_at,
          updated_at: pegawai.updated_at
        }));
      }

      return result;
    }, 'getEmployees');
  }

  /**
   * Get employee by ID with submission history
   */
  async getEmployeeById(id) {
    return withErrorHandling(async () => {
      const [employeeResult, submissionsResult] = await Promise.all([
        supabase
          .from('pegawai')
          .select(`*`)
          .eq('id', id)
          .single(),

        supabase
          .from('submissions')
          .select('*')
          .eq('user_id', id)
          .order('created_at', { ascending: false })
      ]);

      if (employeeResult.error) {
        throw employeeResult.error;
      }

      let submissionsWithProfiles = [];

      // Manually fetch submitter profiles if submissions exist
      if (submissionsResult.data && submissionsResult.data.length > 0) {
        const userIds = [...new Set(submissionsResult.data.map(s => s.user_id).filter(Boolean))];

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email, unit_kerja')
            .in('id', userIds);

          if (profiles) {
            const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));

            submissionsWithProfiles = submissionsResult.data.map(submission => ({
              ...submission,
              submitter: profileMap[submission.user_id] || null
            }));
          } else {
            submissionsWithProfiles = submissionsResult.data;
          }
        } else {
          submissionsWithProfiles = submissionsResult.data;
        }
      }

      return {
        data: {
          employee: employeeResult.data,
          submissions: submissionsWithProfiles
        },
        error: null
      };
    }, `getEmployeeById: ${id}`);
  }

  /**
   * Create new employee
   */
  async createEmployee(employeeData) {
    return withErrorHandling(async () => {
      const employee = {
        ...employeeData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const result = await supabase
        .from('pegawai')
        .insert([employee])
        .select()
        .single();

      if (result.error) {
        throw result.error;
      }

      apiLogger.info('New employee created', {
        employeeId: result.data?.id,
        nip: employee.nip,
        name: employee.full_name
      });

      return result;
    }, 'createEmployee');
  }

  /**
   * Update employee
   */
  async updateEmployee(id, updateData) {
    return withErrorHandling(async () => {
      const updates = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      const result = await supabase
        .from('pegawai')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (result.error) {
        throw result.error;
      }

      apiLogger.info('Employee updated', {
        employeeId: id,
        updates: Object.keys(updateData)
      });

      return result;
    }, `updateEmployee: ${id}`);
  }

  /**
   * Delete employee
   */
  async deleteEmployee(id) {
    return withErrorHandling(async () => {
      const result = await supabase
        .from('pegawai')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (result.error) {
        throw result.error;
      }

      apiLogger.info('Employee deleted', { employeeId: id });
      return result;
    }, `deleteEmployee: ${id}`);
  }

  /**
   * Search employees
   */
  async searchEmployees(searchTerm, limit = 10) {
    return withErrorHandling(async () => {
      let query = supabase
        .from('pegawai')
        .select('*')
        .or(`nama.ilike.%${searchTerm}%,nip.ilike.%${searchTerm}%`)
        .limit(limit)
        .order('nama', { ascending: true });

      const result = await query;

      // Transform data to expected format
      if (result.data) {
        result.data = result.data.map(pegawai => ({
          id: pegawai.id,
          full_name: pegawai.nama || pegawai.full_name || pegawai.name || 'N/A',
          nip: pegawai.nip || 'N/A',
          unit_kerja: pegawai.unit || pegawai.unit_kerja || pegawai.bagian || 'N/A',
          email: pegawai.email || 'N/A',
          position: pegawai.position || pegawai.jabatan || pegawai.posisi || 'N/A'
        }));
      }

      return result;
    }, `searchEmployees: ${searchTerm}`);
  }

  /**
   * Get employee statistics
   */
  async getEmployeeStats() {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('pegawai')
        .select('unit, status');

      if (error) throw error;

      const stats = {
        total: data.length,
        active: data.filter(emp => emp.status === 'active' || !emp.status).length,
        inactive: data.filter(emp => emp.status === 'inactive').length,
        byUnit: data.reduce((acc, employee) => {
          const unit = employee.unit || employee.unit_kerja || 'N/A';
          acc[unit] = (acc[unit] || 0) + 1;
          return acc;
        }, {})
      };

      return { data: stats, error: null };
    }, 'getEmployeeStats');
  }
}

// Create and export service instance
export const employeeService = new EmployeeService();
export default employeeService;
