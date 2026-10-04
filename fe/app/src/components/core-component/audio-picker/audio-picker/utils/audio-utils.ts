/**
 * Formats time in seconds to MM:SS format.
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Checks if a file is a valid audio type.
 */
export function isValidAudioFile(file: File, allowedTypes: string[] = ["audio/mpeg", "audio/wav", "audio/ogg"]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Validates file size.
 */
export function isValidFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeInBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}
