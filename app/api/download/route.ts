import { NextRequest, NextResponse } from "next/server";
import { verifyMediaToken } from "@/lib/token";
import { downloadLimiter, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = downloadLimiter.check(ip);

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
          message: "Download rate limit exceeded. Please wait a moment.",
        },
      },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  const token = req.nextUrl.searchParams.get("token");
  const customFilename = req.nextUrl.searchParams.get("filename");

  if (!token) {
    return NextResponse.json(
      { success: false, error: { message: "Missing media token" } },
      { status: 400, headers: rateLimitHeaders }
    );
  }

  const payload = verifyMediaToken(token);
  if (!payload) {
    return NextResponse.json(
      { success: false, error: { message: "Invalid or expired media token" } },
      { status: 403, headers: rateLimitHeaders }
    );
  }

  const filename =
    customFilename ||
    payload.filename ||
    `instagram_media.${payload.type === "video" ? "mp4" : "jpg"}`;

  try {
    let buffer: Buffer | null = null;
    let contentType = payload.type === "video" ? "video/mp4" : "image/jpeg";

    if (payload.type === "image") {
      // 1. Try high-speed image proxy first (bypasses Instagram CDN SSL/IP restrictions)
      try {
        const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(payload.url)}&output=jpg`;
        const proxyRes = await fetch(proxyUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "image/*,*/*;q=0.8",
          },
        });
        if (proxyRes.ok) {
          const arrayBuffer = await proxyRes.arrayBuffer();
          buffer = Buffer.from(arrayBuffer);
          contentType = proxyRes.headers.get("content-type") || "image/jpeg";
        }
      } catch (err) {
        console.warn("Proxy image fetch failed, trying direct:", err);
      }
    }

    // 2. Direct or video fetch fallback
    if (!buffer) {
      const upstreamRes = await fetch(payload.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Referer: "https://www.instagram.com/",
          Accept: "*/*",
        },
      });

      if (upstreamRes.ok) {
        const arrayBuffer = await upstreamRes.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
        contentType = upstreamRes.headers.get("content-type") || contentType;
      }
    }

    if (!buffer) {
      // Last-resort fallback: 307 redirect
      return NextResponse.redirect(payload.url, 307);
    }

    // Send binary download stream directly to browser
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Length": buffer.byteLength.toString(),
        "Cache-Control": "public, max-age=3600",
        ...rateLimitHeaders,
      },
    });
  } catch (err) {
    console.error("Download stream error:", err);
    return NextResponse.json(
      { success: false, error: { message: "Error downloading media stream" } },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
