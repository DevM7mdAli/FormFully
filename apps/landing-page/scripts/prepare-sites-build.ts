import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root: string = process.cwd();
const serverDir = resolve(root, "dist", "server");
const metadataDir = resolve(root, "dist", ".openai");

const worker = `const BASE_PATH = "/FormFully";

function assetRequest(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  return new Request(url, request);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let pathname = url.pathname;

    if (pathname === BASE_PATH || pathname === BASE_PATH + "/") {
      pathname = "/index.html";
    } else if (pathname.startsWith(BASE_PATH + "/")) {
      pathname = pathname.slice(BASE_PATH.length);
    } else if (pathname === "/") {
      pathname = "/index.html";
    }

    let response = await env.ASSETS.fetch(assetRequest(request, pathname));
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");
    if (response.status === 404 && request.method === "GET" && acceptsHtml) {
      response = await env.ASSETS.fetch(assetRequest(request, "/index.html"));
    }
    return response;
  },
};
`;

await mkdir(serverDir, { recursive: true });
await mkdir(metadataDir, { recursive: true });
await writeFile(resolve(serverDir, "index.js"), worker);
await copyFile(
  resolve(root, ".openai", "hosting.json"),
  resolve(metadataDir, "hosting.json"),
);
