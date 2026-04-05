import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      services (
        name,
        is_popular,
        category_id,
        service_categories (
          name
        )
      )
    `)
    .eq('is_active', true);
  console.log("DATA:", data);
  console.log("ERROR:", error);
}
run();
