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
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }

  return true;
};

export const getUnreadCount = async (userId) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }

  return count || 0;
};
