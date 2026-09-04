export type ResolverErrorCode =
  | "UNSUPPORTED_URL"
  | "PRIVATE_OR_GATED"
  | "NOT_FOUND"
  | "RESOLVER_FAILED"
  | "RATE_LIMITED";

export type MediaType = "image" | "video";

export interface MediaItem {
  id: string;
  type: MediaType;
  width?: number;
  height?: number;
  thumbnailToken: string;
  mediaToken: string;
  caption?: string;
  filename: string;
  filesizeApprox?: number;
  duration?: number;
  // internal server-only fields used during resolution before tokenization
  _internalUrl?: string;
  _internalThumbnailUrl?: string;
}

export interface PostAuthor {
  username: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface ResolveSuccess {
  success: true;
  postUrl: string;
  shortcode: string;
  author?: PostAuthor;
  caption?: string;
  items: MediaItem[];
  itemCount: number;
}

export interface ResolveError {
  success: false;
  postUrl: string;
  error: {
    code: ResolverErrorCode;
    message: string;
  };
}

export type ResolveResult = ResolveSuccess | ResolveError;

export interface MediaResolver {
  resolve(url: string): Promise<ResolveResult>;
}
