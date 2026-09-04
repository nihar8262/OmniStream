import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { InstagramResolver } from "../instagram";
import { verifyMediaToken } from "../../token";

describe("InstagramResolver Fixture Tests", () => {
  const resolver = new InstagramResolver();

  it("should extract shortcode and normalize Instagram URLs correctly", () => {
    expect(
      resolver.extractShortcode("https://www.instagram.com/p/C31bZ4zO9Xy/?igsh=MWQ1")
    ).toBe("C31bZ4zO9Xy");

    expect(
      resolver.extractShortcode("https://instagram.com/reel/C8_zY71pLmN/")
    ).toBe("C8_zY71pLmN");

    expect(
      resolver.extractShortcode("https://www.instagram.com/share/p/DF992kLxYa/")
    ).toBe("DF992kLxYa");

    expect(
      resolver.normalizeUrl("https://instagram.com/reel/C8_zY71pLmN")
    ).toEqual({
      normalizedUrl: "https://www.instagram.com/reel/C8_zY71pLmN/",
      shortcode: "C8_zY71pLmN",
    });
  });

  it("should parse single image embed HTML correctly", () => {
    const fixturePath = path.join(__dirname, "fixtures", "sample_single_image_embed.html");
    const html = fs.readFileSync(fixturePath, "utf8");
    const result = resolver.parseEmbedHtml(html, "C31bZ4zO9Xy", "https://www.instagram.com/p/C31bZ4zO9Xy/");

    expect(result).not.toBeNull();
    if (!result || !result.success) throw new Error("Expected success");

    expect(result.success).toBe(true);
    expect(result.author?.username).toBe("photography_master");
    expect(result.caption).toContain("Golden hour in the Alps");
    expect(result.items.length).toBe(1);
    expect(result.items[0].type).toBe("image");

    // Check that tokens are valid and non-empty
    const verifiedMedia = verifyMediaToken(result.items[0].mediaToken);
    expect(verifiedMedia).not.toBeNull();
    expect(verifiedMedia?.url).toContain("single_image_highres.jpg");
  });

  it("should parse video reel embed HTML correctly", () => {
    const fixturePath = path.join(__dirname, "fixtures", "sample_video_reel_embed.html");
    const html = fs.readFileSync(fixturePath, "utf8");
    const result = resolver.parseEmbedHtml(html, "C8_zY71pLmN", "https://www.instagram.com/reel/C8_zY71pLmN/");

    expect(result).not.toBeNull();
    if (!result || !result.success) throw new Error("Expected success");

    expect(result.success).toBe(true);
    expect(result.author?.username).toBe("cinematic_creator");
    expect(result.caption).toContain("Morning routine in Tokyo");
    expect(result.items.length).toBe(1);
    expect(result.items[0].type).toBe("video");

    const verifiedMedia = verifyMediaToken(result.items[0].mediaToken);
    expect(verifiedMedia?.url).toContain("reel_video_1080p.mp4");
  });

  it("should detect private or gated posts and return typed error code PRIVATE_OR_GATED", () => {
    const fixturePath = path.join(__dirname, "fixtures", "sample_private_embed.html");
    const html = fs.readFileSync(fixturePath, "utf8");
    const result = resolver.parseEmbedHtml(html, "Privat3Post", "https://www.instagram.com/p/Privat3Post/");

    expect(result).not.toBeNull();
    if (!result || result.success) throw new Error("Expected private error");

    expect(result.success).toBe(false);
    expect(result.error.code).toBe("PRIVATE_OR_GATED");
  });

  it("should parse carousel sidecar media objects correctly", () => {
    const carouselMediaObj = {
      owner: {
        username: "travel_adventures",
        full_name: "World Traveler",
      },
      caption: "5 Best Places in Switzerland 🇨🇭",
      edge_sidecar_to_children: {
        edges: [
          {
            node: {
              is_video: false,
              display_url: "https://scontent.cdninstagram.com/photo_1.jpg",
              dimensions: { width: 1080, height: 1350 },
            },
          },
          {
            node: {
              is_video: true,
              video_url: "https://scontent.cdninstagram.com/video_2.mp4",
              display_url: "https://scontent.cdninstagram.com/thumb_2.jpg",
              dimensions: { width: 1080, height: 1920 },
            },
          },
          {
            node: {
              is_video: false,
              display_url: "https://scontent.cdninstagram.com/photo_3.jpg",
              dimensions: { width: 1080, height: 1080 },
            },
          },
        ],
      },
    };

    const parsed = resolver.extractFromMediaObject(carouselMediaObj, "SwissTrip123");
    expect(parsed).not.toBeNull();
    expect(parsed?.items.length).toBe(3);
    expect(parsed?.items[0].type).toBe("image");
    expect(parsed?.items[1].type).toBe("video");
    expect(parsed?.items[2].type).toBe("image");
    expect(parsed?.author?.username).toBe("travel_adventures");
  });
});
