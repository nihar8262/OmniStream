import * as archiverModule from "archiver";
import { PassThrough } from "stream";

function createZipArchiveInstance(): any {
  const mod: any = archiverModule;
  if (typeof mod.ZipArchive === "function") {
    return new mod.ZipArchive({ zlib: { level: 5 } });
  }
  if (typeof mod.default === "function") {
    return mod.default("zip", { zlib: { level: 5 } });
  }
  if (typeof mod === "function") {
    return mod("zip", { zlib: { level: 5 } });
  }
  if (typeof mod.Archiver === "function") {
    return new mod.Archiver("zip", { zlib: { level: 5 } });
  }
  throw new Error("Unable to initialize ZipArchive constructor");
}

export interface ZipMediaEntry {
  url: string;
  filename: string;
  type: "image" | "video";
}

if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

async function fetchWithTimeout(url: string, type?: "image" | "video", timeoutMs = 12000, retry = 1): Promise<Response> {
  let lastError: Error | null = null;
  const isLinkedIn = url.includes("licdn.com") || url.includes("linkedin.com");
  
  // For LinkedIn images, fetch directly with LinkedIn referer
  // For Instagram images, try wsrv.nl proxy first then direct
  const urlsToTry = type === "image" && !isLinkedIn
    ? [`https://wsrv.nl/?url=${encodeURIComponent(url)}&output=jpg`, url]
    : [url];

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
            Accept: "*/*",
          },
        });
        clearTimeout(timer);
        if (res.ok) return res;
      } catch (err: unknown) {
        clearTimeout(timer);
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < retry) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    }
  }
  throw lastError || new Error("Failed to fetch media");
}

/**
 * Creates a streaming ZIP archive from an array of media entries without storing on disk.
 */
export function createMediaZipStream(items: ZipMediaEntry[]): {
  stream: ReadableStream<Uint8Array>;
  abort: () => void;
} {
  const archive = createZipArchiveInstance();

  const passThrough = new PassThrough();
  archive.pipe(passThrough);

  // Convert Node.js PassThrough stream to Web ReadableStream
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      passThrough.on("data", (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      passThrough.on("end", () => {
        controller.close();
      });
      passThrough.on("error", (err) => {
        controller.error(err);
      });

      // Asynchronously append media entries
      (async () => {
        try {
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            try {
              const res = await fetchWithTimeout(item.url, item.type);
              if (!res.body) continue;

              const arrayBuffer = await res.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              archive.append(buffer, {
                name: item.filename || `instagram_${i + 1}.${item.type === "video" ? "mp4" : "jpg"}`,
              });
            } catch (err) {
              console.error(`Failed to fetch media item ${i + 1} for ZIP:`, err);
              // Append a text notice in place of failed item rather than failing entire zip
              archive.append(
                `Could not download item ${i + 1}: ${err instanceof Error ? err.message : "Network error"}`,
                { name: `error_item_${i + 1}.txt` }
              );
            }
          }
          await archive.finalize();
        } catch (err) {
          console.error("ZIP finalization error:", err);
          archive.abort();
          controller.error(err);
        }
      })();
    },
    cancel() {
      archive.abort();
      passThrough.destroy();
    },
  });

  return {
    stream,
    abort: () => {
      archive.abort();
      passThrough.destroy();
    },
  };
}
