"use client";

import {
  useRef,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

/** Remove linhas vazias; mantém no máx. um \\n final para digitar a próxima unidade. */
export function sanitizeAutoStock(raw: string): string {
  const endsWithBreak = /\n$/.test(raw);
  const filled = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (filled.length === 0) return "";
  return endsWithBreak ? `${filled.join("\n")}\n` : filled.join("\n");
}

export function countAutoLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean).length;
}

export function parseAutoStockLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function NumberedStockTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const lineCount = Math.max(value.split("\n").length, 1);
  const gutterRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  function syncScroll() {
    if (gutterRef.current && areaRef.current) {
      gutterRef.current.scrollTop = areaRef.current.scrollTop;
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter") return;
    const el = e.currentTarget;
    const { selectionStart, selectionEnd, value: raw } = el;
    if (selectionStart !== selectionEnd) return;

    const lineStart = raw.lastIndexOf("\n", selectionStart - 1) + 1;
    const lineEndIdx = raw.indexOf("\n", selectionStart);
    const lineEnd = lineEndIdx === -1 ? raw.length : lineEndIdx;
    const currentLine = raw.slice(lineStart, lineEnd);

    if (!currentLine.trim()) {
      e.preventDefault();
    }
  }

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    onChange(sanitizeAutoStock(e.target.value));
  }

  function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    const el = e.currentTarget;
    const pasted = e.clipboardData.getData("text");
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = sanitizeAutoStock(
      el.value.slice(0, start) + pasted + el.value.slice(end),
    );
    onChange(next);
  }

  return (
    <div className="flex max-h-48 min-h-36 overflow-hidden rounded-md border border-input dark:bg-input/30">
      <div
        ref={gutterRef}
        aria-hidden
        className="shrink-0 overflow-hidden border-r border-border/60 bg-muted/20 py-2.5 pr-2 pl-3 text-right font-mono text-xs leading-6 text-muted-foreground select-none"
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i} className="h-6">
            {i + 1}
          </div>
        ))}
      </div>
      <textarea
        ref={areaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onScroll={syncScroll}
        placeholder={placeholder}
        spellCheck={false}
        className="min-h-36 max-h-48 w-full flex-1 resize-none overflow-y-auto bg-transparent py-2.5 pr-3 pl-2 font-mono text-sm leading-6 outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
