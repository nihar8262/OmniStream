import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

export interface PdfImageEntry {
  url: string;
  filename?: string;
}

async function fetchImageBuffer(url: string, timeoutMs = 12000, retry = 1): Promise<Buffer> {
  let lastError: Error | null = null;
  const isLinkedIn = url.includes("licdn.com") || url.includes("linkedin.com");
  const urlsToTry = isLinkedIn
    ? [url]
    : [`https://wsrv.nl/?url=${encodeURIComponent(url)}&output=jpg`, url];

  for (const targetUrl of urlsToTry) {
    for (let attempt = 0; attempt <= retry; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(targetUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            Referer: isLinkedIn ? "https://www.linkedin.com/" : "https://www.instagram.com/",
            Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          },
        });
        clearTimeout(timer);
        if (res.ok) {
          const arrayBuf = await res.arrayBuffer();
          return Buffer.from(arrayBuf);
        }
      } catch (err: unknown) {
        clearTimeout(timer);
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < retry) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    }
  }
  throw lastError || new Error("Failed to fetch image for PDF");
}

/**
 * Normalizes an image to high-quality JPEG and extracts width/height using sharp.
 */
async function processImage(inputBuffer: Buffer): Promise<{
  jpegBuffer: Buffer;
  width: number;
  height: number;
}> {
  const image = sharp(inputBuffer);
  const metadata = await image.metadata();

  const width = metadata.width || 1080;
  const height = metadata.height || 1080;

  // Convert to standard baseline JPEG for maximum pdf-lib compatibility
  const jpegBuffer = await image
    .rotate() // auto-orient based on EXIF
    .jpeg({ quality: 90 })
    .toBuffer();

  return { jpegBuffer, width, height };
}

/**
 * Converts a list of image URLs into a single multi-page PDF document.
 */
export async function createPdfFromImages(items: PdfImageEntry[]): Promise<Uint8Array> {
  if (items.length === 0) {
    throw new Error("No images provided for PDF generation");
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle("Instagram Media Export");
  pdfDoc.setCreator("Instagram Media Downloader");

  let addedPages = 0;

  for (let i = 0; i < items.length; i++) {
    try {
      const rawBuffer = await fetchImageBuffer(items[i].url);
      const { jpegBuffer, width, height } = await processImage(rawBuffer);

      const embeddedImage = await pdfDoc.embedJpg(jpegBuffer);

      // Define standard page bounds (max 1200 x 1200 or image dimensions with 72 dpi scaling)
      // Scale large dimensions down so PDF isn't excessively huge in physical print dimensions
      const maxDim = 842; // A4 height points
      const scale = Math.min(1, maxDim / Math.max(width, height));
      const pageWidth = width * scale;
      const pageHeight = height * scale;

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
      });

      addedPages++;
    } catch (err) {
      console.error(`Error processing image ${i + 1} for PDF:`, err);
    }
  }

  if (addedPages === 0) {
    throw new Error("Could not process any images for PDF generation");
  }

  return await pdfDoc.save();
}
