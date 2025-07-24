import { supabase } from './customSupabaseClient';

// Fungsi untuk mendapatkan data dari tabel
export const fetchData = async (tableName) => {
  const { data, error } = await supabase
    .from(tableName)
    .select('*');
  
  if (error) throw error;
  return data;
};

// Fungsi untuk menambahkan data baru
export const addData = async (tableName, newData) => {
  const { data, error } = await supabase
    .from(tableName)
    .insert([newData])
    .select();
    
  if (error) throw error;
  return data[0];
};

// Fungsi untuk memperbarui data
export const updateData = async (tableName, id, updatedData) => {
  const { data, error } = await supabase
    .from(tableName)
    .update(updatedData)
    .eq('id', id)
    .select();
    
  if (error) throw error;
  return data[0];
};

// Fungsi untuk menghapus data
export const deleteData = async (tableName, id) => {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  return true;
};

// Fungsi untuk mendaftar pengguna baru
export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

// Fungsi untuk login
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

// Fungsi untuk logout
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Fungsi untuk mendapatkan data pengguna yang sedang login
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};
