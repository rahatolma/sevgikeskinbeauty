import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client (Provide dummy valid URL if not configured to prevent instant app crash)
const safeUrl = (supabaseUrl.startsWith('http') && !supabaseUrl.includes('your_supabase')) 
  ? supabaseUrl 
  : 'https://placeholder-project.supabase.co';
const safeKey = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(safeUrl, safeKey);
