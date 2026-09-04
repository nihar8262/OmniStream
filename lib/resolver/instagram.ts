import {
  MediaItem,
  MediaResolver,
  ResolveResult,
  ResolverErrorCode,
} from "./types";
import { createMediaToken } from "../token";

if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const INSTAGRAM_URL_REGEX =
  /(?:https?:\/\/)?(?:www\.|m\.)?instagram\.com\/(?:p|reel|reels|tv|share\/p|share\/reel)\/([A-Za-z0-9_-]+)/i;

export class InstagramResolver implements MediaResolver {
  public extractShortcode(url: string): string | null {
    if (!url || typeof url !== "string") return null;
    const match = url.trim().match(INSTAGRAM_URL_REGEX);
    return match ? match[1] : null;
  }

  public normalizeUrl(url: string): { normalizedUrl: string; shortcode: string } | null {
    const shortcode = this.extractShortcode(url);
    if (!shortcode) return null;
    const isReel = url.includes("/reel/") || url.includes("/reels/") || url.includes("/share/reel/");
    const path = isReel ? "reel" : "p";
    return {
      normalizedUrl: `https://www.instagram.com/${path}/${shortcode}/`,
      shortcode,
    };
  }

  public async resolve(rawUrl: string): Promise<ResolveResult> {
    const normalized = this.normalizeUrl(rawUrl);
    if (!normalized) {
      return {
        success: false,
        postUrl: rawUrl,
        error: {
          code: "UNSUPPORTED_URL",
          message: "Please enter a valid Instagram post or reel link (e.g. instagram.com/p/... or instagram.com/reel/...)",
        },
      };
    }

    const { normalizedUrl, shortcode } = normalized;

    // Strategy 1: RapidAPI if configured in environment
    const rapidKey = (process.env.RAPIDAPI_KEY || process.env.RAPID_KEY)?.trim();
    if (rapidKey) {
      try {
        const rapidResult = await this.resolveViaRapidAPI(normalizedUrl, shortcode);
        if (rapidResult && rapidResult.success && rapidResult.items.length > 0) {
          return rapidResult;
        }
      } catch (e) {
        console.warn("RapidAPI strategy failed:", e);
      }
    }

    // Strategy 2: Modern Instagram GraphQL query (xdt_shortcode_media, doc_id: 9510064595728286)
    try {
      const gqlResult = await this.resolveViaModernGraphQL(shortcode, normalizedUrl);
      if (gqlResult && gqlResult.success && gqlResult.items.length > 0) {
        return gqlResult;
      }
    } catch (e) {
      console.warn("Strategy 2 (GraphQL) failed:", e);
    }

    // Strategy 3: Official Meta / Instagram oEmbed API
    try {
      const oembedResult = await this.resolveViaOEmbed(shortcode, normalizedUrl);
      if (oembedResult && oembedResult.success && oembedResult.items.length > 0) {
        return oembedResult;
      }
    } catch (e) {
      console.warn("Strategy 3 (oEmbed) failed:", e);
    }

    // Strategy 4: Public Embed Page extraction
    try {
      const embedResult = await this.resolveViaEmbed(shortcode, normalizedUrl);
      if (embedResult && embedResult.success && embedResult.items.length > 0) {
        return embedResult;
      }
    } catch (e) {
      console.warn("Strategy 4 (Embed) failed:", e);
    }

    // Strategy 5: Direct Post Page HTML parsing (OpenGraph, JSON-LD)
    try {
      const pageResult = await this.resolveViaDirectPage(normalizedUrl, shortcode);
      if (pageResult && pageResult.success && pageResult.items.length > 0) {
        return pageResult;
      }
    } catch (e) {
      console.warn("Strategy 5 (Direct Page) failed:", e);
    }

    // Strategy 6: Mobile API (i.instagram.com/api/v1/media/{mediaId}/info/)
    try {
      const mobileResult = await this.resolveViaMobileApi(shortcode, normalizedUrl);
      if (mobileResult && mobileResult.success && mobileResult.items.length > 0) {
        return mobileResult;
      }
    } catch (e) {
      console.warn("Strategy 6 (Mobile API) failed:", e);
    }

    return {
      success: false,
      postUrl: normalizedUrl,
      error: {
        code: "RESOLVER_FAILED",
        message: "Unable to retrieve media from this post. The post might be private, deleted, or age-restricted.",
      },
    };
  }

  /**
   * Universal RapidAPI Instagram Downloader Bridge with Multi-Key & Quota Fallback
   */
  private async resolveViaRapidAPI(postUrl: string, shortcode: string): Promise<ResolveResult | null> {
    // Collect all configured API keys (supports comma-separated list or multiple env vars)
    const rawKeys = [
      process.env.RAPIDAPI_KEYS,
      process.env.RAPIDAPI_KEY,
      process.env.RAPID_KEY,
    ]
      .filter(Boolean)
      .join(",");

    const keys = rawKeys
      .split(/[,;\s]+/)
      .map((k) => k.trim())
      .filter((k) => k.length > 5);

    const mediaId = this.shortcodeToMediaId(shortcode);

    // Supported RapidAPI Instagram providers in optimal order
    const configuredHost = process.env.RAPIDAPI_HOST?.trim();
    const defaultHosts = [
      { host: "instagram-downloader-scraper-reels-igtv-posts-stories.p.rapidapi.com", path: `/scraper?url=${encodeURIComponent(postUrl)}` },
      { host: "instagram-api-fast-reliable-data-scraper.p.rapidapi.com", path: `/post?shortcode=${encodeURIComponent(shortcode)}` },
      { host: "instagram-api-fast-reliable-data-scraper.p.rapidapi.com", path: `/media?id=${encodeURIComponent(mediaId)}` },
      { host: "instagram-api-fast-reliable-data-scraper.p.rapidapi.com", path: `/media?shortcode=${encodeURIComponent(shortcode)}` },
      { host: "instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com", path: `/get-info-rapidapi?url=${encodeURIComponent(postUrl)}` },
      { host: "instagram-bulk-scraper-latest.p.rapidapi.com", path: `/media_info_from_url?url=${encodeURIComponent(postUrl)}` },
      { host: "instagram-media-downloader.p.rapidapi.com", path: `/rapid/instagram.php?url=${encodeURIComponent(postUrl)}` },
      { host: "social-download-all-in-one.p.rapidapi.com", path: `/v1/social/autolink?url=${encodeURIComponent(postUrl)}` },
    ];

    const hostsToTry = configuredHost
      ? [
          { host: configuredHost, path: `/scraper?url=${encodeURIComponent(postUrl)}` },
          { host: configuredHost, path: `/post?shortcode=${encodeURIComponent(shortcode)}` },
          { host: configuredHost, path: `/media?id=${encodeURIComponent(mediaId)}` },
          { host: configuredHost, path: `/media?shortcode=${encodeURIComponent(shortcode)}` },
          { host: configuredHost, path: `/get-info-rapidapi?url=${encodeURIComponent(postUrl)}` },
          ...defaultHosts.filter((d) => d.host !== configuredHost),
        ]
      : defaultHosts;

    // Iterate through available keys and endpoints with automatic quota exhaustion fallback
    for (let kIdx = 0; kIdx < keys.length; kIdx++) {
      const currentKey = keys[kIdx];

      for (const target of hostsToTry) {
        try {
          const apiUrl = `https://${target.host}${target.path}`;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 9000);

          const res = await fetch(apiUrl, {
            signal: controller.signal,
            headers: {
              "x-rapidapi-key": currentKey,
              "x-rapidapi-host": target.host,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          });
          clearTimeout(timeout);

          if (res.status === 429 || res.status === 403) {
            console.warn(`RapidAPI host ${target.host} quota exhausted or rate-limited (${res.status}). Trying next provider...`);
            continue;
          }

          if (!res.ok) continue;

          const data = await res.json();
          const extracted = this.extractMediaFromAnyJson(data, shortcode, postUrl);
          if (extracted && extracted.success && extracted.items.length > 0) {
            return extracted;
          }
        } catch (err) {
          console.warn(`RapidAPI key #${kIdx + 1} request to ${target.host} failed:`, err);
        }
      }
    }

    return null;
  }

  /**
   * Recursively traverses and extracts media items from any structured RapidAPI/Scraper response
   */
  public extractMediaFromAnyJson(data: any, shortcode: string, postUrl: string): ResolveResult | null {
    if (!data) return null;

    // Check if data is already a standard Instagram shortcode_media object
    const mediaObj = data.data?.xdt_shortcode_media || data.data?.shortcode_media || data.graphql?.shortcode_media || data.items?.[0];
    if (mediaObj && (mediaObj.display_url || mediaObj.edge_sidecar_to_children || mediaObj.image_versions2)) {
      const parsed = this.extractFromMediaObject(mediaObj, shortcode);
      if (parsed && parsed.items.length > 0) {
        return {
          success: true,
          postUrl,
          shortcode,
          author: parsed.author,
          caption: parsed.caption,
          items: parsed.items,
          itemCount: parsed.items.length,
        };
      }
    }

    const items: MediaItem[] = [];
    let authorName = data.author?.username || data.author || data.owner?.username || data.user?.username || "";
    let captionText = data.caption?.text || data.caption || data.title || data.text || "";

    // Candidate arrays
    const candidates = Array.isArray(data)
      ? data
      : Array.isArray(data.data)
      ? data.data
      : data.result || data.results || data.media || data.url_list || data.urls || (data.url ? [data] : []);

    if (Array.isArray(candidates)) {
      candidates.forEach((entry: any, idx: number) => {
        if (typeof entry === "string" && entry.startsWith("http")) {
          const isVideo = entry.includes(".mp4") || entry.includes("video");
          const ext = isVideo ? "mp4" : "jpg";
          const type = isVideo ? "video" : "image";
          items.push({
            id: `${shortcode}_${idx + 1}`,
            type,
            thumbnailToken: createMediaToken(entry, "image", `${shortcode}_thumb_${idx + 1}.jpg`),
            mediaToken: createMediaToken(entry, type, `${shortcode}_${idx + 1}.${ext}`),
            filename: `${shortcode}_${idx + 1}.${ext}`,
            _internalUrl: entry,
            _internalThumbnailUrl: entry,
          });
          return;
        }

        if (typeof entry === "object" && entry !== null) {
          const mediaUrl = entry.media || entry.url || entry.download_url || entry.video_url || entry.display_url || entry.media_url || entry.src;
          const thumbUrl = entry.thumb || entry.thumbnail || entry.display_url || entry.poster || mediaUrl;
          const isVideo =
            entry.isVideo === true ||
            entry.type === "video" ||
            entry.is_video === true ||
            (typeof mediaUrl === "string" && (mediaUrl.includes(".mp4") || mediaUrl.includes("video/mp4"))) ||
            Boolean(entry.video_versions);

          if (mediaUrl && typeof mediaUrl === "string") {
            const type = isVideo ? "video" : "image";
            const ext = isVideo ? "mp4" : "jpg";
            items.push({
              id: `${shortcode}_${idx + 1}`,
              type,
              width: entry.width || entry.dimensions?.width,
              height: entry.height || entry.dimensions?.height,
              thumbnailToken: createMediaToken(thumbUrl, "image", `${shortcode}_thumb_${idx + 1}.jpg`),
              mediaToken: createMediaToken(mediaUrl, type, `${shortcode}_${idx + 1}.${ext}`),
              filename: `${shortcode}_${idx + 1}.${ext}`,
              caption: entry.caption || captionText,
              _internalUrl: mediaUrl,
              _internalThumbnailUrl: thumbUrl,
            });
          }
        }
      });
    }

    if (items.length === 0) return null;

    return {
      success: true,
      postUrl,
      shortcode,
      author: authorName ? { username: String(authorName) } : undefined,
      caption: captionText ? String(captionText) : undefined,
      items,
      itemCount: items.length,
    };
  }

  /**
   * Strategy 2: Modern GraphQL query with optional session cookie
   */
  private async resolveViaModernGraphQL(shortcode: string, postUrl: string): Promise<ResolveResult | null> {
    const sessionCookie = process.env.INSTAGRAM_SESSION_ID
      ? `sessionid=${process.env.INSTAGRAM_SESSION_ID};`
      : "";

    const body = new URLSearchParams({
      variables: JSON.stringify({
        shortcode,
        fetch_tagged_user_count: null,
        hoisted_comment_id: null,
        hoisted_reply_id: null,
      }),
      doc_id: "9510064595728286",
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch("https://www.instagram.com/graphql/query", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "X-IG-App-ID": "936619743392459",
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": sessionCookie,
        "Origin": "https://www.instagram.com",
        "Referer": `https://www.instagram.com/p/${shortcode}/`,
        "Sec-Fetch-Site": "same-origin",
      },
      body: body.toString(),
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const json = await res.json();
    const media = json?.data?.xdt_shortcode_media || json?.data?.shortcode_media;
    if (!media) return null;

    const parsed = this.extractFromMediaObject(media, shortcode);
    if (!parsed || parsed.items.length === 0) return null;

    return {
      success: true,
      postUrl,
      shortcode,
      author: parsed.author,
      caption: parsed.caption,
      items: parsed.items,
      itemCount: parsed.items.length,
    };
  }

  /**
   * Strategy 3: Official Meta / Instagram oEmbed API
   */
  private async resolveViaOEmbed(shortcode: string, postUrl: string): Promise<ResolveResult | null> {
    const oembedUrl = `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(postUrl)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(oembedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();

    if (data && data.thumbnail_url) {
      const items: MediaItem[] = [
        {
          id: `${shortcode}_1`,
          type: "image",
          thumbnailToken: createMediaToken(data.thumbnail_url, "image", `${shortcode}_thumb_1.jpg`),
          mediaToken: createMediaToken(data.thumbnail_url, "image", `${shortcode}_1.jpg`),
          filename: `${shortcode}_1.jpg`,
          caption: data.title,
          width: data.thumbnail_width,
          height: data.thumbnail_height,
          _internalUrl: data.thumbnail_url,
          _internalThumbnailUrl: data.thumbnail_url,
        },
      ];

      return {
        success: true,
        postUrl,
        shortcode,
        author: data.author_name ? { username: data.author_name } : undefined,
        caption: data.title,
        items,
        itemCount: items.length,
      };
    }

    return null;
  }

  /**
   * Strategy 4: Embed page extraction
   */
  private async resolveViaEmbed(shortcode: string, postUrl: string): Promise<ResolveResult | null> {
    const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(embedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Dest": "iframe",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "cross-site",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      if (res.status === 404) {
        return {
          success: false,
          postUrl,
          error: {
            code: "NOT_FOUND",
            message: "Post not found. It may have been deleted or the link is incorrect.",
          },
        };
      }
      return null;
    }

    const html = await res.text();
    return this.parseEmbedHtml(html, shortcode, postUrl);
  }

  /**
   * Strategy 5: Direct post page parsing
   */
  private async resolveViaDirectPage(postUrl: string, shortcode: string): Promise<ResolveResult | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(postUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      if (res.status === 404) {
        return {
          success: false,
          postUrl,
          error: {
            code: "NOT_FOUND",
            message: "The requested Instagram post could not be found.",
          },
        };
      }
      return null;
    }

    const html = await res.text();
    return this.parseDirectPageHtml(html, shortcode, postUrl);
  }

  /**
   * Strategy 6: Mobile API
   */
  private async resolveViaMobileApi(shortcode: string, postUrl: string): Promise<ResolveResult | null> {
    const mediaId = this.shortcodeToMediaId(shortcode);
    const url = `https://i.instagram.com/api/v1/media/${mediaId}/info/`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Instagram 275.0.0.27.98 Android (33/13; 420dpi; 1080x2400; Xiaomi; M2101K6G; sweet; qcom; en_US; 455432021)",
        "X-IG-App-ID": "936619743392459",
        "X-IG-Capabilities": "36r/Fx8=",
        "X-IG-Connection-Type": "WIFI",
        "Accept": "*/*",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const json = await res.json();
    const item = json.items?.[0];
    if (!item) return null;

    const items: MediaItem[] = [];
    const isVideo = Boolean(item.video_versions && item.video_versions.length > 0);
    const mediaUrl = isVideo ? item.video_versions[0].url : item.image_versions2?.candidates?.[0]?.url;
    const thumbUrl = item.image_versions2?.candidates?.[0]?.url || mediaUrl;

    if (mediaUrl) {
      const type = isVideo ? "video" : "image";
      items.push({
        id: `${shortcode}_1`,
        type,
        thumbnailToken: createMediaToken(thumbUrl, "image", `${shortcode}_thumb_1.jpg`),
        mediaToken: createMediaToken(mediaUrl, type, `${shortcode}_1.${isVideo ? "mp4" : "jpg"}`),
        filename: `${shortcode}_1.${isVideo ? "mp4" : "jpg"}`,
        caption: item.caption?.text,
        _internalUrl: mediaUrl,
        _internalThumbnailUrl: thumbUrl,
      });

      return {
        success: true,
        postUrl,
        shortcode,
        author: item.user ? { username: item.user.username, fullName: item.user.full_name } : undefined,
        caption: item.caption?.text,
        items,
        itemCount: items.length,
      };
    }

    return null;
  }

  private shortcodeToMediaId(shortcode: string): string {
    let id = BigInt(0);
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    for (let i = 0; i < shortcode.length; i++) {
      const char = shortcode[i];
      const val = BigInt(alphabet.indexOf(char));
      id = id * BigInt(64) + val;
    }
    return id.toString();
  }

  public parseEmbedHtml(html: string, shortcode: string, postUrl: string): ResolveResult | null {
    if (html.includes("This post is private") || html.includes("Login • Instagram") || html.includes("login-box")) {
      return {
        success: false,
        postUrl,
        error: {
          code: "PRIVATE_OR_GATED",
          message: "This post belongs to a private account or requires login. Only public posts are supported.",
        },
      };
    }

    const items: MediaItem[] = [];
    let authorUsername = "";
    let authorFullName = "";
    let caption = "";

    const contextMatch = html.match(/window\.__additionalDataLoaded\s*\(\s*['"][^'"]+['"]\s*,\s*({.+?})\s*\);/);
    if (contextMatch && contextMatch[1]) {
      try {
        const data = JSON.parse(contextMatch[1]);
        const shortcodeMedia = data?.graphql?.shortcode_media || data?.items?.[0] || data;
        const parsedFromObj = this.extractFromMediaObject(shortcodeMedia, shortcode);
        if (parsedFromObj && parsedFromObj.items.length > 0) {
          return {
            success: true,
            postUrl,
            shortcode,
            author: parsedFromObj.author,
            caption: parsedFromObj.caption,
            items: parsedFromObj.items,
            itemCount: parsedFromObj.items.length,
          };
        }
      } catch {}
    }

    const authorMatch = html.match(/class=["'][^"']*UsernameText[^"']*["'][^>]*>([^<]+)<\/span>/i) ||
      html.match(/href=["']https:\/\/www\.instagram\.com\/([a-zA-Z0-9._]+)\/?["']/i);
    if (authorMatch && authorMatch[1]) {
      authorUsername = authorMatch[1].replace(/[@\s]/g, "");
    }

    const captionMatch = html.match(/class=["'][^"']*CaptionComments[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
      html.match(/class=["'][^"']*Caption[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    if (captionMatch && captionMatch[1]) {
      caption = captionMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }

    const videoMatches = [...html.matchAll(/<video[^>]+src=["']([^"']+)["'][^>]*>/gi)];
    for (let i = 0; i < videoMatches.length; i++) {
      const rawVideoUrl = this.unescapeHtml(videoMatches[i][1]);
      if (rawVideoUrl && !rawVideoUrl.startsWith("blob:")) {
        const thumbMatch = html.match(/poster=["']([^"']+)["']/i);
        const thumbUrl = thumbMatch ? this.unescapeHtml(thumbMatch[1]) : rawVideoUrl;
        
        items.push({
          id: `${shortcode}_video_${i + 1}`,
          type: "video",
          thumbnailToken: createMediaToken(thumbUrl, "image", `${shortcode}_thumb_${i + 1}.jpg`),
          mediaToken: createMediaToken(rawVideoUrl, "video", `${shortcode}_video_${i + 1}.mp4`),
          filename: `${shortcode}_video_${i + 1}.mp4`,
          _internalUrl: rawVideoUrl,
          _internalThumbnailUrl: thumbUrl,
        });
      }
    }

    const imgMatches = [
      ...html.matchAll(/<img[^>]+class=["'][^"']*(?:EmbeddedMediaImage|EmbeddedImg)[^"']*["'][^>]+src=["']([^"']+)["'][^>]*>/gi),
    ];

    if (imgMatches.length > 0 && items.length === 0) {
      imgMatches.forEach((match, idx) => {
        const rawImgUrl = this.unescapeHtml(match[1]);
        if (rawImgUrl && !rawImgUrl.includes("s150x150") && !rawImgUrl.includes("avatar")) {
          items.push({
            id: `${shortcode}_image_${idx + 1}`,
            type: "image",
            thumbnailToken: createMediaToken(rawImgUrl, "image", `${shortcode}_thumb_${idx + 1}.jpg`),
            mediaToken: createMediaToken(rawImgUrl, "image", `${shortcode}_image_${idx + 1}.jpg`),
            filename: `${shortcode}_image_${idx + 1}.jpg`,
            _internalUrl: rawImgUrl,
            _internalThumbnailUrl: rawImgUrl,
          });
        }
      });
    }

    if (items.length === 0) {
      const allImgs = [...html.matchAll(/<img[^>]+src=["'](https:\/\/[^"']*(?:fbcdn|cdninstagram)[^"']+)["']/gi)];
      for (let i = 0; i < allImgs.length; i++) {
        const imgUrl = this.unescapeHtml(allImgs[i][1]);
        if (imgUrl && !imgUrl.includes("s150x150") && !imgUrl.includes("150_150")) {
          items.push({
            id: `${shortcode}_image_${i + 1}`,
            type: "image",
            thumbnailToken: createMediaToken(imgUrl, "image", `${shortcode}_thumb_${i + 1}.jpg`),
            mediaToken: createMediaToken(imgUrl, "image", `${shortcode}_image_${i + 1}.jpg`),
            filename: `${shortcode}_image_${i + 1}.jpg`,
            _internalUrl: imgUrl,
            _internalThumbnailUrl: imgUrl,
          });
          break;
        }
      }
    }

    if (items.length === 0) return null;

    return {
      success: true,
      postUrl,
      shortcode,
      author: authorUsername ? { username: authorUsername, fullName: authorFullName } : undefined,
      caption: caption || undefined,
      items,
      itemCount: items.length,
    };
  }

  public parseDirectPageHtml(html: string, shortcode: string, postUrl: string): ResolveResult | null {
    if (html.includes("Page Not Found • Instagram")) {
      return {
        success: false,
        postUrl,
        error: {
          code: "NOT_FOUND",
          message: "Instagram post not found.",
        },
      };
    }

    const jsonLdMatches = [...html.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)];
    for (const match of jsonLdMatches) {
      try {
        const data = JSON.parse(match[1]);
        if (data["@type"] === "SocialMediaPosting" || data["@type"] === "VideoObject" || data["@type"] === "ImageObject") {
          const items: MediaItem[] = [];
          const isVideo = data["@type"] === "VideoObject" || Boolean(data.video);
          const mediaUrl = data.video?.contentUrl || data.contentUrl || data.image?.url || data.image;
          const thumbUrl = data.thumbnailUrl || data.image?.url || (typeof data.image === "string" ? data.image : undefined);

          if (mediaUrl) {
            const resolvedType = isVideo ? "video" : "image";
            items.push({
              id: `${shortcode}_1`,
              type: resolvedType,
              thumbnailToken: createMediaToken(thumbUrl || mediaUrl, "image", `${shortcode}_thumb_1.jpg`),
              mediaToken: createMediaToken(mediaUrl, resolvedType, `${shortcode}_1.${isVideo ? "mp4" : "jpg"}`),
              filename: `${shortcode}_1.${isVideo ? "mp4" : "jpg"}`,
              caption: data.headline || data.articleBody || data.caption,
              _internalUrl: mediaUrl,
              _internalThumbnailUrl: thumbUrl || mediaUrl,
            });

            return {
              success: true,
              postUrl,
              shortcode,
              author: data.author?.name ? { username: data.author.name } : undefined,
              caption: data.headline || data.articleBody,
              items,
              itemCount: items.length,
            };
          }
        }
      } catch {}
    }

    const ogVideo = this.extractMetaContent(html, "og:video") || this.extractMetaContent(html, "og:video:secure_url");
    const ogImage = this.extractMetaContent(html, "og:image");
    const ogTitle = this.extractMetaContent(html, "og:title");
    const ogDescription = this.extractMetaContent(html, "og:description");

    const items: MediaItem[] = [];

    if (ogVideo) {
      items.push({
        id: `${shortcode}_video_1`,
        type: "video",
        thumbnailToken: createMediaToken(ogImage || ogVideo, "image", `${shortcode}_thumb_1.jpg`),
        mediaToken: createMediaToken(ogVideo, "video", `${shortcode}_video_1.mp4`),
        filename: `${shortcode}_video_1.mp4`,
        _internalUrl: ogVideo,
        _internalThumbnailUrl: ogImage || ogVideo,
      });
    } else if (ogImage) {
      items.push({
        id: `${shortcode}_image_1`,
        type: "image",
        thumbnailToken: createMediaToken(ogImage, "image", `${shortcode}_thumb_1.jpg`),
        mediaToken: createMediaToken(ogImage, "image", `${shortcode}_image_1.jpg`),
        filename: `${shortcode}_image_1.jpg`,
        _internalUrl: ogImage,
        _internalThumbnailUrl: ogImage,
      });
    }

    if (items.length > 0) {
      let username = "";
      if (ogTitle) {
        const uMatch = ogTitle.match(/on Instagram:\s*["']?([^"'\n]+)/i) || ogTitle.match(/@([a-zA-Z0-9._]+)/);
        if (uMatch) username = uMatch[1].trim();
      }
      return {
        success: true,
        postUrl,
        shortcode,
        author: username ? { username } : undefined,
        caption: ogDescription || undefined,
        items,
        itemCount: items.length,
      };
    }

    return null;
  }

  public extractFromMediaObject(
    media: Record<string, any>,
    shortcode: string
  ): { items: MediaItem[]; author?: { username: string; fullName?: string }; caption?: string } | null {
    if (!media) return null;

    const items: MediaItem[] = [];
    const author = media.owner
      ? {
          username: media.owner.username || "",
          fullName: media.owner.full_name || "",
          avatarUrl: media.owner.profile_pic_url,
        }
      : undefined;

    const captionNode = media.edge_media_to_caption?.edges?.[0]?.node?.text || media.caption?.text || media.caption;
    const caption = typeof captionNode === "string" ? captionNode : undefined;

    if (media.edge_sidecar_to_children?.edges?.length > 0) {
      const edges = media.edge_sidecar_to_children.edges;
      edges.forEach((edge: any, idx: number) => {
        const node = edge.node;
        const isVideo = Boolean(node.is_video || node.video_url);
        const mediaUrl = node.video_url || node.display_url;
        const thumbUrl = node.display_url || mediaUrl;

        if (mediaUrl) {
          const type = isVideo ? "video" : "image";
          const ext = isVideo ? "mp4" : "jpg";
          items.push({
            id: `${shortcode}_${idx + 1}`,
            type,
            width: node.dimensions?.width,
            height: node.dimensions?.height,
            thumbnailToken: createMediaToken(thumbUrl, "image", `${shortcode}_thumb_${idx + 1}.jpg`),
            mediaToken: createMediaToken(mediaUrl, type, `${shortcode}_${idx + 1}.${ext}`),
            filename: `${shortcode}_${idx + 1}.${ext}`,
            _internalUrl: mediaUrl,
            _internalThumbnailUrl: thumbUrl,
          });
        }
      });
    } else {
      const isVideo = Boolean(media.is_video || media.video_url);
      const mediaUrl = media.video_url || media.display_url;
      const thumbUrl = media.display_url || mediaUrl;

      if (mediaUrl) {
        const type = isVideo ? "video" : "image";
        const ext = isVideo ? "mp4" : "jpg";
        items.push({
          id: `${shortcode}_1`,
          type,
          width: media.dimensions?.width,
          height: media.dimensions?.height,
          thumbnailToken: createMediaToken(thumbUrl, "image", `${shortcode}_thumb_1.jpg`),
          mediaToken: createMediaToken(mediaUrl, type, `${shortcode}_1.${ext}`),
          filename: `${shortcode}_1.${ext}`,
          _internalUrl: mediaUrl,
          _internalThumbnailUrl: thumbUrl,
        });
      }
    }

    return { items, author, caption };
  }

  private extractMetaContent(html: string, property: string): string | null {
    const regex = new RegExp(`<meta\\s+(?:property|name)=["']${property}["']\\s+content=["']([^"']+)["']`, "i");
    const match = html.match(regex);
    if (match && match[1]) {
      return this.unescapeHtml(match[1]);
    }
    const reverseRegex = new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+(?:property|name)=["']${property}["']`, "i");
    const reverseMatch = html.match(reverseRegex);
    return reverseMatch && reverseMatch[1] ? this.unescapeHtml(reverseMatch[1]) : null;
  }

  private unescapeHtml(str: string): string {
    return str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\\u0026/g, "&")
      .replace(/\\\//g, "/");
  }
}

export const defaultResolver = new InstagramResolver();
