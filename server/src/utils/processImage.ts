import sharp from 'sharp';

interface ProcessImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export const processImage = async (
  buffer: Buffer,
  options: ProcessImageOptions = {}
): Promise<Buffer> => {
  const { width, height, quality = 80, fit = 'cover' } = options;

  return sharp(buffer).resize(width, height, { fit }).webp({ quality }).toBuffer();
};
