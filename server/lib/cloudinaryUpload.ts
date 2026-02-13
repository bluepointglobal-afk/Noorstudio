// Cloudinary Upload Helper
// Uploads images to Cloudinary for persistent storage

import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs/promises';
import * as path from 'path';

// Configure Cloudinary (will be called from index.ts)
export function configureCloudinary(cloudName: string, apiKey: string, apiSecret: string) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  console.log(`[Cloudinary] Configured with cloud: ${cloudName}`);
}

/**
 * Upload a buffer or file to Cloudinary
 * Returns the permanent Cloudinary URL
 */
export async function uploadToCloudinary(
  data: Buffer | Uint8Array | string,
  options: {
    folder?: string;
    filename?: string;
    format?: string;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
  } = {}
): Promise<string> {
  try {
    const {
      folder = 'noorstudio',
      filename = `image-${Date.now()}`,
      format = 'png',
      resourceType = 'image',
    } = options;

    console.log(`[Cloudinary] Uploading ${filename}.${format} to folder: ${folder}`);

    let uploadResult;

    if (typeof data === 'string') {
      // Upload from file path
      uploadResult = await cloudinary.uploader.upload(data, {
        folder,
        public_id: filename,
        resource_type: resourceType,
        format,
      });
    } else {
      // Upload from buffer/Uint8Array
      // Convert Uint8Array to Buffer if needed
      const buffer = data instanceof Uint8Array ? Buffer.from(data) : data;

      // Convert buffer to base64 data URI
      const base64Data = buffer.toString('base64');
      const dataUri = `data:image/${format};base64,${base64Data}`;

      uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder,
        public_id: filename,
        resource_type: resourceType,
      });
    }

    console.log(`[Cloudinary] Upload successful: ${uploadResult.secure_url}`);
    console.log(`[Cloudinary] Public ID: ${uploadResult.public_id}`);
    console.log(`[Cloudinary] Size: ${uploadResult.bytes} bytes`);

    return uploadResult.secure_url;
  } catch (error) {
    const err = error as Error;
    console.error(`[Cloudinary] Upload failed:`, err.message);
    throw new Error(`Cloudinary upload failed: ${err.message}`);
  }
}

/**
 * Delete an image from Cloudinary by public_id
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    console.log(`[Cloudinary] Deleting: ${publicId}`);
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`[Cloudinary] Delete result:`, result);
  } catch (error) {
    const err = error as Error;
    console.error(`[Cloudinary] Delete failed:`, err.message);
    throw new Error(`Cloudinary delete failed: ${err.message}`);
  }
}

export default { configureCloudinary, uploadToCloudinary, deleteFromCloudinary };
