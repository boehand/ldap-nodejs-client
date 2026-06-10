# LDAP UI

A modern web-based LDAP directory editor built with Node.js and Vue.js.

## Features

- **Tree Navigation** - Browse your directory structure in a sidebar
- **Full CRUD** - Create, read, update, and delete LDAP entries
- **Search** - Simple keyword search and advanced LDAP filter syntax
- **Schema Aware** - Shows available object classes and attributes
- **Secure Sessions** - AES-256-GCM encrypted credentials, HttpOnly cookies
- **Connection Pooling** - Fast LDAP operations via persistent connections

## Installation

### npm (recommended)

```bash
npm install ldap-nodejs-client
cd node_modules/ldap-nodejs-client
npm install
npm run build
npm start
```

The server starts on `http://localhost:5000` and serves both the API and the frontend.

### From source

```bash
git clone https://github.com/boehand/ldap-nodejs-client.git
cd ldap-nodejs-client
npm install
npm run build
npm start
```

### Docker

```bash
docker build -t ldap-ui .
docker run -p 5000:5000 \
  -e LDAP_URL=ldap://your-server:389 \
  -e BASE_DN=dc=example,dc=org \
  -e SESSION_SECRET=your-secret-key \
  ldap-ui
```

## Development

Requires **Node.js 20+**.

```bash
git clone https://github.com/boehand/ldap-nodejs-client.git
cd ldap-nodejs-client
npm install

# Start backend and frontend in parallel
npm run dev

# Or start them separately:
npm run dev:backend    # http://localhost:5000
npm run dev:frontend   # http://localhost:5173 (proxies API to backend)
```

Open `http://localhost:5173` in your browser.

### Commands

```bash
npm run dev              # Start backend + frontend (parallel)
npm run build            # Build both packages
npm start                # Run production server
npm test                 # Run all tests
npm run lint             # Lint all packages
npm run type-check       # TypeScript check
```

### Demo LDAP Server

The `demo-ldap/` directory contains a Docker-based OpenLDAP server with sample data:

```bash
cd demo-ldap
make run
```

See [demo-ldap/README.md](demo-ldap/README.md) for login credentials.

## Configuration

### Backend environment variables

Create `packages/backend/.env` or set environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `LDAP_URL` | `ldap://localhost:389` | LDAP server URL |
| `BASE_DN` | `dc=example,dc=org` | Base DN for searches |
| `LOGIN_ATTR` | `uid` | Attribute used for simple username login |
| `HOST` | `127.0.0.1` | Server bind address |
| `PORT` | `5000` | Server port |
| `SESSION_SECRET` | (generated) | Secret for session encryption (set in production) |
| `SESSION_TTL` | `86400000` | Session lifetime in ms (default 24h) |
| `LOG_LEVEL` | `info` | Log level: trace, debug, info, warn, error, fatal |
| `NODE_ENV` | `development` | Set to `production` for hardened defaults |

### Frontend environment variables

Create `packages/frontend/.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE` | `/api` | Backend API base path |
| `VITE_DEFAULT_LDAP_URL` | `ldap://localhost:389` | Default URL shown on login page |
| `VITE_APP_TITLE` | `LDAP UI` | Browser title |

## Usage

### Login

- **LDAP Server URL**: `ldap://your-server:389` or `ldaps://your-server:636` for TLS
- **Username**: Simple name (e.g. `admin`) or full DN (e.g. `cn=admin,dc=example,dc=org`)
- **Password**: Your LDAP password

### Editing entries

1. Select an entry in the tree sidebar
2. Modify attribute values directly in the form
3. Click **Add attribute...** to add optional attributes allowed by the entry's object classes
4. Click **Submit** to save changes, **Reset** to discard

### Searching

- **Simple**: Type a keyword to search across common attributes
- **Advanced**: Use LDAP filter syntax, e.g. `(cn=john*)` or `(mail=*@example.com)`

## API

All endpoints require authentication via session cookie. Responses follow the format `{ success, data, error }`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login with LDAP credentials |
| `POST` | `/api/auth/logout` | Logout and clear session |
| `GET` | `/api/auth/whoami` | Current authenticated user |
| `GET` | `/api/tree/root` | Root DSE and naming contexts |
| `GET` | `/api/tree/:baseDn` | Directory tree children |
| `GET` | `/api/entry/:dn` | Get entry attributes |
| `POST` | `/api/entry/:parentDn` | Create new entry |
| `PUT` | `/api/entry/:dn` | Modify entry attributes |
| `DELETE` | `/api/entry/:dn` | Delete entry |
| `POST` | `/api/entry/:dn/rename` | Rename entry (modify RDN) |
| `POST` | `/api/entry/:dn/change-password` | Change user password |
| `GET` | `/api/search?baseDn=...&q=...` | Simple search |
| `POST` | `/api/search/advanced` | Advanced search with LDAP filter |
| `GET` | `/api/schema` | Full LDAP schema |

## Architecture

```
ldap-nodejs-client/
├── packages/
│   ├── backend/             Node.js + Fastify REST API
│   │   ├── src/api/         Routes and middleware
│   │   ├── src/ldap/        LDAP client with connection pooling
│   │   └── src/utils/       Config, logging, crypto, errors
│   │
│   └── frontend/            Vue 3 single-page application
│       ├── src/components/  UI components (tree, editor, dialogs)
│       ├── src/api/         API client wrapper
│       └── src/views/       Login and main layout
│
├── demo-ldap/               Demo OpenLDAP server (Docker)
└── scripts/                 Build and dev helper scripts
```

**Backend**: Fastify, ldapjs, Pino, TypeScript
**Frontend**: Vue 3, Vite, TypeScript

## Security

- Passwords are encrypted in the session with AES-256-GCM and PBKDF2 key derivation
- Sessions use HttpOnly cookies with Secure flag in production
- LDAP server permissions are respected — the UI shows only what the bound user can access
- For production: deploy behind a TLS reverse proxy and set a strong `SESSION_SECRET`

## Compatibility

Works with any LDAPv3-compatible server:
- OpenLDAP
- 389 Directory Server
- Active Directory
- [node-red-contrib-ldap-server](https://github.com/boehand/node-red-contrib-ldap-server)

Requires a modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+).

## License

GPL-3.0

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

Issues and feature requests: [GitHub Issues](https://github.com/boehand/ldap-nodejs-client/issues)
