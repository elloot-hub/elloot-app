import type { ReactNode } from "react";

/** Inline: **negrito** and *itálico* (bold first). */
function parseInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    if (match[1] != null) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${i}`} className="font-semibold text-foreground">
          {match[1]}
        </strong>,
      );
    } else if (match[2] != null) {
      nodes.push(
        <em key={`${keyPrefix}-i-${i}`} className="italic">
          {match[2]}
        </em>,
      );
    }
    last = match.index + match[0].length;
    i += 1;
  }

  if (last < text.length) {
    nodes.push(text.slice(last));
  }

  return nodes.length > 0 ? nodes : [text];
}

/**
 * Lightweight listing description markup:
 * - `## Título` → heading
 * - `**texto**` → bold
 * - `*texto*` → italic
 */
export function renderListingDescription(text: string): ReactNode {
  if (!text) return null;

  const lines = text.replace(/\r\n/g, "\n").split("\n");

  return lines.map((line, index) => {
    const heading = line.match(/^##\s*(.*)$/);
    if (heading) {
      const title = heading[1] ?? "";
      return (
        <h3
          key={`h-${index}`}
          className="mt-3 mb-1 text-base font-semibold tracking-tight text-foreground first:mt-0 sm:text-lg"
        >
          {title ? parseInline(title, `h${index}`) : "\u00A0"}
        </h3>
      );
    }

    return (
      <span key={`l-${index}`} className="block min-h-[1.25em]">
        {line.length > 0 ? parseInline(line, `l${index}`) : "\u00A0"}
      </span>
    );
  });
}
