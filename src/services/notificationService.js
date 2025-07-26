import { supabase, withErrorHandling } from '../lib/customSupabaseClient';
import { sendNewSubmissionEmail } from './emailService';
import { apiLogger } from '../lib/logger';

export const sendNotification = async ({ userId, title, message, type = 'info', link = null, email = null, submission = null, metadata = null }) => {
  return withErrorHandling(async () => {
    // Simpan notifikasi ke database
    const notification = {
      user_id: userId,
      title,
      message,
      type,
      link,
      metadata: metadata ? JSON.stringify(metadata) : null,
      is_read: false,
    };

    const result = await supabase
      .from('notifications')
      .insert([notification])
      .select()
      .single();

    if (result.error) {
      throw result.error;
    }

    apiLogger.info('Notification sent', {
      userId,
      title,
      type
    });

    // Jika email disediakan dan submission ada, kirim email notifikasi
    if (email && submission && type === 'submission' && title.includes('Pengajuan Baru')) {
      try {
        await sendNewSubmissionEmail(email, submission, submission.submitterName || 'Pengguna');
        apiLogger.info('Email notification sent', { userId, email });
      } catch (emailError) {
        apiLogger.error('Error sending email notification', emailError);
      }
    }

    return result.data;
  }, 'sendNotification');
};

// Specific notification functions for submissions
export const notifyNewSubmission = async (submission, submitterId, adminIds = []) => {
  const promises = [];

  // Notify submitter
  promises.push(
    sendNotification({
      userId: submitterId,
      title: 'Pengajuan Berhasil Dibuat',
      message: `Pengajuan "${submission.title}" berhasil dibuat dan sedang menunggu verifikasi.`,
      type: 'submission',
      link: `/pengajuan/${submission.id}`,
      metadata: {
        submissionId: submission.id,
        submissionType: submission.submission_type,
        status: submission.status
      }
    })
  );

  // Notify admins
  adminIds.forEach(adminId => {
    promises.push(
      sendNotification({
        userId: adminId,
        title: 'Pengajuan Baru Menunggu Verifikasi',
        message: `Pengajuan baru "${submission.title}" telah dibuat dan membutuhkan verifikasi Anda.`,
        type: 'submission',
        link: `/pengajuan/${submission.id}`,
        metadata: {
          submissionId: submission.id,
          submissionType: submission.submission_type,
          status: submission.status,
          submitterId: submitterId
        }
      })
    );
  });

  return Promise.all(promises);
};

export const notifySubmissionStatusUpdate = async (submission, updatedBy, previousStatus) => {
  const statusMessages = {
    approved: 'disetujui',
    rejected: 'ditolak',
    revision: 'dikembalikan untuk revisi'
  };

  const statusMessage = statusMessages[submission.status] || 'diperbarui';

  return sendNotification({
    userId: submission.user_id,
    title: `Pengajuan ${statusMessage.charAt(0).toUpperCase() + statusMessage.slice(1)}`,
    message: `Pengajuan "${submission.title}" telah ${statusMessage}.`,
    type: 'submission_update',
    link: `/pengajuan/${submission.id}`,
    metadata: {
      submissionId: submission.id,
      previousStatus,
      newStatus: submission.status,
      updatedBy,
      hasNotes: !!submission.review_notes
    }
  });
};

export const notifyDataUpdate = async (userId, dataType, itemName, action = 'updated') => {
  const actionText = {
    created: 'dibuat',
    updated: 'diperbarui',
    deleted: 'dihapus'
  };

  return sendNotification({
    userId,
    title: `Data ${dataType} ${actionText[action] || 'diperbarui'}`,
    message: `Data ${dataType} "${itemName}" telah ${actionText[action] || 'diperbarui'}.`,
    type: 'data_update',
    metadata: {
      dataType,
      itemName,
      action
    }
  });
};

export const notifyVerificationResult = async (submission, result, reviewNotes) => {
  const resultMessages = {
    approved: {
      title: 'Pengajuan Disetujui',
      message: `Selamat! Pengajuan "${submission.title}" telah disetujui.`
    },
    rejected: {
      title: 'Pengajuan Ditolak',
      message: `Pengajuan "${submission.title}" ditolak. Silakan periksa catatan reviewer.`
    },
    revision: {
      title: 'Pengajuan Perlu Revisi',
      message: `Pengajuan "${submission.title}" perlu diperbaiki. Silakan periksa catatan dan lakukan revisi.`
    }
  };

  const notification = resultMessages[result];
  if (!notification) return;

  return sendNotification({
    userId: submission.user_id,
    title: notification.title,
    message: notification.message,
    type: 'verification_result',
    link: `/pengajuan/${submission.id}`,
    metadata: {
      submissionId: submission.id,
      result,
      hasReviewNotes: !!reviewNotes,
      reviewedAt: new Date().toISOString()
    }
  });
};

export const markNotificationAsRead = async (notificationId) => {
  return withErrorHandling(async () => {
    const result = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (result.error) {
      throw result.error;
    }

    apiLogger.debug('Notification marked as read', { notificationId });
    return result.data;
  }, 'markNotificationAsRead');
};

export const getUnreadCount = async (userId) => {
  return withErrorHandling(async () => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      throw error;
    }

    return count || 0;
  }, 'getUnreadCount');
};

// Get notifications for a user
export const getNotifications = async (userId, options = {}) => {
  return withErrorHandling(async () => {
    const { limit = 50, offset = 0, unreadOnly = false } = options;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    return await query;
  }, 'getNotifications');
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId) => {
  return withErrorHandling(async () => {
    const result = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (result.error) {
      throw result.error;
    }

    apiLogger.info('All notifications marked as read', { userId });
    return result.data;
  }, 'markAllNotificationsAsRead');
};
