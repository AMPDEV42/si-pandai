import { supabase } from '../lib/customSupabaseClient';

export const getPegawai = async () => {
  const { data, error } = await supabase
    .from('pegawai')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getPegawaiById = async (id) => {
  const { data, error } = await supabase
    .from('pegawai')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createPegawai = async (pegawaiData) => {
  const { data, error } = await supabase
    .from('pegawai')
    .insert([{
      ...pegawaiData,
      tanggal_lahir: new Date(pegawaiData.tanggalLahir).toISOString(),
      tmt: new Date(pegawaiData.tmt).toISOString(),
      masa_kerja: hitungMasaKerja(pegawaiData.tmt)
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updatePegawai = async (id, pegawaiData) => {
  const { data, error } = await supabase
    .from('pegawai')
    .update({
      ...pegawaiData,
      tanggal_lahir: new Date(pegawaiData.tanggalLahir).toISOString(),
      tmt: new Date(pegawaiData.tmt).toISOString(),
      masa_kerja: hitungMasaKerja(pegawaiData.tmt),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deletePegawai = async (id) => {
  const { error } = await supabase
    .from('pegawai')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

// Fungsi untuk menghitung masa kerja
const hitungMasaKerja = (tmt) => {
  const tmtDate = new Date(tmt);
  const today = new Date();
  
  let years = today.getFullYear() - tmtDate.getFullYear();
  let months = today.getMonth() - tmtDate.getMonth();
  
  if (months < 0 || (months === 0 && today.getDate() < tmtDate.getDate())) {
    years--;
    months += 12;
  }
  
  return { tahun: years, bulan: months };
};
