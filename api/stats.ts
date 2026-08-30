import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleStats } from "../src/server/handle-stats.js";
import { nodeToWebRequest, webToNodeResponse } from "../src/server/node-http.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const proto = (req.headers["x-forwarded-proto"] as string) || "https";
  const host = req.headers.host || "localhost";
  const request = await nodeToWebRequest(req, `${proto}://${host}`);
  const response = await handleStats(request);
  await webToNodeResponse(response, res);
}
