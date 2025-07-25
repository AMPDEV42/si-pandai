/**
 * Data Initializer - DEPRECATED
 * This file has been deprecated in favor of real Supabase data.
 *
 * All functions now return empty data to prevent conflicts
 * with the new real data implementation.
 */

export const initializeSampleData = () => {
  console.warn('initializeSampleData is deprecated. Using real Supabase data instead.');
  return [];
};

export const getSampleSubmissions = () => {
  console.warn('getSampleSubmissions is deprecated. Using real Supabase data instead.');
  return [];
};

export const clearAllData = () => {
  // Clean up any remaining localStorage data
  localStorage.removeItem('sipandai_submissions');
  localStorage.removeItem('sipandai_user_preferences');
  console.log('Mock data storage cleared');
};
