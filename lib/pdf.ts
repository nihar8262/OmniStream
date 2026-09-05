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

export interface PdfExportOptions {
  pageSize?: "a4" | "letter" | "fit";
  orientation?: "portrait" | "landscape" | "auto";
}

/**
 * Converts a list of image URLs into a single multi-page PDF document with custom page size and orientation.
 */
export async function createPdfFromImages(
  items: PdfImageEntry[],
  options: PdfExportOptions = {}
): Promise<Uint8Array> {
  if (items.length === 0) {
    throw new Error("No images provided for PDF generation");
  }

  const { pageSize = "fit", orientation = "auto" } = options;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle("OmniStream Media Export");
  pdfDoc.setCreator("OmniStream Universal Media Downloader");

  let addedPages = 0;

  for (let i = 0; i < items.length; i++) {
    try {
      const rawBuffer = await fetchImageBuffer(items[i].url);
      const { jpegBuffer, width, height } = await processImage(rawBuffer);

      const embeddedImage = await pdfDoc.embedJpg(jpegBuffer);

      let pageWidth = width;
      let pageHeight = height;
      let drawX = 0;
      let drawY = 0;
      let drawWidth = width;
      let drawHeight = height;

      if (pageSize === "a4" || pageSize === "letter") {
        const baseW = pageSize === "a4" ? 595.28 : 612.0;
        const baseH = pageSize === "a4" ? 841.89 : 792.0;

        const isLandscape =
          orientation === "landscape" ||
          (orientation === "auto" && width > height);

        pageWidth = isLandscape ? baseH : baseW;
        pageHeight = isLandscape ? baseW : baseH;

        const margin = 18; // clean border margin
        const availW = pageWidth - margin * 2;
        const availH = pageHeight - margin * 2;
        const scale = Math.min(availW / width, availH / height);

        drawWidth = width * scale;
        drawHeight = height * scale;
        drawX = (pageWidth - drawWidth) / 2;
        drawY = (pageHeight - drawHeight) / 2;
      } else {
        // "fit" to image dimensions with sensible max bound
        const maxDim = 1200;
        const scale = Math.min(1, maxDim / Math.max(width, height));
        pageWidth = width * scale;
        pageHeight = height * scale;
        drawWidth = pageWidth;
        drawHeight = pageHeight;
        drawX = 0;
        drawY = 0;
      }

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawImage(embeddedImage, {
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
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
