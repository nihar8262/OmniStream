import { NextRequest, NextResponse } from "next/server";
import { verifyMediaToken } from "@/lib/token";
import { createMediaZipStream, ZipMediaEntry } from "@/lib/zip";
import { zipLimiter, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
const MAX_ZIP_ITEMS = 20;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = zipLimiter.check(ip);

  const rateLimitHeaders = {
    "X-RateLimit-Limit": rateLimit.limit.toString(),
    "X-RateLimit-Remaining": rateLimit.remaining.toString(),
    "X-RateLimit-Reset": rateLimit.reset.toString(),
  };

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: `ZIP creation rate limit exceeded. Please wait ${rateLimit.reset} seconds.`,
        },
      },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  try {
    const body = await req.json();
    const tokens: string[] = body?.tokens || [];

    if (!Array.isArray(tokens) || tokens.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: "No media items provided for ZIP download." } },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    if (tokens.length > MAX_ZIP_ITEMS) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Maximum ${MAX_ZIP_ITEMS} items allowed per ZIP bundle to ensure fast processing.`,
          },
        },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const validEntries: ZipMediaEntry[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const payload = verifyMediaToken(tokens[i]);
      if (payload && payload.url) {
        validEntries.push({
          url: payload.url,
          type: payload.type,
          filename: payload.filename || `instagram_item_${i + 1}.${payload.type === "video" ? "mp4" : "jpg"}`,
        });
      }
    }

    if (validEntries.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: "All provided media tokens were invalid or expired." } },
        { status: 403, headers: rateLimitHeaders }
      );
    }

    const { stream } = createMediaZipStream(validEntries);
    const dateStr = new Date().toISOString().slice(0, 10);
    const zipFilename = `instagram_bundle_${dateStr}.zip`;

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(zipFilename)}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        ...rateLimitHeaders,
      },
    });
  } catch (err) {
    console.error("ZIP route error:", err);
    return NextResponse.json(
      { success: false, error: { message: "Failed to generate ZIP archive." } },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
