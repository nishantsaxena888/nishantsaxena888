export interface GalleryFile {
  id: string;
  name: string;
  url: string;
  type: "image" | "pdf" | "doc" | "other";
}

export type GalleryStyle = {
  container: string;
  grid: string;
  item: string;
  itemActive: string;
  selected: string;
  preview: string;
  thumbnail: string;
  iconContainer: string;
  overlay: string;
  actions: string;
  deleteBtn: string;
  dragHandle: string;
  uploader: string;
  emptyState: string;
};

export type StyleProps = {
  [key: string]: GalleryStyle;
};

export const galleryStyles = {
  default: {
    container: "space-y-4",

    grid: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4",

    item: `
      relative group aspect-square rounded-xl
      border border-[#e5e7eb]
      bg-[#ffffff]
      overflow-hidden shadow-sm
      transition-all duration-300 ease-in-out
      hover:shadow-lg hover:-translate-y-1 cursor-pointer
    `,

    itemActive: `
      ring-2 ring-[#6366f1]
      border-[#6366f1]
      z-50 scale-105 shadow-2xl
    `,

    selected: `
      ring-2 ring-[#6366f1]
      border-[#6366f1]
      bg-[#eef2ff]
    `,

    preview: `
      w-full h-full flex items-center justify-center
      bg-[#f8fafc]
    `,

    thumbnail: `
      w-full h-full object-cover
      transition-transform duration-500
      group-hover:scale-110
    `,

    iconContainer: `
      flex flex-col items-center gap-2
      text-[#9ca3af]
    `,

    overlay: `
      absolute inset-0
      bg-gradient-to-t from-black/40 via-transparent to-transparent
      opacity-0 group-hover:opacity-100
      transition-opacity duration-300
      pointer-events-none
    `,

    actions: `
      absolute top-2 right-2 flex gap-1
      opacity-0 group-hover:opacity-100
      transition-all duration-300
      translate-y-[-10px] group-hover:translate-y-0
    `,

    deleteBtn: `
      h-8 w-8 rounded-full
      bg-[#ffffff]
      text-[#dc2626]
      hover:bg-[#dc2626] hover:text-[#ffffff]
      shadow-sm transition-all duration-200
    `,

    dragHandle: `
      absolute top-2 left-2
      h-8 w-8 rounded-full
      bg-[#ffffff]
      text-[#6b7280]
      opacity-0 group-hover:opacity-100
      cursor-grab active:cursor-grabbing
      shadow-sm flex items-center justify-center
      hover:bg-[#f3f4f6]
      transition-all duration-200
    `,

    uploader: `
      relative aspect-square rounded-xl
      border-2 border-dashed border-[#e5e7eb]
      bg-[#f8fafc]

      hover:bg-[#ffffff]
      hover:border-[#6366f1]
      hover:shadow-md

      transition-all duration-300

      flex flex-col items-center justify-center gap-2
      text-[#6b7280]
      hover:text-[#6366f1]

      cursor-pointer
    `,

    emptyState: `
      py-12 border-2 border-dashed border-[#e5e7eb]
      rounded-2xl bg-[#f8fafc]

      flex flex-col items-center justify-center gap-4
      text-[#6b7280]
    `,
  },
};
