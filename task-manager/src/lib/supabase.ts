import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// These values should be set in your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wyoecmrssezabnemvoir.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage bucket name for contract documents
export const CONTRACTS_BUCKET = 'contratos';

/**
 * Upload a file to Supabase Storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name
 * @param folder - Optional folder path within the bucket
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(
  file: File,
  bucket: string = CONTRACTS_BUCKET,
  folder: string = ''
): Promise<string> {
  // Generate a unique filename with timestamp
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder ? folder + '/' : ''}${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading file:', error);
    throw new Error(`Error al subir el archivo: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Delete a file from Supabase Storage
 * @param fileUrl - The public URL of the file to delete
 * @param bucket - The storage bucket name
 */
export async function deleteFile(
  fileUrl: string,
  bucket: string = CONTRACTS_BUCKET
): Promise<void> {
  // Extract file path from URL
  const urlParts = fileUrl.split(`/storage/v1/object/public/${bucket}/`);
  if (urlParts.length < 2) {
    throw new Error('Invalid file URL');
  }

  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    console.error('Error deleting file:', error);
    throw new Error(`Error al eliminar el archivo: ${error.message}`);
  }
}
