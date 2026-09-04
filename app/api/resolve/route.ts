import { NextRequest, NextResponse } from "next/server";
import { defaultResolver as instagramResolver } from "@/lib/resolver/instagram";
import { linkedInResolver } from "@/lib/resolver/linkedin";
import { resolveLimiter, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = resolveLimiter.check(ip);

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
          message: `Too many requests. Please wait ${rateLimit.reset} seconds before searching again.`,
        },
      },
      {
        status: 429,
        headers: rateLimitHeaders,
      }
    );
  }

  try {
    const body = await req.json();
    const { url, platform } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNSUPPORTED_URL",
            message: "Missing or invalid post URL in request payload.",
          },
        },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const cleanUrl = url.trim();
    const isLinkedIn =
      platform === "linkedin" ||
      cleanUrl.includes("linkedin.com/") ||
      cleanUrl.includes("lnkd.in/");

    const resolver = isLinkedIn ? linkedInResolver : instagramResolver;
    const result = await resolver.resolve(cleanUrl);

    if (!result.success) {
      const status =
        result.error.code === "NOT_FOUND"
          ? 404
          : result.error.code === "PRIVATE_OR_GATED"
          ? 403
          : result.error.code === "UNSUPPORTED_URL"
          ? 400
          : 502;

      return NextResponse.json(result, { status, headers: rateLimitHeaders });
    }

    // Sanitize items: Remove all internal raw URLs, returning only opaque tokens
    const clientItems = result.items.map((item) => ({
      id: item.id,
      type: item.type,
      width: item.width,
      height: item.height,
      thumbnailToken: item.thumbnailToken,
      mediaToken: item.mediaToken,
      filename: item.filename,
      caption: item.caption,
    }));

    return NextResponse.json(
      {
        success: true,
        postUrl: result.postUrl,
        shortcode: result.shortcode,
        author: result.author,
        caption: result.caption,
        items: clientItems,
        itemCount: clientItems.length,
      },
      { headers: rateLimitHeaders }
    );
  } catch (err: unknown) {
    console.error("Resolve route error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RESOLVER_FAILED",
          message: "Internal server error while resolving media.",
        },
      },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
