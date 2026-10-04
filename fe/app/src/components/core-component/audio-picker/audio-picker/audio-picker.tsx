"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Play, Pause, Volume2, VolumeX, Upload, Link2, X, Music, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { formatTime, isValidAudioFile, isValidFileSize } from "./utils/audio-utils";

interface AudioPickerProps {
  value?: string | File | null;
  onChange?: (val: string | File | null) => void;
  className?: string;
  maxSizeMB?: number;
}

export const AudioPicker = ({
  value,
  onChange,
  className,
  maxSizeMB = 10,
}: AudioPickerProps) => {
  const [mode, setMode] = React.useState<"upload" | "url">("upload");
  const [url, setUrl] = React.useState("");
  const [audioFile, setAudioFile] = React.useState<File | null>(null);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [volume, setVolume] = React.useState(1);
  const [isMuted, setIsMuted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isReady, setIsReady] = React.useState(false);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Handle initial value
  React.useEffect(() => {
    if (typeof value === "string" && value) {
      setAudioUrl(value);
      setMode("url");
      setUrl(value);
    } else if (value instanceof File) {
      setAudioFile(value);
      setAudioUrl(URL.createObjectURL(value));
      setMode("upload");
    }
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidAudioFile(file)) {
      setError("Please select a valid audio file (MP3, WAV, OGG).");
      return;
    }

    if (!isValidFileSize(file, maxSizeMB)) {
      setError(`File size exceeds the limit of ${maxSizeMB}MB.`);
      return;
    }

    setError(null);
    setIsReady(false);
    setAudioFile(file);
    const newUrl = URL.createObjectURL(file);
    setAudioUrl(newUrl);
    onChange?.(file);
  };

  const handleUrlSubmit = () => {
    if (!url) return;
    setError(null);
    setIsReady(false);
    setAudioUrl(url);
    onChange?.(url);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setAudioFile(null);
    setAudioUrl(null);
    setUrl("");
    setCurrentTime(0);
    setDuration(0);
    setIsReady(false);
    setError(null);
    onChange?.(null);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(_e => setError("Failed to play audio. check the source."));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsReady(true);
    }
  };

  const handleSeek = (val: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = val[0];
      setCurrentTime(val[0]);
    }
  };

  const handleVolumeChange = (val: number[]) => {
    const newVolume = val[0];
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  return (
    <div className={cn("audio-container", className)}>
      {!audioUrl ? (
        <div className="space-y-4">
          <div className="audio-tab-container">
            <button suppressHydrationWarning
              type="button"
              onClick={() => setMode("upload")}
              className={mode === "upload" ? "audio-tab-active" : "audio-tab-inactive"}
            >
              <Upload className="w-3.5 h-3.5" /> Upload File
            </button>
            <button suppressHydrationWarning
              type="button"
              onClick={() => setMode("url")}
              className={mode === "url" ? "audio-tab-active" : "audio-tab-inactive"}
            >
              <Link2 className="w-3.5 h-3.5" /> Audio URL
            </button>
          </div>

          {mode === "upload" ? (
            <div className="relative group">
              <input suppressHydrationWarning
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="audio-dropzone">
                <div className="audio-dropzone-icon">
                  <Music className="w-7 h-7" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">Choose an audio file</p>
                  <p className="text-xs text-muted-foreground font-medium">MP3, WAV, OGG up to {maxSizeMB}MB</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/audio.mp3"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-11 audio-input"
              />
              <Button onClick={handleUrlSubmit} className="h-11 px-8 font-bold app-button">Add Source</Button>
            </div>
          )}
          {error && <p className="text-xs text-destructive font-bold px-2 flex items-center gap-1.5 animate-in fade-in duration-300">
            <span className="w-1 h-1 rounded-full bg-destructive" /> {error}
          </p>}
        </div>
      ) : (
        <div className="space-y-5 animate-in zoom-in-95 duration-500">
          <div className="flex items-center justify-between bg-background p-1.5 rounded-[var(--audio-radius)] border border-border shadow-sm">
            <div className="flex items-center gap-3.5">
               <div className="w-10 h-10 rounded-[calc(var(--audio-radius)-4px)] bg-primary/10 flex items-center justify-center shadow-inner">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground truncate max-w-[180px]">
                  {audioFile ? audioFile.name : url.split('/').pop() || "Audio Stream"}
                </p>
                <div className="flex items-center gap-2">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black">Audio Loaded</p>
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleReset} 
              className="h-9 w-9 rounded-xl hover:bg-red-50 hover:text-destructive transition-colors"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className={"audio-player flex flex-col gap-4"}>
            <audio
              ref={audioRef}
              src={audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
            />
            
            <div className="flex items-center gap-5">
               <button suppressHydrationWarning
                type="button"
                onClick={togglePlay}
                disabled={!isReady}
                className={"audio-button shadow-sm ring-1 ring-black/5"}
              >
                {!isReady ? (
                  <Loader2 className="w-5 h-5 animate-spin opacity-50" />
                ) : isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-1" />
                )}
              </button>

              <div className="flex-1 space-y-1.5">
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  disabled={!isReady}
                  className="py-1 [&_[role=slider]]:bg-[hsl(var(--audio-slider-bg))] [&_.bg-primary]:bg-[hsl(var(--audio-slider-bg))]"
                />
                <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 tracking-tighter">
                  <span className={cn(isPlaying && "text-primary")}>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 group relative">
                <button suppressHydrationWarning
                  type="button"
                  onClick={() => {
                    const next = !isMuted;
                    setIsMuted(next);
                    if (audioRef.current) audioRef.current.muted = next;
                  }}
                  className="text-muted-foreground hover:text-primary transition-colors p-1"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <div className="w-10 h-32 hidden group-hover:flex flex-col items-center absolute bottom-full left-1/2 -translate-x-1/2 mb-3 p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-zinc-700 animate-in fade-in zoom-in-95 duration-200 z-50">
                   <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="h-full py-0"
                    orientation="vertical"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
