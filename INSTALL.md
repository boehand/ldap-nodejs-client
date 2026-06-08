# Installation Guide

Complete guide for installing and setting up LDAP UI.

## Table of Contents

1. [Quick Install](#quick-install)
2. [npm Package Installation](#npm-package-installation)
3. [Docker Installation](#docker-installation)
4. [Development Installation](#development-installation)
5. [Configuration](#configuration)
6. [Running](#running)
7. [Troubleshooting](#troubleshooting)

## Quick Install

### Minimum Requirements

- **Node.js** 20.0.0 or higher
- **npm**, **yarn**, or **pnpm** package manager
- **LDAP server** (OpenLDAP, 389 DS, Active Directory, etc.)

### 5-Minute Setup

```bash
# Clone or download repository
git clone https://github.com/boehand/ldap-nodejs-ui.git
cd ldap-nodejs-ui

# Install dependencies (runs setup automatically)
pnpm install

# Start development servers
pnpm dev
```

Open **http://localhost:5173** in your browser.

---

## npm Package Installation

### Option 1: Install as Global CLI

```bash
# Install globally
npm install -g ldap-ui

# Run with default settings
ldap-ui

# Or with custom options
ldap-ui --host 0.0.0.0 --port 3000 --ldap-url ldap://myserver:389
```

### Option 2: Install as Local Dependency

```bash
# Install in project
npm install ldap-ui

# Use in your Node.js app
import { createApp } from '@ldap-ui/backend';

const app = await createApp({
  host: '127.0.0.1',
  port: 5000,
  ldapUrl: 'ldap://localhost:389'
});

await app.listen({ host: '127.0.0.1', port: 5000 });
```

### Option 3: Clone & Install from Source

```bash
# Clone repository
git clone https://github.com/boehand/ldap-nodejs-ui.git
cd ldap-nodejs-ui

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Install CLI globally from local build
npm install -g ./packages/backend
```

---

## Docker Installation

### Prerequisites

- Docker 20.10+
- Docker Compose (optional, for demo with test LDAP)

### Using Official Image

```bash
# Run with your LDAP server
docker run \
  -p 5000:5000 \
  -e LDAP_URL=ldap://your-ldap-server:389 \
  -e BASE_DN=dc=example,dc=org \
  -e SESSION_SECRET=your-random-secret-key \
  ldap-ui:latest
```

### Build Your Own Image

```bash
# Clone repository
git clone https://github.com/boehand/ldap-nodejs-ui.git
cd ldap-nodejs-ui

# Build Docker image
docker build -t my-ldap-ui .

# Run container
docker run \
  -p 5000:5000 \
  -e LDAP_URL=ldap://ldap-server:389 \
  -e BASE_DN=dc=example,dc=org \
  my-ldap-ui
```

### Docker Compose with Demo LDAP

```bash
# Start with local OpenLDAP server for testing
docker-compose up -d

# Access at http://localhost:5000
# Demo user: cn=admin,dc=example,dc=org
# Demo password: admin
```

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  ldap-ui:
    build: .
    ports:
      - "5000:5000"
    environment:
      LDAP_URL: ldap://openldap:389
      BASE_DN: dc=example,dc=org
      SESSION_SECRET: demo-secret-key-change-me
      NODE_ENV: production
    depends_on:
      - openldap

  openldap:
    image: bitnami/openldap:latest
    environment:
      LDAP_ADMIN_USERNAME: admin
      LDAP_ADMIN_PASSWORD: admin
      LDAP_USERS: user1,user2
      LDAP_PASSWORDS: password1,password2
      LDAP_ROOT: dc=example,dc=org
    ports:
      - "389:389"
```

---

## Development Installation

### Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- Git

### Setup Steps

```bash
# 1. Clone repository
git clone https://github.com/boehand/ldap-nodejs-ui.git
cd ldap-nodejs-ui

# 2. Install dependencies (runs automatic setup)
pnpm install

# 3. Configure (optional - interactive setup)
node scripts/setup.js

# 4. Start development servers
pnpm dev

# Backend runs on http://localhost:5000
# Frontend runs on http://localhost:5173
```

### Project Structure

```
ldap-nodejs-ui/
├── packages/
│   ├── backend/          # Node.js REST API
│   │   ├── src/
│   │   ├── dist/         # Built backend
│   │   ├── package.json
│   │   └── .env          # Backend config
│   │
│   └── frontend/         # Vue.js UI
│       ├── src/
│       ├── dist/         # Built frontend
│       ├── package.json
│       └── .env          # Frontend config
│
├── scripts/              # Setup & installation scripts
├── package.json          # Root workspace config
└── README.md             # Project documentation
```

---

## Configuration

### Backend Configuration

Create or edit `packages/backend/.env`:

```env
# LDAP Server Connection
LDAP_URL=ldap://localhost:389
BASE_DN=dc=example,dc=org
LOGIN_ATTR=uid

# Server Settings
HOST=127.0.0.1
PORT=5000
NODE_ENV=production

# Security (IMPORTANT: Change in production!)
SESSION_SECRET=your-secret-key-must-be-32-chars-minimum
SESSION_TTL=86400000  # 24 hours in milliseconds

# Logging
LOG_LEVEL=info  # trace, debug, info, warn, error, fatal
```

**Environment Variables Explained:**

| Variable | Default | Description |
|----------|---------|-------------|
| `LDAP_URL` | `ldap:///` | LDAP server connection URL |
| `BASE_DN` | Auto-detect | Base DN for searches |
| `LOGIN_ATTR` | `uid` | Attribute used for username login |
| `HOST` | `127.0.0.1` | Server listen address |
| `PORT` | `5000` | Server listen port |
| `SESSION_SECRET` | N/A | Session encryption key (REQUIRED in production) |
| `SESSION_TTL` | `86400000` | Session timeout (milliseconds) |
| `NODE_ENV` | `development` | `development` or `production` |
| `LOG_LEVEL` | `info` | Logging verbosity |

### Frontend Configuration

Create or edit `packages/frontend/.env`:

```env
# Backend API endpoint
VITE_API_BASE=/api

# Default LDAP server in login form
VITE_DEFAULT_LDAP_URL=ldap://localhost:389

# App title
VITE_APP_TITLE=LDAP UI
```

### Using Configuration Wizard

Interactive setup that creates `.env` files:

```bash
node scripts/setup.js
```

This will prompt you for:
- LDAP server URL
- Base DN
- Login attribute
- Server host & port
- Session secret
- App title

---

## Running

### Development Mode

```bash
# Terminal 1: Backend
cd packages/backend
pnpm dev

# Terminal 2: Frontend
cd packages/frontend
pnpm dev
```

**Access:** http://localhost:5173

### Production Mode

```bash
# Build both packages
pnpm build

# Backend
cd packages/backend
export NODE_ENV=production
export SESSION_SECRET=your-secure-random-key
node dist/server.js

# Frontend (serve dist/frontend/ with web server)
# Using nginx, Apache, or similar
```

### Docker Production

```bash
docker build -t ldap-ui .
docker run \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e LDAP_URL=ldap://your-server:389 \
  -e BASE_DN=dc=example,dc=org \
  -e SESSION_SECRET=very-secure-random-key \
  ldap-ui
```

### npm Start

```bash
npm install
npm start

# Runs: node packages/backend/dist/server.js
```

---

## Advanced Configuration

### LDAP over SSL/TLS

```env
# For LDAPS (implicit TLS on port 636)
LDAP_URL=ldaps://ldap.example.com:636

# For LDAP with STARTTLS
LDAP_URL=ldap://ldap.example.com:389
# (STARTTLS is auto-enabled for unsecured connections)
```

### Behind Reverse Proxy

If running behind nginx/Apache with TLS:

```env
# Backend
HOST=127.0.0.1
PORT=5000

# Configure your reverse proxy to:
# - Handle TLS/SSL
# - Proxy requests to localhost:5000
# - Set appropriate headers
```

**nginx example:**

```nginx
server {
    listen 443 ssl http2;
    server_name ldap.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Custom Session Store

Currently uses in-memory sessions (ephemeral). For persistence, implement custom session store in `src/api/index.ts`.

---

## Troubleshooting

### Port Already in Use

```bash
# Backend on different port
PORT=3000 pnpm dev:backend

# Frontend on different port
cd packages/frontend
pnpm dev -- --port 5174
```

### LDAP Connection Failed

```bash
# Test LDAP connectivity
ldapsearch -H ldap://your-server:389 -x -b "dc=example,dc=org" -s base

# Check firewall
telnet your-server 389

# Verify URL format
# Should be: ldap://hostname:389 or ldaps://hostname:636
```

### Sessions Not Working

```bash
# Generate new SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Set in .env and restart
SESSION_SECRET=your-new-secret
```

### High Memory Usage

- Reduce `sizeLimit` in search queries (default: 1000)
- Reduce `SESSION_TTL` for faster session cleanup
- Check LDAP server for large result sets

### Build Errors

```bash
# Clear caches
rm -rf node_modules pnpm-lock.yaml
rm -rf packages/backend/dist packages/frontend/dist

# Reinstall
pnpm install

# Rebuild
pnpm build
```

---

## Getting Help

- **Documentation**: See [README.md](README.md) and [QUICKSTART.md](QUICKSTART.md)
- **Issues**: [GitHub Issues](https://github.com/boehand/ldap-nodejs-ui/issues)
- **Discussions**: [GitHub Discussions](https://github.com/boehand/ldap-nodejs-ui/discussions)

---

## Next Steps

After installation:

1. **Configure** your LDAP server connection in `.env`
2. **Login** with your LDAP credentials
3. **Explore** directory structure
4. **Read** [Security Considerations](README.md#security-considerations)
5. **Deploy** to production following best practices

Happy directory editing! 🎉
