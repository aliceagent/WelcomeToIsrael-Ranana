import type { IncomingMessage, ServerResponse } from "node:http";

export async function nodeToWebRequest(req: IncomingMessage, origin: string): Promise<Request> {
  const host = req.headers.host || "localhost";
  const url = new URL(req.url || "/", origin.includes("://") ? origin : `http://${host}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue;
    headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }
  const method = req.method || "GET";
  if (method === "GET" || method === "HEAD") {
    return new Request(url, { method, headers });
  }
  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? new TextEncoder().encode(chunk) : new Uint8Array(chunk));
  }
  let size = 0;
  for (const chunk of chunks) size += chunk.byteLength;
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new Request(url, { method, headers, body });
}

export async function webToNodeResponse(web: Response, res: ServerResponse): Promise<void> {
  res.statusCode = web.status;
  web.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  if (!web.body) {
    res.end();
    return;
  }
  const reader = web.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (err) {
    reader.releaseLock();
    throw err;
  }
}
