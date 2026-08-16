const REPLY_PREFIX = "[[elloot-reply:";
const REPLY_SUFFIX = "]]";

export type ReplyMeta = {
  id: string;
  name?: string;
  snippet?: string;
};

export function encodeReplyBody(reply: ReplyMeta, body: string) {
  const name = (reply.name ?? "").replace(/[|\]]/g, " ").trim().slice(0, 40);
  const snippet = (reply.snippet ?? "")
    .replace(/\s+/g, " ")
    .replace(/[|\]]/g, " ")
    .trim()
    .slice(0, 80);
  return `${REPLY_PREFIX}${reply.id}|${name}|${snippet}${REPLY_SUFFIX}\n${body}`;
}

export function decodeMessageBody(raw: string): {
  reply: ReplyMeta | null;
  body: string;
} {
  if (!raw.startsWith(REPLY_PREFIX)) {
    return { reply: null, body: raw };
  }
  const close = raw.indexOf(REPLY_SUFFIX);
  if (close < 0) return { reply: null, body: raw };
  const payload = raw.slice(REPLY_PREFIX.length, close);
  const [id, name, snippet] = payload.split("|");
  if (!id) return { reply: null, body: raw };
  const rest = raw.slice(close + REPLY_SUFFIX.length).replace(/^\n/, "");
  return {
    reply: {
      id,
      name: name || undefined,
      snippet: snippet || undefined,
    },
    body: rest,
  };
}

export function previewMessageBody(raw: string) {
  return decodeMessageBody(raw).body;
}
