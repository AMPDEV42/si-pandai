/**
 * Employee Service
 * Handles all employee-related database operations
 */

import { supabase, withErrorHandling } from '../lib/customSupabaseClient';
import { apiLogger } from '../lib/logger';

class EmployeeService {
  /**
   * Get all employees with optional filters
   * Temporarily using profiles table until employees table is created
   */
  async getEmployees(filters = {}) {
    return withErrorHandling(async () => {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          unit_kerja,
          nip,
          phone,
          role,
          created_at,
          updated_at
        `)
        .order('full_name', { ascending: true });

      // Apply filters
      if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,nip.ilike.%${filters.search}%,unit_kerja.ilike.%${filters.search}%`);
      }

      if (filters.unitKerja) {
        query = query.eq('unit_kerja', filters.unitKerja);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const result = await query;

      // Transform profiles data to employee format
      if (result.data) {
        result.data = result.data.map(profile => ({
          id: profile.id,
          full_name: profile.full_name || profile.email,
          nip: profile.nip || 'N/A',
          email: profile.email,
          phone: profile.phone,
          unit_kerja: profile.unit_kerja || 'N/A',
          position: 'N/A', // Will be available when employees table is created
          rank: 'N/A', // Will be available when employees table is created
          employee_type: 'PNS', // Default value
          status: 'active', // Default value
          created_at: profile.created_at,
          updated_at: profile.updated_at
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
          .from('employees')
          .select('*')
          .eq('id', id)
          .single(),
        
        supabase
          .from('submissions')
          .select(`
            *,
            submitter:profiles!submissions_submitted_by_fkey(
              full_name,
              email
            )
          `)
          .eq('employee_id', id)
          .order('created_at', { ascending: false })
      ]);

      if (employeeResult.error) {
        throw employeeResult.error;
      }

      return {
        data: {
          employee: employeeResult.data,
          submissions: submissionsResult.data || []
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
        .from('employees')
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
        .from('employees')
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
        .from('employees')
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
      const result = await supabase
        .from('employees')
        .select('id, full_name, nip, unit_kerja, position')
        .or(`full_name.ilike.%${searchTerm}%,nip.ilike.%${searchTerm}%`)
        .limit(limit)
        .order('full_name', { ascending: true });

      return result;
    }, `searchEmployees: ${searchTerm}`);
  }

  /**
   * Get employee statistics
   */
  async getEmployeeStats() {
    return withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('status, unit_kerja');

      if (error) throw error;

      const stats = {
        total: data.length,
        active: data.filter(emp => emp.status === 'active').length,
        inactive: data.filter(emp => emp.status === 'inactive').length,
        byUnit: data.reduce((acc, emp) => {
          acc[emp.unit_kerja] = (acc[emp.unit_kerja] || 0) + 1;
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
