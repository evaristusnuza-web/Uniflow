const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const webRoot = path.resolve(__dirname, "pages");
const apiTarget = new URL(process.env.API_TARGET || "http://127.0.0.1:3000");
const port = Number(process.env.WEB_PORT || 4173);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function proxyApi(request, response, requestUrl) {
  const upstreamPath = requestUrl.pathname.replace(/^\/api(?=\/|$)/, "") || "/";
  const target = new URL(`${upstreamPath}${requestUrl.search}`, apiTarget);
  const transport = target.protocol === "https:" ? require("node:https") : http;
  const upstream = transport.request(
    {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || undefined,
      method: request.method,
      path: `${target.pathname}${target.search}`,
      headers: { ...request.headers, host: target.host },
    },
    (upstreamResponse) => {
      response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
      upstreamResponse.pipe(response);
    },
  );
  upstream.on("error", () => {
    if (!response.headersSent) {
      response.writeHead(502, { "content-type": "application/json; charset=utf-8" });
    }
    response.end(JSON.stringify({ message: "The UniFlow API is unavailable. Start the API and database, then retry." }));
  });
  request.pipe(upstream);
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url || "/", "http://localhost");
  if (requestUrl.pathname === "/api" || requestUrl.pathname.startsWith("/api/")) {
    proxyApi(request, response, requestUrl);
    return;
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { allow: "GET, HEAD" });
    response.end("Method not allowed");
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(requestUrl.pathname);
  } catch {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }
  if (pathname === "/") pathname = "/dashboard/index.html";
  const filePath = path.resolve(webRoot, `.${pathname}`);
  if (filePath !== webRoot && !filePath.startsWith(`${webRoot}${path.sep}`)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Page not found");
      return;
    }
    response.writeHead(200, {
      "content-type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "content-length": stats.size,
      "cache-control": "no-cache",
      "x-content-type-options": "nosniff",
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    fs.createReadStream(filePath).pipe(response);
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`UniFlow web preview: http://0.0.0.0:${port}`);
  console.log(`API proxy: /api -> ${apiTarget.origin}`);
});
