/**
 * Real Submission Data Service
 * Handles all submission-related database operations
 */

import { supabase, withErrorHandling, supabaseHelpers } from '../lib/customSupabaseClient';
import { apiLogger } from '../lib/logger';
import { validateSubmissionForm } from '../lib/validation';
import { SUBMISSION_STATUS } from '../constants';

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
        query = query.eq('submitted_by', filters.submittedBy);
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
          ...result.data.map(s => s.submitted_by).filter(Boolean),
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
              submitter: profileMap[submission.submitted_by] || null,
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
      const result = await supabase
        .from('submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (result.data) {
        // Manually fetch related data
        const userIds = [result.data.submitted_by, result.data.reviewed_by].filter(Boolean);

        const [profilesResult, documentsResult] = await Promise.all([
          userIds.length > 0 ? supabase
            .from('profiles')
            .select('id, full_name, email, unit_kerja, role')
            .in('id', userIds) : { data: [] },
          supabase
            .from('submission_documents')
            .select('id, file_name, file_size, file_type, file_url, uploaded_at')
            .eq('submission_id', id)
        ]);

        const profileMap = Object.fromEntries((profilesResult.data || []).map(p => [p.id, p]));

        result.data = {
          ...result.data,
          submitter: profileMap[result.data.submitted_by] || null,
          reviewer: profileMap[result.data.reviewed_by] || null,
          documents: documentsResult.data || []
        };
      }

      return result;
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
        submitted_by: userId,
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
        .select(`
          *,
          submitter:profiles!submitted_by(
            id,
            full_name,
            email,
            unit_kerja
          )
        `)
        .single();

      apiLogger.info('New submission created', {
        submissionId: result.data?.id,
        userId,
        title: submission.title
      });

      return result;
    }, 'createSubmission');
  }

  /**
   * Update submission
   */
  async updateSubmission(id, updateData, userId) {
    return withErrorHandling(async () => {
      const updates = {
        ...updateData,
        updated_at: new Date().toISOString(),
        ...(updateData.status && { reviewed_by: userId, reviewed_at: new Date().toISOString() })
      };

      const result = await supabase
        .from('submissions')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          submitter:profiles!submitted_by(
            id,
            full_name,
            email,
            unit_kerja
          ),
          reviewer:profiles!reviewed_by(
            id,
            full_name,
            email
          )
        `)
        .single();

      apiLogger.info('Submission updated', {
        submissionId: id,
        userId,
        updates: Object.keys(updateData)
      });

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
        query = query.eq('submitted_by', filters.submittedBy);
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
  async approveSubmission(id, userId, notes = '') {
    return this.updateSubmission(id, {
      status: SUBMISSION_STATUS.APPROVED,
      review_notes: notes
    }, userId);
  }

  /**
   * Reject submission
   */
  async rejectSubmission(id, userId, notes = '') {
    return this.updateSubmission(id, {
      status: SUBMISSION_STATUS.REJECTED,
      review_notes: notes
    }, userId);
  }

  /**
   * Request revision for submission
   */
  async requestRevision(id, userId, notes = '') {
    return this.updateSubmission(id, {
      status: SUBMISSION_STATUS.REVISION,
      review_notes: notes
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
        .select(`
          *,
          submitter:profiles!submitted_by(
            full_name,
            email,
            unit_kerja
          )
        `)
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      return await query;
    }, `searchSubmissions: ${searchTerm}`);
  }
}

// Create and export service instance
export const submissionService = new SubmissionService();
export default submissionService;
