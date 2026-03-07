// Supabase client pour le frontend
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://zytruafngsrlvrfvzxnv.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dHJ1YWZuZ3NybHZyZnZ6eG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NjY0MjAsImV4cCI6MjA4ODA0MjQyMH0.NqmB55z9U17k7zsPGUwVy5nguekvdkPbjHzQhYeSdas';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// ── Cache for styles (avoids redundant calls from multiple components) ──
let _stylesCache = null;
let _stylesCacheTime = 0;
const STYLES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ── Helper: Fetch all styles from Supabase (with cache) ──
export async function fetchStylesFromSupabase(forceRefresh = false) {
  const now = Date.now();

  // Return cached data if still valid
  if (!forceRefresh && _stylesCache && (now - _stylesCacheTime) < STYLES_CACHE_TTL) {
    return _stylesCache;
  }

  const { data, error } = await supabase
    .from('styles')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching styles from Supabase:', error);
    throw error;
  }

  // Derive unique regions and families
  const regions = [...new Set(data.map(s => s.region))].filter(Boolean);
  const families = [...new Set(data.map(s => s.family))].filter(Boolean);

  _stylesCache = { styles: data, regions, families };
  _stylesCacheTime = now;

  return _stylesCache;
}

// Invalidate styles cache (call after adding/editing a style)
export function invalidateStylesCache() {
  _stylesCache = null;
  _stylesCacheTime = 0;
}

// ── Helper: Fetch gallery entries for the current user ──
export async function fetchGalleryFromSupabase() {
  const { data, error } = await supabase
    .from('gallery')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching gallery from Supabase:', error);
    throw error;
  }

  // Map snake_case DB columns to camelCase used by the frontend
  return data.map(entry => ({
    id: entry.id,
    originalImage: entry.original_image_url,
    generatedImage: entry.generated_image_url,
    styleName: entry.style_name,
    styleFamily: entry.style_family,
    styleId: entry.style_id,
    prompt: entry.prompt,
    customPrompt: entry.custom_prompt,
    mode: entry.mode,
    isFavorite: entry.is_favorite,
    worldUrl: entry.world_url,
    worldOperationId: entry.world_operation_id,
    createdAt: entry.created_at,
    userId: entry.user_id,
  }));
}

// ── Helper: Toggle favorite in Supabase ──
export async function toggleFavoriteInSupabase(id, currentValue) {
  const { data, error } = await supabase
    .from('gallery')
    .update({ is_favorite: !currentValue })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }

  return { isFavorite: data.is_favorite };
}

// ── Helper: Delete gallery entry in Supabase ──
export async function deleteGalleryEntryInSupabase(id) {
  const { error } = await supabase
    .from('gallery')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting gallery entry:', error);
    throw error;
  }
}

// ── Helper: Fetch landing assets from Supabase ──
export async function fetchLandingAssetsFromSupabase() {
  const { data, error } = await supabase
    .from('landing_assets')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching landing assets:', error);
    throw error;
  }
  return data;
}

// ── Helper: Fetch testimonials from Supabase ──
export async function fetchTestimonials() {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching testimonials:', error);
    throw error;
  }
  return data;
}

// ── Helper: Fetch Room Types from Supabase ──
export async function fetchRoomTypes() {
  const { data, error } = await supabase
    .from('room_types')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching room types:', error);
    throw error;
  }
  return data;
}

// ── Helper: Fetch Color Palettes from Supabase ──
export async function fetchColorPalettes() {
  const { data, error } = await supabase
    .from('color_palettes')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching color palettes:', error);
    throw error;
  }
  return data;
}


