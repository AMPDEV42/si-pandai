/**
 * Real Submission Data Service
 * Handles all submission-related database operations
 */

import { supabase, withErrorHandling, supabaseHelpers } from '../lib/customSupabaseClient';
import { apiLogger } from '../lib/logger';
import { validateSubmissionForm } from '../lib/validation';
import { SUBMISSION_STATUS } from '../constants';
import {
  notifyNewSubmission,
  notifySubmissionStatusUpdate,
  notifyVerificationResult
} from './notificationService';

class SubmissionService {
  /**
   * Get submissions with optional filters
   */
  async getSubmissions(filters = {}) {
    return withErrorHandling(async () => {
      let query = supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.submittedBy) {
        query = query.eq('user_id', filters.submittedBy);
      }

      if (filters.unitKerja) {
        query = query.eq('unit_kerja', filters.unitKerja);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const result = await query;

      // If successful, manually fetch related profile data
      if (result.data && result.data.length > 0) {
        const userIds = [...new Set([
          ...result.data.map(s => s.user_id).filter(Boolean),
          ...result.data.map(s => s.reviewed_by).filter(Boolean)
        ])];

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email, unit_kerja')
            .in('id', userIds);

          if (profiles) {
            const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));

            result.data = result.data.map(submission => ({
              ...submission,
              submitter: profileMap[submission.user_id] || null,
              reviewer: profileMap[submission.reviewed_by] || null
            }));
          }
        }
      }

      return result;
    }, 'getSubmissions');
  }

  /**
   * Get submission by ID
   */
  async getSubmissionById(id) {
    return withErrorHandling(async () => {
      // First, get the submission data
      const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (submissionError) throw submissionError;
      if (!submission) return { data: null, error: { message: 'Submission not found' } };

      // Get user IDs for related data
      const userIds = [submission.user_id, submission.reviewed_by].filter(Boolean);

      // Initialize default values
      let profiles = [];
      let employeeData = null;

      try {
        // Only fetch profiles if there are user IDs
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);
          profiles = profilesData || [];
        }
      } catch (e) {
        console.warn('Could not fetch profiles:', e.message);
      }

      // Try to get employee data based on NIP from submission
      const nipFromSubmission = submission.nip ||
                               (submission.personal_info && submission.personal_info.nip) ||
                               (submission.data_pemohon && submission.data_pemohon.nip);

      if (nipFromSubmission) {
        try {
          const { data: pegawaiData } = await supabase
            .from('pegawai')
            .select('*')
            .eq('nip', nipFromSubmission.toString().trim())
            .single();

          if (pegawaiData) {
            // Convert snake_case to camelCase for consistency
            const formattedEmployeeData = {};
            Object.keys(pegawaiData).forEach(key => {
              const camelKey = key.replace(/_(\w)/g, (_, letter) => letter.toUpperCase());
              formattedEmployeeData[camelKey] = pegawaiData[key];
            });
            employeeData = formattedEmployeeData;

            console.log('Found employee data for NIP:', nipFromSubmission, employeeData);
          }
        } catch (e) {
          console.warn('Could not fetch employee data for NIP:', nipFromSubmission, e.message);
        }
      }

      // Don't try to fetch from non-existent tables
      // Instead, use empty arrays as defaults
      const documents = [];
      const history = [];
      const notes = [];

      // Process user data
      const userMap = new Map();
      profiles.forEach(profile => {
        userMap.set(profile.id, profile);
      });

      // Create comprehensive personal info by combining employee data, submission data, and profile data
      const userProfile = userMap.get(submission.user_id);

      // Format phone number helper
      const formatPhoneNumber = (phone) => {
        if (!phone) return '-';
        const cleaned = ('' + phone).replace(/\D/g, '');
        if (cleaned.startsWith('0')) {
          return cleaned.replace(/^(\d{3})(\d{4})(\d{4,})$/, '$1-$2-$3');
        }
        if (cleaned.startsWith('62')) {
          return cleaned.replace(/^(62)(\d{3})(\d{4})(\d{4,})$/, '+$1 $2-$3-$4');
        }
        return phone;
      };

      // Format date helper
      const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
          const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
          if (isNaN(date.getTime())) return '-';
          return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          });
        } catch (e) {
          return '-';
        }
      };

      // Format gender helper
      const formatGender = (gender) => {
        if (!gender) return '-';
        const genderStr = String(gender).trim().toLowerCase();
        const genderMap = {
          'l': 'Laki-laki', 'p': 'Perempuan', 'm': 'Laki-laki', 'f': 'Perempuan',
          'male': 'Laki-laki', 'female': 'Perempuan', 'laki-laki': 'Laki-laki',
          'perempuan': 'Perempuan', 'pria': 'Laki-laki', 'wanita': 'Perempuan',
          'lk': 'Laki-laki', 'pr': 'Perempuan', '1': 'Laki-laki', '2': 'Perempuan'
        };
        return genderMap[genderStr] || genderStr.charAt(0).toUpperCase() + genderStr.slice(1);
      };

      // Build comprehensive personalInfo from multiple sources
      const personalInfo = {
        // Basic Information - prioritize employee data, then submission data, then profile data
        name: (employeeData?.namaLengkap ||
              employeeData?.nama ||
              submission.nama_pemohon ||
              userProfile?.full_name ||
              submission.personal_info?.name ||
              'Tidak Diketahui').toString().trim(),

        nip: (employeeData?.nip ||
             nipFromSubmission ||
             submission.personal_info?.nip ||
             '-').toString().trim(),

        email: (employeeData?.email ||
               submission.email ||
               userProfile?.email ||
               submission.personal_info?.email ||
               '-').toString().trim().toLowerCase(),

        phone: formatPhoneNumber(
          employeeData?.noHp ||
          employeeData?.noTelepon ||
          submission.no_telp ||
          submission.personal_info?.phone ||
          ''
        ),

        // Birth Information
        tempatLahir: (employeeData?.tempatLahir ||
                     submission.personal_info?.tempatLahir ||
                     '-').toString().trim(),

        tanggalLahir: formatDate(employeeData?.tanggalLahir ||
                               submission.personal_info?.tanggalLahir ||
                               null),

        jenisKelamin: formatGender(employeeData?.jenisKelamin ||
                                 submission.personal_info?.jenisKelamin ||
                                 null),

        // Employment Information
        statusKepegawaian: (employeeData?.statusKepegawaian ||
                           submission.personal_info?.statusKepegawaian ||
                           '-').toString().trim(),

        jenisJabatan: (employeeData?.jenisJabatan ||
                      submission.personal_info?.jenisJabatan ||
                      '-').toString().trim(),

        pangkatGolongan: (employeeData?.pangkatGolongan ||
                         (employeeData?.golongan ? `Golongan ${employeeData.golongan}` : null) ||
                         submission.personal_info?.pangkatGolongan ||
                         '-').toString().trim(),

        tmt: formatDate(employeeData?.tmt ||
                       submission.personal_info?.tmt ||
                       null),

        // Job Information
        position: (employeeData?.jabatan ||
                  employeeData?.namaJabatan ||
                  submission.jabatan ||
                  submission.personal_info?.position ||
                  '-').toString().trim(),

        unit: (employeeData?.unitKerja ||
              employeeData?.instansi ||
              submission.unit_kerja ||
              userProfile?.unit_kerja ||
              submission.personal_info?.unit ||
              'Sekretariat Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas').toString().trim(),

        pendidikanTerakhir: (employeeData?.pendidikanTerakhir ||
                           submission.personal_info?.pendidikanTerakhir ||
                           '-').toString().trim(),

        // Address Information
        alamat: (employeeData?.alamat ||
                employeeData?.alamatLengkap ||
                (employeeData?.alamatJalan ?
                  `${employeeData.alamatJalan}, ${employeeData.kelurahan || ''}, ${employeeData.kecamatan || ''}, ${employeeData.kota || ''}, ${employeeData.provinsi || ''} ${employeeData.kodePos ? ', ' + employeeData.kodePos : ''}`.replace(/,\s*,/g, ',').replace(/,\s*$/, '') :
                  null) ||
                submission.personal_info?.alamat ||
                '-').toString().trim(),

        // Avatar URL
        avatar_url: employeeData?.foto ||
                   employeeData?.fotoProfile ||
                   employeeData?.photoUrl ||
                   submission.personal_info?.avatar_url ||
                   null
      };

      // Combine all data
      const result = {
        ...submission,
        personalInfo,
        submitter: userMap.get(submission.user_id) || null,
        reviewer: submission.reviewed_by ? userMap.get(submission.reviewed_by) : null,
        documents: documents || [],
        history: history || [],
        notes: notes || [],
        requirements: submission.requirements || [],
        checkedRequirements: submission.checked_requirements || [],
        // Add employee data for debugging
        _employeeData: employeeData,
        _debug: {
          nipFromSubmission,
          foundEmployeeData: !!employeeData,
          profileData: userProfile
        }
      };

      console.log('Complete submission data with employee info:', result);
      return { data: result, error: null };
    }, `getSubmissionById: ${id}`);
  }

  /**
   * Create new submission
   */
  async createSubmission(submissionData, userId) {
    // Validate submission data
    const validation = validateSubmissionForm(submissionData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${Object.values(validation.errors).join(', ')}`);
    }

    return withErrorHandling(async () => {
      const submission = {
        title: submissionData.title,
        description: submissionData.description || submissionData.notes,
        submission_type: submissionData.submissionType,
        status: SUBMISSION_STATUS.PENDING,
        user_id: userId,
        unit_kerja: submissionData.personalInfo?.unit || null,
        personal_info: submissionData.personalInfo || {},
        requirements_data: submissionData.requirements || {},
        notes: submissionData.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const result = await supabase
        .from('submissions')
        .insert([submission])
        .select('*')
        .single();

      // Manually fetch submitter profile
      if (result.data && result.data.user_id) {
        const { data: submitter } = await supabase
          .from('profiles')
          .select('id, full_name, email, unit_kerja')
          .eq('id', result.data.user_id)
          .single();

        if (submitter) {
          result.data.submitter = submitter;
        }
      }

      apiLogger.info('New submission created', {
        submissionId: result.data?.id,
        userId,
        title: submission.title
      });

      // Send notifications
      if (result.data) {
        try {
          // Get admin users to notify
          const { data: adminUsers } = await supabase
            .from('profiles')
            .select('id')
            .in('role', ['admin-master', 'admin-unit']);

          const adminIds = adminUsers ? adminUsers.map(admin => admin.id) : [];

          // Send notifications about new submission
          await notifyNewSubmission(result.data, userId, adminIds);

          apiLogger.info('Submission notifications sent', {
            submissionId: result.data.id,
            adminCount: adminIds.length
          });
        } catch (notificationError) {
          apiLogger.error('Error sending submission notifications', notificationError);
          // Don't fail the submission creation if notifications fail
        }
      }

      return result;
    }, 'createSubmission');
  }

  /**
   * Update submission
   */
  async updateSubmission(id, updateData, userId) {
    return withErrorHandling(async () => {
      // Extract previousStatus before spreading updateData to avoid including it in the database update
      const { previousStatus, ...updateDataWithoutStatus } = updateData;
      
      const updates = {
        ...updateDataWithoutStatus,
        updated_at: new Date().toISOString(),
        ...(updateData.status && { reviewed_by: userId, reviewed_at: new Date().toISOString() })
      };

      const result = await supabase
        .from('submissions')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      // Manually fetch related profiles
      if (result.data) {
        const userIds = [result.data.user_id, result.data.reviewed_by].filter(Boolean);

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email, unit_kerja')
            .in('id', userIds);

          if (profiles) {
            const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
            result.data.submitter = profileMap[result.data.user_id] || null;
            result.data.reviewer = profileMap[result.data.reviewed_by] || null;
          }
        }
      }

      apiLogger.info('Submission updated', {
        submissionId: id,
        userId,
        updates: Object.keys(updateData)
      });

      // Send notifications for status changes
      if (result.data && updateData.status) {
        try {
          // Get the previous status if available
          const previousStatus = updateData.previousStatus;

          // Send status update notification
          await notifySubmissionStatusUpdate(result.data, userId, previousStatus);

          // Send verification result notification
          await notifyVerificationResult(result.data, updateData.status, updateData.review_notes);

          apiLogger.info('Status change notifications sent', {
            submissionId: id,
            newStatus: updateData.status,
            previousStatus
          });
        } catch (notificationError) {
          apiLogger.error('Error sending status change notifications', notificationError);
          // Don't fail the update if notifications fail
        }
      }

      return result;
    }, `updateSubmission: ${id}`);
  }

  /**
   * Delete submission
   */
  async deleteSubmission(id, userId) {
    return withErrorHandling(async () => {
      // First delete related documents
      await supabase
        .from('submission_documents')
        .delete()
        .eq('submission_id', id);

      // Then delete the submission
      const result = await supabase
        .from('submissions')
        .delete()
        .eq('id', id)
        .select()
        .single();

      apiLogger.info('Submission deleted', {
        submissionId: id,
        userId
      });

      return result;
    }, `deleteSubmission: ${id}`);
  }

  /**
   * Get submission statistics
   */
  async getSubmissionStats(filters = {}) {
    return withErrorHandling(async () => {
      let query = supabase
        .from('submissions')
        .select('status, created_at');

      // Apply filters
      if (filters.submittedBy) {
        query = query.eq('user_id', filters.submittedBy);
      }
      
      if (filters.unitKerja) {
        query = query.eq('unit_kerja', filters.unitKerja);
      }
      
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const result = await query;
      
      if (result.error) throw result.error;

      const submissions = result.data || [];
      
      // Calculate statistics
      const stats = {
        total: submissions.length,
        pending: submissions.filter(s => s.status === SUBMISSION_STATUS.PENDING).length,
        approved: submissions.filter(s => s.status === SUBMISSION_STATUS.APPROVED).length,
        rejected: submissions.filter(s => s.status === SUBMISSION_STATUS.REJECTED).length,
        revision: submissions.filter(s => s.status === SUBMISSION_STATUS.REVISION).length,
        thisMonth: submissions.filter(s => {
          const submissionDate = new Date(s.created_at);
          const now = new Date();
          return submissionDate.getMonth() === now.getMonth() && 
                 submissionDate.getFullYear() === now.getFullYear();
        }).length,
        thisWeek: submissions.filter(s => {
          const submissionDate = new Date(s.created_at);
          const now = new Date();
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return submissionDate >= weekAgo;
        }).length
      };

      return { data: stats, error: null };
    }, 'getSubmissionStats');
  }

  /**
   * Approve submission
   */
  async approveSubmission(id, userId, notes = '', previousStatus = null) {
    return this.updateSubmission(id, {
      status: SUBMISSION_STATUS.APPROVED,
      review_notes: notes,
      previousStatus
    }, userId);
  }

  /**
   * Reject submission
   */
  async rejectSubmission(id, userId, notes = '', previousStatus = null) {
    return this.updateSubmission(id, {
      status: SUBMISSION_STATUS.REJECTED,
      review_notes: notes,
      previousStatus
    }, userId);
  }

  /**
   * Request revision for submission
   */
  async requestRevision(id, userId, notes = '', previousStatus = null) {
    return this.updateSubmission(id, {
      status: SUBMISSION_STATUS.REVISION,
      review_notes: notes,
      previousStatus
    }, userId);
  }

  /**
   * Get submissions by status for analytics
   */
  async getSubmissionsByStatus(filters = {}) {
    return withErrorHandling(async () => {
      let query = supabase
        .from('submissions')
        .select('status, created_at, unit_kerja')
        .order('created_at', { ascending: false });

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      return await query;
    }, 'getSubmissionsByStatus');
  }

  /**
   * Search submissions
   */
  async searchSubmissions(searchTerm, filters = {}) {
    return withErrorHandling(async () => {
      let query = supabase
        .from('submissions')
        .select('*')
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const result = await query;

      // Manually fetch submitter profiles
      if (result.data && result.data.length > 0) {
        const userIds = [...new Set(result.data.map(s => s.user_id).filter(Boolean))];

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email, unit_kerja')
            .in('id', userIds);

          if (profiles) {
            const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));

            result.data = result.data.map(submission => ({
              ...submission,
              submitter: profileMap[submission.user_id] || null
            }));
          }
        }
      }

      return result;
    }, `searchSubmissions: ${searchTerm}`);
  }
}

// Create and export service instance
export const submissionService = new SubmissionService();
export default submissionService;
