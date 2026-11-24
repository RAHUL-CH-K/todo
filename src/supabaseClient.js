import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jetztlnszkzstycidmcd.supabase.co';
const supabaseKey = 'sb_publishable_CqlibAuF1s7zuVfkYkwdRg_r4Kb6J2m';

export const supabase = createClient(supabaseUrl, supabaseKey);
