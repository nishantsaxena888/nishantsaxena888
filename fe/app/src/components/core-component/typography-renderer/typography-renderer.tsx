import { cn } from "@/lib/utils";

interface TypographyRendererProps {
  content: string;
  className?: string;
}

/**
 * TypographyRenderer
 * A simple template engine for rendering rich text with support for:
 * - **Bold** using **text**
 * - *Italic* using *text*
 * - [Links](url_or_path) using [label](target)
 * - Highlights using ==text==
 */
export const TypographyRenderer = ({
  content,
  className,
}: TypographyRendererProps) => {
  if (!content) return null;

  // Regex to match custom template syntax {{label||type||target}}
  const regex = /(\{\{.*?\}\})/g;

  const parts = content.split(regex).filter(Boolean);

  const renderPart = (part: string, index: number) => {
    if (part.startsWith("{{") && part.endsWith("}}")) {
      const rawContent = part.slice(2, -2);
      const [label, type, target] = rawContent.split("||");

      switch (type) {
        case "l": // Link
          const isExternal =
            target?.startsWith("http") || target?.startsWith("mailto:");

          if (isExternal) {
            return (
              <a
                key={index}
                href={target}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 font-semibold hover:underline transition-all decoration-indigo-300 inline-block mx-1"
              >
                {label}
              </a>
            );
          }

          return (
            <a
              key={index}
              href={target || "/"}
              className="text-indigo-600 font-semibold hover:underline transition-all decoration-indigo-300 inline-block mx-1"
            >
              {label}
            </a>
          );

        case "b": // Bold
          return (
            <strong key={index} className="font-bold text-slate-900 mx-0.5">
              {label}
            </strong>
          );

        case "i": // Italic
          return (
            <em key={index} className="italic mx-0.5">
              {label}
            </em>
          );

        case "h": // Highlight
          return (
            <mark
              key={index}
              className="bg-yellow-100 text-yellow-900 px-1 rounded mx-0.5"
            >
              {label}
            </mark>
          );

        case "br": // Line Break
          return <br key={index} />;

        default:
          return <span key={index}>{label}</span>;
      }
    }

    // Plain text
    return <span key={index}>{part}</span>;
  };

  return (
    <p className={cn("text-sm text-slate-600 leading-relaxed", className)}>
      {parts.map((part, index) => renderPart(part, index))}
    </p>
  );
};
