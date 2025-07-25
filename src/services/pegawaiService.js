import { supabase } from '../lib/customSupabaseClient';

// Helper function to convert snake_case to camelCase
const toCamel = (s) => {
  return s.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
};

// Helper function to convert camelCase to snake_case
const toSnake = (s) => {
  return s.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

export const getPegawai = async () => {
  const { data, error } = await supabase
    .from('pegawai')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Convert snake_case to camelCase for frontend and calculate masa kerja
  return data.map(item => {
    const newItem = {};
    Object.keys(item).forEach(key => {
      newItem[toCamel(key)] = item[key];
    });

    // Calculate masa kerja if not present or if TMT is available
    if (item.tmt && (!item.masa_kerja || !newItem.masaKerja)) {
      newItem.masaKerja = hitungMasaKerja(item.tmt);
    }

    return newItem;
  }) || [];
};

export const getPegawaiById = async (id) => {
  const { data, error } = await supabase
    .from('pegawai')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  
  // Convert snake_case to camelCase for frontend
  const result = {};
  Object.keys(data).forEach(key => {
    result[toCamel(key)] = data[key];
  });
  return result;
};

export const createPegawai = async (pegawaiData) => {
  // Convert camelCase to snake_case for database
  const dbData = {};
  Object.keys(pegawaiData).forEach(key => {
    dbData[toSnake(key)] = pegawaiData[key];
  });

  const { data, error } = await supabase
    .from('pegawai')
    .insert([{
      ...dbData,
      tanggal_lahir: new Date(pegawaiData.tanggalLahir).toISOString(),
      tmt: new Date(pegawaiData.tmt).toISOString(),
      masa_kerja: hitungMasaKerja(pegawaiData.tmt)
    }])
    .select()
    .single();

  if (error) throw error;
  
  // Convert snake_case to camelCase for frontend
  const result = {};
  Object.keys(data).forEach(key => {
    result[toCamel(key)] = data[key];
  });
  return result;
};

export const updatePegawai = async (id, pegawaiData) => {
  // Convert camelCase to snake_case for database
  const dbData = {};
  Object.keys(pegawaiData).forEach(key => {
    if (key !== 'id') { // Don't include the id in the update
      dbData[toSnake(key)] = pegawaiData[key];
    }
  });

  const { data, error } = await supabase
    .from('pegawai')
    .update({
      ...dbData,
      tanggal_lahir: new Date(pegawaiData.tanggalLahir).toISOString(),
      tmt: new Date(pegawaiData.tmt).toISOString(),
      masa_kerja: hitungMasaKerja(pegawaiData.tmt),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  
  // Convert snake_case to camelCase for frontend
  const result = {};
  Object.keys(data).forEach(key => {
    result[toCamel(key)] = data[key];
  });
  return result;
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
  if (!tmt) return { tahun: 0, bulan: 0 };

  const tmtDate = new Date(tmt);
  const today = new Date();

  // Validate dates
  if (isNaN(tmtDate.getTime()) || tmtDate > today) {
    return { tahun: 0, bulan: 0 };
  }

  let years = today.getFullYear() - tmtDate.getFullYear();
  let months = today.getMonth() - tmtDate.getMonth();

  if (months < 0 || (months === 0 && today.getDate() < tmtDate.getDate())) {
    years--;
    months += 12;
  }

  // Handle negative months
  if (months < 0) {
    months = 0;
  }

  return { tahun: Math.max(0, years), bulan: Math.max(0, months) };
};
