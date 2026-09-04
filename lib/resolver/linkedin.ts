import { createMediaToken } from "../token";
import {
  MediaItem,
  MediaResolver,
  PostAuthor,
  ResolveResult,
} from "./types";

export class LinkedInResolver implements MediaResolver {
  /**
   * Resolves media from public LinkedIn post, update, document carousel, or article URLs
   */
  public async resolve(url: string): Promise<ResolveResult> {
    const cleanUrl = url.trim();

    if (!cleanUrl.includes("linkedin.com/")) {
      return {
        success: false,
        postUrl: cleanUrl,
        error: {
          code: "UNSUPPORTED_URL",
          message: "Please enter a valid LinkedIn post, feed update, or article link (e.g. linkedin.com/posts/... or linkedin.com/feed/update/...)",
        },
      };
    }

    // Extract an identifier / urn from the URL if possible
    const match = cleanUrl.match(/urn:li:(activity|ugcPost|share):(\d+)/i) ||
                  cleanUrl.match(/\/posts\/([a-zA-Z0-9_-]+)/i) ||
                  cleanUrl.match(/\/feed\/update\/([a-zA-Z0-9_%:-]+)/i);

    const postUrn = match ? match[0].replace(/[\/:]+/g, "_") : `li_${Date.now()}`;

    // Extract username if present in /posts/{username}_{slug}
    let username: string | undefined;
    const postsMatch = cleanUrl.match(/\/posts\/([a-zA-Z0-9_.-]+?)_([a-zA-Z0-9_.-]+)/i);
    if (postsMatch && postsMatch[1]) {
      username = postsMatch[1];
    }

    // Strategy 1: RapidAPI LinkedIn Scrapers (with rotation)
    try {
      const rapidResult = await this.resolveViaRapidAPI(cleanUrl, postUrn, username);
      if (rapidResult && rapidResult.success && rapidResult.items.length > 0) {
        return rapidResult;
      }
    } catch (err) {
      console.warn("LinkedIn RapidAPI strategy failed:", err);
    }

    // Strategy 2: Direct High-Fidelity Page & Document Carousel Extraction
    try {
      const pageResult = await this.resolveViaDirectPage(cleanUrl, postUrn, username);
      if (pageResult && pageResult.success && pageResult.items.length > 0) {
        return pageResult;
      }
    } catch (err) {
      console.warn("LinkedIn Direct Page strategy failed:", err);
    }

    return {
      success: false,
      postUrl: cleanUrl,
      error: {
        code: "RESOLVER_FAILED",
        message: "Unable to retrieve media from this LinkedIn post. The post might be private, deleted, or require login.",
      },
    };
  }

  /**
   * RapidAPI LinkedIn post resolver with multi-endpoint and key rotation
   */
  private async resolveViaRapidAPI(postUrl: string, postUrn: string, username?: string): Promise<ResolveResult | null> {
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

    if (keys.length === 0) return null;

    const hostsToTry = [
      {
        host: "linkedin-data-api.p.rapidapi.com",
        path: `/get-post?url=${encodeURIComponent(postUrl)}`,
      },
      ...(username ? [{
        host: "linkedin-data-api.p.rapidapi.com",
        path: `/get-profile-posts?username=${encodeURIComponent(username)}`,
      }] : []),
      {
        host: "linkedin-bulk-data-scraper.p.rapidapi.com",
        path: `/post?url=${encodeURIComponent(postUrl)}`,
      },
    ];

    for (let kIdx = 0; kIdx < keys.length; kIdx++) {
      const currentKey = keys[kIdx];

      for (const target of hostsToTry) {
        try {
          const apiUrl = `https://${target.host}${target.path}`;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);

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
            continue;
          }

          if (!res.ok) continue;

          const data = await res.json();
          if (data && (data.success === false || data.message?.includes("no longer available"))) {
            continue;
          }

          const extracted = this.extractMediaFromJson(data, postUrn, postUrl);
          if (extracted && extracted.success && extracted.items.length > 0) {
            return extracted;
          }
        } catch (err) {
          // silently continue to next endpoint
        }
      }
    }

    return null;
  }

  /**
   * Normalizes and extracts media items, author, and caption from structured LinkedIn API JSON responses
   */
  public extractMediaFromJson(data: any, postUrn: string, postUrl: string): ResolveResult | null {
    if (!data) return null;

    // If response is a profile posts array, find matching post or latest post
    let payload = data.data || data.post || data.result || data;
    if (Array.isArray(payload)) {
      if (payload.length === 0) return null;
      // Match by urn if present, or take first
      const matched = payload.find((p: any) =>
        (p.urn && postUrl.includes(p.urn)) ||
        (p.url && postUrl.includes(p.url)) ||
        (p.id && postUrl.includes(p.id))
      );
      payload = matched || payload[0];
    }

    // Extract Author
    let author: PostAuthor | undefined;
    const authorData = payload.author || payload.actor || payload.user || payload.company || payload.creator;
    if (authorData) {
      const username = authorData.username || authorData.vanityName || authorData.id || authorData.publicId || "linkedin_user";
      const fullName =
        authorData.fullName ||
        authorData.name ||
        (authorData.firstName
          ? `${authorData.firstName || ""} ${authorData.lastName || ""}`.trim()
          : undefined);
      const avatarUrl =
        authorData.profilePicture ||
        authorData.avatar ||
        authorData.logo ||
        authorData.picture;

      author = {
        username: String(username),
        fullName: fullName || undefined,
        avatarUrl: typeof avatarUrl === "string" ? avatarUrl : undefined,
      };
    }

    // Extract Caption / Text
    const caption =
      payload.text ||
      payload.commentary ||
      payload.description ||
      payload.title ||
      payload.summary ||
      "";

    const items: MediaItem[] = [];

    // 1. Check for Video
    const videoData =
      payload.video ||
      payload.videos ||
      (payload.media?.type === "video" ? payload.media : null);

    if (videoData) {
      const videoUrl =
        (typeof videoData === "string" && videoData) ||
        videoData.url ||
        videoData.streamUrl ||
        videoData.videoUrl ||
        videoData.downloadUrl ||
        (Array.isArray(videoData) && (videoData[0]?.url || videoData[0]));

      if (typeof videoUrl === "string" && videoUrl.startsWith("http")) {
        const thumbUrl =
          videoData.thumbnail ||
          videoData.poster ||
          videoData.thumbnailUrl ||
          payload.image ||
          videoUrl;

        items.push({
          id: `${postUrn}_video_1`,
          type: "video",
          thumbnailToken: createMediaToken(thumbUrl, "image", `${postUrn}_thumb_1.jpg`),
          mediaToken: createMediaToken(videoUrl, "video", `${postUrn}_video_1.mp4`),
          filename: `${postUrn}_video_1.mp4`,
          caption: typeof caption === "string" ? caption.slice(0, 300) : undefined,
          _internalUrl: videoUrl,
          _internalThumbnailUrl: thumbUrl,
        });
      }
    }

    // 2. Check for Images, Documents, & Carousels
    const imagesList =
      payload.images ||
      payload.carousel ||
      payload.documents ||
      payload.documentImages ||
      payload.photos ||
      (payload.media?.images ? payload.media.images : null) ||
      (payload.media?.type === "image" ? [payload.media] : null) ||
      (payload.image ? [payload.image] : null) ||
      (payload.imageUrl ? [payload.imageUrl] : null) ||
      (payload.article?.imageUrl ? [payload.article.imageUrl] : null);

    if (Array.isArray(imagesList)) {
      imagesList.forEach((entry: any, idx: number) => {
        let imgUrl: string | undefined;
        let width: number | undefined;
        let height: number | undefined;

        if (typeof entry === "string" && entry.startsWith("http")) {
          imgUrl = entry;
        } else if (typeof entry === "object" && entry !== null) {
          imgUrl =
            entry.url ||
            entry.imageUrl ||
            entry.src ||
            entry.downloadUrl ||
            entry.original ||
            entry.link;
          width = entry.width || entry.dimensions?.width;
          height = entry.height || entry.dimensions?.height;
        }

        // Avoid generic static placeholder logos
        if (imgUrl && typeof imgUrl === "string" && imgUrl.startsWith("http") && !imgUrl.includes("static.licdn.com")) {
          items.push({
            id: `${postUrn}_img_${idx + 1}`,
            type: "image",
            width,
            height,
            thumbnailToken: createMediaToken(imgUrl, "image", `${postUrn}_thumb_${idx + 1}.jpg`),
            mediaToken: createMediaToken(imgUrl, "image", `${postUrn}_${idx + 1}.jpg`),
            filename: `${postUrn}_${idx + 1}.jpg`,
            caption: typeof caption === "string" ? caption.slice(0, 300) : undefined,
            _internalUrl: imgUrl,
            _internalThumbnailUrl: imgUrl,
          });
        }
      });
    }

    if (items.length === 0) {
      return null;
    }

    return {
      success: true,
      postUrl,
      shortcode: postUrn,
      author,
      caption: typeof caption === "string" ? caption : undefined,
      items,
      itemCount: items.length,
    };
  }

  /**
   * Direct high-fidelity extractor for public LinkedIn posts, document carousels, images, and videos
   */
  private async resolveViaDirectPage(postUrl: string, postUrn: string, defaultUsername?: string): Promise<ResolveResult | null> {
    try {
      const res = await fetch(postUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (!res.ok) return null;
      let html = await res.text();

      // Decode common HTML entities
      html = html
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");

      // Extract Post Title and Author Name
      const title = (html.match(/<title>([^<]+)<\/title>/i) || [])[1] || "";
      let authorName = defaultUsername || "LinkedIn Creator";
      let caption = "";

      if (title.includes("posted on the topic") || title.includes("on LinkedIn")) {
        const parts = title.split(/posted on the topic|on LinkedIn/i)[0].split("|");
        if (parts.length >= 2) {
          authorName = parts[parts.length - 1].trim();
        }
      }

      // Extract description / commentary
      const descMatch =
        html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
        html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
      if (descMatch && descMatch[1]) {
        caption = descMatch[1].trim();
      }

      // Extract author avatar
      const avatarMatches = [...html.matchAll(/https:\/\/media\.licdn\.com\/dms\/image\/[^\s"'<>\\]+profile-displayphoto[^\s"'<>\\]+/g)].map((m) => m[0]);
      const avatarUrl = avatarMatches.length > 0 ? avatarMatches[0] : undefined;

      const author: PostAuthor = {
        username: defaultUsername || authorName.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
        fullName: authorName,
        avatarUrl,
      };

      const items: MediaItem[] = [];

      // 1. Check for Document Carousel Slides (feedshare-document-cover-images)
      const docMatches = [...html.matchAll(/https:\/\/media\.licdn\.com\/dms\/image\/[^\s"'<>\\]+feedshare-document-cover-images[^\s"'<>\\]+/g)].map((m) => m[0]);
      const uniqueDocSlides = Array.from(new Set(docMatches));

      if (uniqueDocSlides.length > 0) {
        uniqueDocSlides.forEach((slideUrl, idx) => {
          items.push({
            id: `${postUrn}_slide_${idx + 1}`,
            type: "image",
            thumbnailToken: createMediaToken(slideUrl, "image", `${postUrn}_thumb_${idx + 1}.jpg`),
            mediaToken: createMediaToken(slideUrl, "image", `${postUrn}_slide_${idx + 1}.jpg`),
            filename: `${postUrn}_slide_${idx + 1}.jpg`,
            caption: caption ? caption.slice(0, 300) : undefined,
            _internalUrl: slideUrl,
            _internalThumbnailUrl: slideUrl,
          });
        });
      }

      // 2. Check for Video Playlists or MP4 files
      const videoMatches = [
        ...html.matchAll(/https:\/\/dms\.licdn\.com\/playlist\/[^\s"'<>\\]+/g),
        ...html.matchAll(/https:\/\/[a-zA-Z0-9.-]*licdn\.com\/[^\s"'<>\\]+feedshare-video[^\s"'<>\\]+/g),
      ].map((m) => m[0]);
      const uniqueVideos = Array.from(new Set(videoMatches));

      if (uniqueVideos.length > 0) {
        uniqueVideos.forEach((vidUrl, idx) => {
          const thumbUrl = items[0]?._internalUrl || avatarUrl || vidUrl;
          items.push({
            id: `${postUrn}_video_${idx + 1}`,
            type: "video",
            thumbnailToken: createMediaToken(thumbUrl, "image", `${postUrn}_video_thumb_${idx + 1}.jpg`),
            mediaToken: createMediaToken(vidUrl, "video", `${postUrn}_video_${idx + 1}.mp4`),
            filename: `${postUrn}_video_${idx + 1}.mp4`,
            caption: caption ? caption.slice(0, 300) : undefined,
            _internalUrl: vidUrl,
            _internalThumbnailUrl: thumbUrl,
          });
        });
      }

      // 3. Check for Post Images (feedshare-image-high-res or feedshare-shrink) if no doc slides or videos
      if (items.length === 0) {
        const imageMatches = [...html.matchAll(/https:\/\/media\.licdn\.com\/dms\/image\/[^\s"'<>\\]+feedshare-image[^\s"'<>\\]+/g)].map((m) => m[0]);
        const uniqueImages = Array.from(new Set(imageMatches));

        uniqueImages.forEach((imgUrl, idx) => {
          if (!imgUrl.includes("static.licdn.com")) {
            items.push({
              id: `${postUrn}_img_${idx + 1}`,
              type: "image",
              thumbnailToken: createMediaToken(imgUrl, "image", `${postUrn}_thumb_${idx + 1}.jpg`),
              mediaToken: createMediaToken(imgUrl, "image", `${postUrn}_${idx + 1}.jpg`),
              filename: `${postUrn}_${idx + 1}.jpg`,
              caption: caption ? caption.slice(0, 300) : undefined,
              _internalUrl: imgUrl,
              _internalThumbnailUrl: imgUrl,
            });
          }
        });
      }

      // 4. Fallback to OpenGraph image (only if not a static placeholder logo)
      if (items.length === 0) {
        const ogImageMatch =
          html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
          html.match(/<meta\s+name=["']image["']\s+content=["']([^"']+)["']/i);

        if (ogImageMatch && ogImageMatch[1] && !ogImageMatch[1].includes("static.licdn.com")) {
          const imgUrl = ogImageMatch[1];
          items.push({
            id: `${postUrn}_1`,
            type: "image",
            thumbnailToken: createMediaToken(imgUrl, "image", `${postUrn}_thumb_1.jpg`),
            mediaToken: createMediaToken(imgUrl, "image", `${postUrn}_1.jpg`),
            filename: `${postUrn}_1.jpg`,
            caption: caption || undefined,
            _internalUrl: imgUrl,
            _internalThumbnailUrl: imgUrl,
          });
        }
      }

      if (items.length === 0) {
        return null;
      }

      return {
        success: true,
        postUrl,
        shortcode: postUrn,
        author,
        caption: caption || undefined,
        items,
        itemCount: items.length,
      };
    } catch (err) {
      console.warn("LinkedIn Direct Page resolution error:", err);
      return null;
    }
  }
}

export const linkedInResolver = new LinkedInResolver();

