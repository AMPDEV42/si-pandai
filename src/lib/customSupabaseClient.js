import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lttyyqjqclphsgdbjgdt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0dHl5cWpxY2xwaHNnZGJqZ2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMTAyOTksImV4cCI6MjA2ODg4NjI5OX0.ve5_PUzdli7oGzsD8OmkJg-FNMzcnSTivKwKOXgWiU4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);