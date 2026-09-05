/**
 * High-performance image processing & resizing utility for MINI MART POS.
 * Safely compresses large camera photos (e.g. 12MP-48MP iPhone/Android shots)
 * down to max 800x800 JPEG with 0.82 quality to prevent memory pressure and server lockups.
 */
export async function resizeImageFile(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.82
): Promise<{ dataUrl: string; sizeKb: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided for resizing'));
      return;
    }

    // Safety check for non-image files
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width === 0 || height === 0) {
            reject(new Error('Invalid image dimensions'));
            return;
          }

          // Calculate aspect-ratio-preserving dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          // Render onto clean off-screen Canvas
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext('2d', { willReadFrequently: false });
          if (!ctx) {
            // Fallback to original dataUrl if context fails
            const rawUrl = e.target?.result as string;
            const sizeKb = Math.round((rawUrl.length * 3) / 4 / 1024);
            resolve({ dataUrl: rawUrl, sizeKb, width, height });
            return;
          }

          // Fill clean background (useful for transparent PNGs converted to JPEG)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);

          // High quality bicubic interpolation
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(img, 0, 0, width, height);

          // Output lightweight JPEG
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

          // Clean up canvas
          canvas.width = 0;
          canvas.height = 0;

          resolve({
            dataUrl,
            sizeKb,
            width,
            height,
          });
        } catch (canvasErr: any) {
          console.warn('Canvas processing fallback:', canvasErr);
          const rawUrl = e.target?.result as string;
          const sizeKb = Math.round((rawUrl.length * 3) / 4 / 1024);
          resolve({ dataUrl: rawUrl, sizeKb, width: 400, height: 400 });
        }
      };

      img.onerror = () => {
        reject(new Error('Image format could not be decoded. Please try another image.'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read image file from disk'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes to readable string (e.g. "120 KB", "1.5 MB")
 */
export function formatImageSize(kb: number): string {
  if (kb < 1024) {
    return `${kb} KB`;
  }
  return `${(kb / 1024).toFixed(1)} MB`;
}
