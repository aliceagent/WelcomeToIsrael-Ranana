import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleAsk } from "../src/server/handle-ask";
import { nodeToWebRequest, webToNodeResponse } from "../src/server/node-http";

export const config = { maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const proto = (req.headers["x-forwarded-proto"] as string) || "https";
  const host = req.headers.host || "localhost";
  const request = await nodeToWebRequest(req, `${proto}://${host}`);
  const response = await handleAsk(request);
  await webToNodeResponse(response, res);
}
