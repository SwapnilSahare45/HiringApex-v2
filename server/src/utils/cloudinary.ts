import { UploadApiResponse } from 'cloudinary';
import cloudinary from '../config/cloudinary';

interface uploadOptions {
  folder: string;
  publicId?: string;
  resourceType?: 'image' | 'raw' | 'auto';
}

export const uploadToCloudinary = (
  buffer: Buffer,
  options: uploadOptions
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: options.publicId,
        resource_type: options.resourceType || 'auto',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!);
      }
    );
    uploadStream.end(buffer);
  });
};

export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'raw' = 'image'
): Promise<void> => {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};
