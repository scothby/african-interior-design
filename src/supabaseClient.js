// Supabase client pour le frontend
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://zytruafngsrlvrfvzxnv.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHJ1YWZuZ3NybHZyZnZ6eG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NjY0MjAsImV4cCI6MjA4ODA0MjQyMH0.NqmB55z9U17k7zsPGUwVy5nguekvdkPbjHzQhYeSdas';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
