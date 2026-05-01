import express from "express";
import http from "http";
import httpProxy from "http-proxy";

const PORT = Number(process.env.PORT || 10000);
const TARGET_DOMAIN = normalizeTarget(process.env.TARGET_DOMAIN);
const RELAY_PATH = normalizePath(process.env.RELAY_PATH || "/");

if (!TARGET_DOMAIN) {
  console.warn("[relay] TARGET_DOMAIN is not set. Set it in Render Environment variables.");
}

const app = express();
app.disable("x-powered-by");

const proxy = httpProxy.createProxyServer({
  target: TARGET_DOMAIN,
  changeOrigin: true,
  ws: true,
  xfwd: true,
  secure: process.env.UPSTREAM_TLS_VERIFY !== "false"
});

proxy.on("error", (err, req, res) => {
  console.error("[relay] proxy error:", err.message);

  if (res && !res.headersSent) {
    res.writeHead(502, { "content-type": "text/plain" });
  }

  if (res && !res.destroyed) {
    res.end("Bad Gateway: Relay Failed");
  }
});

app.get("/healthz", (_req, res) => {
  res.status(200).type("text/plain").send("ok");
});

app.use((req, res) => {
  if (!TARGET_DOMAIN) {
    return res.status(500).type("text/plain").send("TARGET_DOMAIN is not set");
  }

  if (!pathAllowed(req.url)) {
    return res.status(404).type("text/plain").send("Not Found");
  }

  proxy.web(req, res);
});

const server = http.createServer(app);

server.on("upgrade", (req, socket, head) => {
  if (!TARGET_DOMAIN || !pathAllowed(req.url || "/")) {
    socket.destroy();
    return;
  }

  proxy.ws(req, socket, head);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[relay] listening on 0.0.0.0:${PORT}`);
  console.log(`[relay] target: ${TARGET_DOMAIN || "not set"}`);
  console.log(`[relay] path: ${RELAY_PATH}`);
});

function normalizeTarget(value) {
  if (!value) return "";
  return value.replace(/\/+$/, "");
}

function normalizePath(value) {
  if (!value || value === "*") return "/";
  const withSlash = value.startsWith("/") ? value : `/${value}`;
  return withSlash.replace(/\/+$/, "") || "/";
}

function pathAllowed(url) {
  if (RELAY_PATH === "/") return true;
  return url === RELAY_PATH || url.startsWith(`${RELAY_PATH}/`);
}
