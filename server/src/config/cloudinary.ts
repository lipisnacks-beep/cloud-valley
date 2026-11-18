import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { env, isCloudinaryConfigured } from './env.ts';

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export async function uploadMediaAsset(
  buffer: Buffer,
  originalName: string,
  folder = 'cloud-valley'
): Promise<{ url: string; publicId?: string }> {
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (err, result) => {
          if (err || !result) {
            return reject(err || new Error('Cloudinary upload failed'));
          }
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      stream.end(buffer);
    });
  }

  const ext = path.extname(originalName).toLowerCase() || '.jpg';
  const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
  const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${safeExt}`;
  const targetPath = path.join(uploadsDir, filename);
  await fs.promises.writeFile(targetPath, buffer);
  return { url: `/uploads/${filename}`, publicId: `local:${filename}` };
}

export async function deleteMediaAsset(publicId?: string): Promise<void> {
  if (!publicId) return;

  if (publicId.startsWith('local:')) {
    const filename = publicId.replace('local:', '');
    const targetPath = path.join(uploadsDir, path.basename(filename));
    if (fs.existsSync(targetPath)) {
      await fs.promises.unlink(targetPath).catch(() => undefined);
    }
    return;
  }

  if (isCloudinaryConfigured) {
    await cloudinary.uploader.destroy(publicId).catch(() => undefined);
  }
}
