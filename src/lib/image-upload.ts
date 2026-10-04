"use client";

/**
 * Vercel Functions reject request bodies larger than 4.5 MB before a route
 * handler runs. Leave headroom for multipart boundaries and form fields: each
 * file sent through an app route must be smaller than this limit.
 */
export const MAX_FUNCTION_UPLOAD_BYTES = 3_500_000;

const COMPRESSIBLE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const WEBP_QUALITIES = [0.86, 0.78, 0.7, 0.62, 0.54];

function canvasToWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("This browser could not prepare the image."))),
      "image/webp",
      quality,
    );
  });
}

/**
 * Keep browser uploads below the Vercel Function payload ceiling while still
 * storing them in Postgres. Small files are preserved as-is. Oversized raster
 * images are progressively resized and converted to WebP in the browser, so
 * the original never has to pass through a serverless request.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  if (file.size <= MAX_FUNCTION_UPLOAD_BYTES) return file;

  if (!COMPRESSIBLE_TYPES.has(file.type)) {
    throw new Error(
      `This file is too large for a Vercel upload (${formatSize(file.size)}). Choose a file under 3.5 MB or use a JPG, PNG, WebP or AVIF image so it can be compressed.`,
    );
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This image could not be opened in the browser. Try saving it as JPG or WebP first.");
  }

  try {
    // A portrait card is 4:5; 1800px on the longest edge is ample for display.
    let scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
    for (let dimensionAttempt = 0; dimensionAttempt < 7; dimensionAttempt += 1) {
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: true });
      if (!context) throw new Error("Your browser could not prepare the image.");
      context.drawImage(bitmap, 0, 0, width, height);

      for (const quality of WEBP_QUALITIES) {
        const output = await canvasToWebp(canvas, quality);
        if (output.size <= MAX_FUNCTION_UPLOAD_BYTES) {
          const name = file.name.replace(/\.[^.]+$/, "") || "image";
          return new File([output], `${name}.webp`, {
            type: "image/webp",
            lastModified: file.lastModified,
          });
        }
      }
      scale *= 0.78;
    }
  } finally {
    bitmap.close();
  }

  throw new Error("This image is still too large after compression. Choose a smaller image.");
}

/** Non-image uploads (for example video) cannot be recompressed here. */
export function assertFunctionUploadSize(file: File): void {
  if (file.size > MAX_FUNCTION_UPLOAD_BYTES) {
    throw new Error(
      `This file is ${formatSize(file.size)}. Vercel app uploads must be under 3.5 MB; larger files need direct object storage.`,
    );
  }
}

function formatSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
