[![Docker](https://github.com/mbuechner/ddbapi/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/mbuechner/ddbapi/actions/workflows/docker-publish.yml)

# DDBapi — API Documentation
Documentation of the API of the Deutsche Digitale Bibliothek (DDB). This project serves a customized Swagger UI that can be run as a container or locally.

**Quick Start**
- **Pull image**: `docker pull ghcr.io/mbuechner/ddbapi:latest`
- **Run container**: `docker run -d -p 8080:8080 ghcr.io/mbuechner/ddbapi:latest` then open `http://localhost:8080`.
- **Run locally**:

```bash
npm install
npm start
```

Open `http://localhost:8080` to view the Swagger UI. By default the UI loads the example spec at [example/ddbapi.yml](example/ddbapi.yml).

**Build (local)**
- **Build image**: `docker build -t ddbapi .`
- **Run locally**: `docker run -d -p 8080:8080 ddbapi`

**CI / Registry**
- The repository includes a GitHub Actions workflow that builds and pushes images to GitHub Container Registry (GHCR): [.github/workflows/docker-publish.yml](.github/workflows/docker-publish.yml).
- To manually push to GHCR:

```bash
docker build -t ghcr.io/<owner>/ddbapi:TAG .
echo $CR_PAT | docker login ghcr.io -u <username> --password-stdin
docker push ghcr.io/<owner>/ddbapi:TAG
```

**Important files**
- **Dockerfile**: [Dockerfile](Dockerfile)
- **Server**: [server.js](server.js)
- **Public UI**: [public/index.html](public/index.html)
- **Plugins / scripts**: [scripts/ddb-plugins.js](scripts/ddb-plugins.js)
- **Example OpenAPI**: [example/ddbapi.yml](example/ddbapi.yml)

**Development notes**
- **Node version**: Use Node.js 18+ for best compatibility.
- **Static assets**: The app serves `images/`, `scripts/` and `example/` statically — useful when adding logos or specs.
- **Swagger UI customization**: The API selector and logo are implemented as a Swagger UI plugin in `scripts/ddb-plugins.js`.

**Reverse proxy / client IPs**
- If the server runs behind a reverse proxy (typical in production), the client IP will be provided in the `X-Forwarded-For` header. The app honors these headers by default.
- You can control this with the `TRUST_PROXY` environment variable. Examples:
	- `TRUST_PROXY=true` — trust the proxy (default in this project)
	- `TRUST_PROXY=false` — do not trust proxy headers (use the socket address)
	- `TRUST_PROXY="127.0.0.1/8"` — trust specific proxy addresses or subnets
- With `trust proxy` enabled, `req.ip` will reflect the original client IP and the request-logging will include it.

**Troubleshooting**
- If `npm start` fails, run `npm ci` instead of `npm install` and check that port `8080` is free.
- If external OpenAPI URLs fail to load in the browser, the target server may block cross-origin requests (CORS). In that case run the spec through a proxy or host the spec in this repository under `example/`.

If you want, I can also update the README with explicit GHCR publishing instructions (PAT usage) or add a short section about running the container as a non-root user for Kubernetes.
