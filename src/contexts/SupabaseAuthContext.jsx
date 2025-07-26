import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/customSupabaseClient';
import { useToast } from '../components/ui/use-toast';
import { sendNotification } from '../services/notificationService';
import { authLogger } from '../lib/logger';
import { validateEmail, validatePassword, validateUserRegistration } from '../lib/validation';
import { getErrorMessage, getRecoverySuggestion, categorizeError, ERROR_TYPES } from '../constants/errorTypes';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    
    if (session?.user) {
      // Fetch the full user profile to get the role
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        authLogger.error('Error fetching user profile', error);
        // Don't throw error, just log it and continue with basic user data
      }

      // Combine user data with profile data
      setUser({
        ...session.user,
        name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email,
        role: profile?.role || session.user.user_metadata?.role,
        unitKerja: profile?.unit_kerja || session.user.user_metadata?.unit_kerja
      });
    } else {
      setUser(null);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleSession(session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signUp = useCallback(async (email, password, userData = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      // Pastikan role valid
      const userRole = ['admin-master', 'admin-unit', 'user'].includes(userData.role) 
        ? userData.role 
        : 'user';

      // Sign up pengguna
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.fullName || '',
            role: userRole
          }
        }
      });

      if (signUpError) throw signUpError;

      // Insert data ke profiles
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            full_name: userData.fullName || '',
            email: email,
            role: userRole,
            unit_kerja: userData.unitKerja || null
            // created_at dan updated_at akan diisi otomatis oleh database
          }]);

        if (profileError) {
          console.error('Error inserting profile:', profileError);
          throw new Error('Gagal menyimpan data profil');
        }
      }

      toast({
        title: 'Pendaftaran Berhasil',
        description: 'Silakan periksa email Anda untuk verifikasi',
      });
      
      return authData;
    } catch (error) {
      setError(error.message);
      toast({
        variant: 'destructive',
        title: 'Gagal Mendaftar',
        description: error.message,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signIn = useCallback(async (email, password, onSuccess) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Kirim notifikasi login berhasil (with error handling)
      if (data?.user) {
        try {
          await sendNotification({
            userId: data.user.id,
            title: 'Login Berhasil',
            message: 'Anda berhasil masuk ke sistem SIPANDAI'
          });
        } catch (notifError) {
          authLogger.error('Error sending login notification', notifError);
          // Don't block login flow if notification fails
        }
      }

      toast({
        title: 'Login Berhasil',
        description: 'Anda berhasil masuk ke akun Anda',
      });

      // Call the onSuccess callback with user data
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess(data);
      }

      return data;
    } catch (error) {
      authLogger.error('Login error', error);
      setError(error.message);
      toast({
        variant: 'destructive',
        title: 'Login Gagal',
        description: error.message || 'Terjadi kesalahan saat login',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      
      // Redirect ke halaman login
      window.location.href = '/login';
      
      toast({
        title: 'Logout Berhasil',
        description: 'Anda telah berhasil logout',
      });
    } catch (error) {
      authLogger.error('Logout error', error);
      toast({
        variant: 'destructive',
        title: 'Gagal Logout',
        description: error.message || 'Terjadi kesalahan saat logout',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fungsi untuk reset password
  const resetPassword = useCallback(async (email) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      
      toast({
        title: 'Email reset password telah dikirim',
        description: 'Silakan periksa email Anda untuk langkah selanjutnya',
      });
      
      return true;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal mengirim email reset password',
        description: error.message || 'Terjadi kesalahan',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const value = {
    signUp,
    signIn,
    signOut,
    resetPassword,
    user,
    session,
    loading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
