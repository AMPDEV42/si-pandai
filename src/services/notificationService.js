import { supabase, withErrorHandling } from '../lib/customSupabaseClient';
import { sendNewSubmissionEmail } from './emailService';
import { apiLogger } from '../lib/logger';

export const sendNotification = async ({ userId, title, message, type = 'info', link = null, email = null, submission = null }) => {
  return withErrorHandling(async () => {
    // Simpan notifikasi ke database
    const notification = {
      user_id: userId,
      title,
      message,
      link,
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
    if (email && submission && type === 'info' && title.includes('Pengajuan Baru')) {
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
