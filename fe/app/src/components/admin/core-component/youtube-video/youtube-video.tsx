"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";
import { getYouTubeId, getYouTubeThumbnail, buildYouTubeEmbedUrl } from "./utils/video-utils";
import { assetUrl } from "@/platform/asset";
interface YouTubeVideoProps {
  /** Video ID or full YouTube URL */
  src: string;
  /** Optional custom thumbnail URL. If not provided, fetch from YouTube. */
  thumbnail?: string;
  /** Accessibility title for the iframe */
  title?: string;
  /** Start time in seconds */
  startTime?: number;
  /** End time in seconds */
  endTime?: number;
  /** Whether to start playing immediately (browser policies may block without interaction) */
  autoplay?: boolean;
  /** Additional container classes */
  className?: string;
}

export const YouTubeVideo = ({
  src,
  thumbnail,
  title = "YouTube Video Player",
  startTime,
  endTime,
  autoplay = false,
  className,
}: YouTubeVideoProps) => {
  const [isPlaying, setIsPlaying] = React.useState(autoplay);
  const videoId = React.useMemo(() => getYouTubeId(src), [src]);

  const resolvedThumbnail = React.useMemo(() => {
    if (thumbnail) return thumbnail;
    if (videoId) return getYouTubeThumbnail(videoId);
    return null;
  }, [thumbnail, videoId]);

  const embedUrl = React.useMemo(() => {
    if (!videoId) return "";
    return buildYouTubeEmbedUrl(videoId, {
      start: startTime,
      end: endTime,
      autoplay: true, // Force autoplay once the iframe is rendered (post-click)
    });
  }, [videoId, startTime, endTime]);

  if (!videoId) {
    return (
      <div className="aspect-video w-full flex items-center justify-center bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
        <p className="text-sm font-medium text-slate-500 italic">Invalid YouTube URL or Video ID</p>
      </div>
    );
  }

  return (
    <div className={cn("relative group aspect-video w-full overflow-hidden", "app-video-container rounded-lg overflow-hidden", className)}>
      {!isPlaying ? (
        <div 
          className="relative w-full h-full cursor-pointer" 
          onClick={() => setIsPlaying(true)}
        >
          {/* Thumbnail */}
          {resolvedThumbnail ? (
            <img 
              src={assetUrl(resolvedThumbnail)} 
              alt={title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => {
                // If maxresdefault fails (some videos don't have it), fallback to hqdefault
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('hqdefault')) {
                  target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                }
              }}
            />
          ) : (
            <div className="w-full h-full bg-slate-900" />
          )}

          {/* Overlay & Play Button */}
          <div className={cn("absolute inset-0 flex items-center justify-center transition-all duration-300", "app-video-overlay")}>
            <div className={cn(
              "w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-full transition-all duration-300 transform group-hover:scale-110 group-active:scale-95 shadow-2xl",
              "app-video-play-button rounded-full"
            )}>
              <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1.5" />
            </div>
          </div>
          
          {/* Glassy Title Bar (optional subtle touch) */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <h3 className="text-white text-sm font-semibold truncate px-2">{title}</h3>
          </div>
        </div>
      ) : (
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-none bg-black"
        />
      )}
    </div>
  );
};
