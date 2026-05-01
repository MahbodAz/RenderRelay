# Render WebSocket Relay

A GitHub-ready Render Web Service that proxies HTTP and WebSocket traffic to an upstream HTTPS/WebSocket server.

## Project files

```txt
.
├── server.js
├── package.json
├── render.yaml
├── .env.example
├── .gitignore
└── LICENSE
```

## Environment variables

| Name | Example | Notes |
|---|---|---|
| `TARGET_DOMAIN` | `https://your-vps-domain.com` | Your upstream server. Do not add a trailing slash. |
| `RELAY_PATH` | `/prices` | Only this path is forwarded. Use the same path in your client and upstream. |
| `UPSTREAM_TLS_VERIFY` | `true` | Use `false` only for self-signed upstream TLS. |
| `PORT` | `10000` | Render sets this automatically. |

## Deploy to Render from GitHub

1. Create a new GitHub repository.
2. Upload these files to the root of the repo.
3. Go to Render → **New** → **Web Service**.
4. Connect your GitHub repository.
5. Use these settings:

```txt
Runtime: Node
Build Command: npm install
Start Command: npm start
```

6. Add environment variables:

```txt
TARGET_DOMAIN=https://your-vps-domain.com
RELAY_PATH=/prices
UPSTREAM_TLS_VERIFY=true
```

7. Deploy.

## Test

Health check:

```bash
curl -I https://your-app.onrender.com/healthz
```

Relay path:

```bash
curl -vkI https://your-app.onrender.com/prices
```

## VLESS/WebSocket example

Your upstream inbound and your client must use the same WebSocket path.

```txt
Address: your-app.onrender.com
Port: 443
Security: TLS
SNI: your-app.onrender.com
Transport: WebSocket
Host: your-app.onrender.com
Path: /prices
```

Your upstream/VPS inbound should be something like:

```txt
Protocol: VLESS
Security: TLS
Transport: WebSocket
Path: /prices
```
