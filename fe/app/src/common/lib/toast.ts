// Re-export the platform toast so every layer (incl. client folders,
// which resolve "@" to fe/app/src) shares one seam. Metro resolves
// platform/toast.native.ts on RN — sonner never reaches native code.
export { toast } from "@/platform/toast";
