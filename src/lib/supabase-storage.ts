import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Note: SUPABASE_SERVICE_ROLE_KEY is only available on server-side (API routes)
// This is expected behavior - client-side code won't have access to it

// Client-side Supabase client (for browser uploads)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (for API routes)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  contentType: string;
}

export interface UploadOptions {
  bucket: string;
  folder?: string;
  fileName?: string;
  upsert?: boolean;
}

export class SupabaseStorageService {
  // Upload file from client-side (browser)
  static async uploadFile(
    file: File, 
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = options.fileName || `${Date.now()}.${fileExt}`
      const filePath = options.folder ? `${options.folder}/${fileName}` : fileName

      console.log('Uploading to Supabase:', { bucket: options.bucket, path: filePath })

      const { data, error } = await supabase.storage
        .from(options.bucket)
        .upload(filePath, file, {
          upsert: options.upsert || false,
          contentType: file.type
        })

      if (error) {
        console.error('Supabase upload error:', error)
        console.error('Upload details:', { bucket: options.bucket, path: filePath, fileType: file.type, fileSize: file.size })
        console.error('Full error object:', JSON.stringify(error, null, 2))
        throw new Error(`Upload failed: ${error.message || 'Unknown error'}`)
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(filePath)

      console.log('Upload successful:', urlData.publicUrl)

      return {
        url: urlData.publicUrl,
        path: filePath,
        size: file.size,
        contentType: file.type
      }
    } catch (error) {
      console.error('Supabase upload error:', error)
      throw error
    }
  }

  // Upload file from server-side (API routes)
  static async uploadFileFromServer(
    buffer: Buffer,
    fileName: string,
    contentType: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized. Check SUPABASE_SERVICE_ROLE_KEY.')
    }

    try {
      const filePath = options.folder ? `${options.folder}/${fileName}` : fileName

      console.log('Server upload to Supabase:', { bucket: options.bucket, path: filePath })

      const { data, error } = await supabaseAdmin.storage
        .from(options.bucket)
        .upload(filePath, buffer, {
          upsert: options.upsert || false,
          contentType
        })

      if (error) {
        console.error('Supabase server upload error:', error)
        throw new Error(`Upload failed: ${error.message}`)
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from(options.bucket)
        .getPublicUrl(filePath)

      console.log('Server upload successful:', urlData.publicUrl)

      return {
        url: urlData.publicUrl,
        path: filePath,
        size: buffer.length,
        contentType
      }
    } catch (error) {
      console.error('Supabase server upload error:', error)
      throw error
    }
  }

  // Delete file
  static async deleteFile(bucket: string, filePath: string): Promise<void> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized. Check SUPABASE_SERVICE_ROLE_KEY.')
    }

    try {
      console.log('Deleting from Supabase:', { bucket, path: filePath })

      const { error } = await supabaseAdmin.storage
        .from(bucket)
        .remove([filePath])

      if (error) {
        console.error('Supabase delete error:', error)
        throw new Error(`Delete failed: ${error.message}`)
      }

      console.log('Delete successful')
    } catch (error) {
      console.error('Supabase delete error:', error)
      throw error
    }
  }

  // Get signed URL for private files
  static async getSignedUrl(
    bucket: string, 
    filePath: string, 
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn)

      if (error) {
        throw new Error(`Signed URL failed: ${error.message}`)
      }

      return data.signedUrl
    } catch (error) {
      console.error('Supabase signed URL error:', error)
      throw error
    }
  }

  // List files in a folder
  static async listFiles(bucket: string, folder?: string): Promise<any[]> {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .list(folder)

      if (error) {
        throw new Error(`List files failed: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Supabase list files error:', error)
      throw error
    }
  }
}

// Storage buckets configuration
export const StorageBuckets = {
  PRODUCTS: 'products',
  DESIGNS: 'designs',
  PROFILES: 'profiles',
  CATEGORIES: 'categories',
  TEMP: 'temp'
} as const
