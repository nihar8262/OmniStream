import { describe, it, expect, vi, beforeEach } from "vitest";
import { linkedInResolver } from "../linkedin";

describe("LinkedInResolver", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects invalid non-LinkedIn URLs", async () => {
    const result = await linkedInResolver.resolve("https://example.com/some-post");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("UNSUPPORTED_URL");
    }
  });

  it("extracts multi-image carousel post from LinkedIn RapidAPI response", () => {
    const sampleLinkedInPayload = {
      data: {
        text: "Excited to share our brand new design system and component library! Check out the slides below.",
        author: {
          name: "Jane Doe",
          username: "janedoe",
          profilePicture: "https://media.licdn.com/dms/image/v2/D4E03AQE_avatar/profile-displayphoto.jpg",
        },
        images: [
          {
            url: "https://media.licdn.com/dms/image/v2/D4E22AQF_img1/feedshare-shrink_800.jpg",
            width: 1080,
            height: 1080,
          },
          {
            url: "https://media.licdn.com/dms/image/v2/D4E22AQF_img2/feedshare-shrink_800.jpg",
            width: 1080,
            height: 1350,
          },
        ],
      },
    };

    const parsed = linkedInResolver.extractMediaFromJson(
      sampleLinkedInPayload,
      "urn_li_activity_7219434359085252608",
      "https://www.linkedin.com/feed/update/urn:li:activity:7219434359085252608/"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.success).toBe(true);
    if (parsed?.success) {
      expect(parsed.items.length).toBe(2);
      expect(parsed.items[0].type).toBe("image");
      expect(parsed.items[1].type).toBe("image");
      expect(parsed.author?.fullName).toBe("Jane Doe");
      expect(parsed.caption).toContain("Excited to share");
      expect(parsed.items[0].mediaToken).toBeDefined();
    }
  });

  it("extracts video post from LinkedIn RapidAPI response", () => {
    const sampleVideoPayload = {
      data: {
        text: "Here is a quick product walkthrough video.",
        author: {
          name: "Tech Solutions",
          username: "tech-solutions",
        },
        video: {
          url: "https://dms.licdn.com/playlist/vid/v2/D4E05AQG_video/mp4-720p-30fp-crf28.mp4",
          thumbnail: "https://media.licdn.com/dms/image/v2/D4E05AQG_thumb/feedshare-shrink.jpg",
        },
      },
    };

    const parsed = linkedInResolver.extractMediaFromJson(
      sampleVideoPayload,
      "urn_li_activity_7219434359085252609",
      "https://www.linkedin.com/feed/update/urn:li:activity:7219434359085252609/"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.success).toBe(true);
    if (parsed?.success) {
      expect(parsed.items.length).toBe(1);
      expect(parsed.items[0].type).toBe("video");
      expect(parsed.items[0].filename).toContain(".mp4");
    }
  });

  it("handles array payload from profile posts endpoint", () => {
    const sampleProfilePosts = {
      data: [
        {
          id: "7479737061047042049",
          urn: "urn:li:activity:7479737061047042049",
          text: "API Important Quick Reference",
          author: {
            name: "Saurabh Dubey",
            username: "saurabhdubeyofficial",
          },
          images: [
            "https://media.licdn.com/dms/image/v2/D561FAQG_img1/feedshare-document-cover-images_480/B56Z/0/1783.jpg",
            "https://media.licdn.com/dms/image/v2/D561FAQG_img2/feedshare-document-cover-images_480/B56Z/1/1783.jpg",
          ],
        },
      ],
    };

    const parsed = linkedInResolver.extractMediaFromJson(
      sampleProfilePosts,
      "li_7479737061047042049",
      "https://www.linkedin.com/posts/saurabhdubeyofficial_api-important-quick-reference-activity-7479737061047042049-Lh04"
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.success).toBe(true);
    if (parsed?.success) {
      expect(parsed.items.length).toBe(2);
      expect(parsed.author?.fullName).toBe("Saurabh Dubey");
    }
  });
});

