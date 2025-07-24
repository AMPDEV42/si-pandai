import { supabase } from '@/lib/customSupabaseClient';
import { sendNewSubmissionEmail } from './emailService';

export const sendNotification = async ({ userId, title, message, type = 'info', link = null, email = null, submission = null }) => {
  // Simpan notifikasi ke database
  const { data, error } = await supabase
    .from('notifications')
    .insert([
      {
        user_id: userId,
        title,
        message,
        type,
        link,
        is_read: false,
      }
    ])
    .select();

  if (error) {
    console.error('Error sending notification:', error);
    return null;
  }

  // Jika email disediakan dan submission ada, kirim email notifikasi
  if (email && submission && type === 'info' && title.includes('Pengajuan Baru')) {
    try {
      await sendNewSubmissionEmail(email, submission, submission.submitterName || 'Pengguna');
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
    }
  }

  return data?.[0];
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
