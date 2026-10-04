/**
 * Extracts the YouTube Video ID from various URL formats.
 * Supported formats:
 * - https://www.youtube.com/watch?v=ID
 * - https://youtu.be/ID
 * - https://www.youtube.com/embed/ID
 * - https://www.youtube.com/shorts/ID
 * - https://m.youtube.com/watch?v=ID
 */
export function getYouTubeId(url: string = ""): string | null {
  if (!url) return null;

  // If it's already just an ID (11 chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regex);
  
  return match ? match[1] : null;
}

/**
 * Generates the default high-resolution thumbnail URL for a YouTube video.
 */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

/**
 * Builds the YouTube embed URL with optional parameters.
 */
export function buildYouTubeEmbedUrl(
  videoId: string,
  params: {
    start?: number;
    end?: number;
    autoplay?: boolean;
    mute?: boolean;
    controls?: boolean;
    loop?: boolean;
  } = {}
): string {
  const url = new URL(`https://www.youtube.com/embed/${videoId}`);
  
  if (params.start) url.searchParams.set("start", params.start.toString());
  if (params.end) url.searchParams.set("end", params.end.toString());
  if (params.autoplay) url.searchParams.set("autoplay", "1");
  if (params.mute) url.searchParams.set("mute", "1");
  if (params.controls === false) url.searchParams.set("controls", "0");
  if (params.loop) {
    url.searchParams.set("loop", "1");
    url.searchParams.set("playlist", videoId); // Required for loop
  }
  
  // Add origin for better security if available in production environments
  // url.searchParams.set("origin", window.location.origin);
  
  return url.toString();
}
