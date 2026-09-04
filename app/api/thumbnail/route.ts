import { NextRequest, NextResponse } from "next/server";
import { verifyMediaToken } from "@/lib/token";

export const runtime = "nodejs";

if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return new Response("Missing token", { status: 400 });
  }

  const payload = verifyMediaToken(token);
  if (!payload || !payload.url) {
    return new Response("Invalid token", { status: 403 });
  }

  try {
    // Route image thumbnail through global high-speed image proxy to ensure 100% valid SSL and no referrer blocks
    const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(payload.url)}&output=jpg`;
    
    const upstreamRes = await fetch(proxyUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "image/*,*/*;q=0.8",
      },
    });

    if (upstreamRes.ok) {
      const buffer = await upstreamRes.arrayBuffer();
      return new Response(Buffer.from(buffer), {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    }

    // Fallback: 307 redirect to proxy
    return NextResponse.redirect(proxyUrl, 307);
  } catch (err) {
    console.error("Thumbnail proxy error:", err);
    const fallbackProxy = `https://wsrv.nl/?url=${encodeURIComponent(payload.url)}&output=jpg`;
    return NextResponse.redirect(fallbackProxy, 307);
  }
}
