import { NextRequest, NextResponse } from "next/server";
import { verifyMediaToken } from "@/lib/token";
import { createPdfFromImages, PdfImageEntry } from "@/lib/pdf";
import { pdfLimiter, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
const MAX_PDF_ITEMS = 20;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = pdfLimiter.check(ip);

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
          message: `PDF creation rate limit exceeded. Please wait ${rateLimit.reset} seconds.`,
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
        { success: false, error: { message: "No image items selected for PDF conversion." } },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    if (tokens.length > MAX_PDF_ITEMS) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Maximum ${MAX_PDF_ITEMS} images allowed per PDF export.`,
          },
        },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const imageEntries: PdfImageEntry[] = [];

    for (const token of tokens) {
      const payload = verifyMediaToken(token);
      if (payload && payload.url) {
        if (payload.type === "image") {
          imageEntries.push({
            url: payload.url,
            filename: payload.filename,
          });
        }
      }
    }

    if (imageEntries.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "PDF conversion is only available for photos/images, not video reels.",
          },
        },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const pdfBytes = await createPdfFromImages(imageEntries);
    const dateStr = new Date().toISOString().slice(0, 10);
    const pdfFilename = `instagram_photos_${dateStr}.pdf`;

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(pdfFilename)}"`,
        "Content-Length": pdfBytes.byteLength.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate",
        ...rateLimitHeaders,
      },
    });
  } catch (err: unknown) {
    console.error("PDF route error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: err instanceof Error ? err.message : "Failed to generate PDF from images.",
        },
      },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
