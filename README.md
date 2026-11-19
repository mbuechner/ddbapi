[![Docker](https://github.com/mbuechner/ddbapi/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/mbuechner/ddbapi/actions/workflows/docker-publish.yml)

# DDBapi — API Documentation
Documentation of the API of the Deutsche Digitale Bibliothek (DDB). This project serves a customized Swagger UI that can be run as a container or locally.

**Quick Start**
- **Pull image**: `docker pull ghcr.io/mbuechner/ddbapi:latest`
- **Run container**: `docker run -d -p 8080:8080 ghcr.io/mbuechner/ddbapi:latest` then open `http://localhost:8080`.
- **Run locally**:

```bash
npm ci
npm start
```

Use Node.js 26 LTS. Open `http://localhost:8080` to view the Swagger UI.

**Build (local)**
- **Build image**: `docker build -t ddbapi .`
- **Run locally**: `docker run -d -p 8080:8080 ddbapi`

## Container releases

- Stable releases with the [Docker workflow](.github/workflows/docker-publish.yml) queue a run on `master`. For manual runs, choose `master` and optionally set `release_tag`. Builds use the tagged source and Dockerfile.
- Daily at 08:17 Europe/Berlin, rebuild `linux/amd64` on a changed release commit, changed base digest, or missing version tag. Otherwise rescan the published digest.
- HTTP probe → CVE scan (image + SBOM if present) → Cosign → GHCR version tag. The maintained release also gets `latest` and `tagged`.

`CONTAINER_RELEASE_TAG` pins a release instead of the latest stable one. `CONTAINER_HTTP_PATH` overrides `/`.

**Base path / OpenShift route**
- Set `BASE_PATH` if the app is exposed under a path prefix without backend rewrite (example: `BASE_PATH=/app/ddbapi`).
- `BASE_PATH` is normalized automatically, so all of these values are equivalent: `app/ddbapi`, `/app/ddbapi`, `/app/ddbapi/`.
- The app remains available at `/` as well, which keeps compatibility with OpenShift routes using `haproxy.router.openshift.io/rewrite-target: /`.
- Entry URLs without trailing slash are redirected to the canonical slash form (HTTP 308), so both `/app/ddbapi` and `/app/ddbapi/` work reliably.

Examples:

```bash
# No path rewrite at proxy/route
docker run -d -p 8080:8080 -e BASE_PATH=/app/ddbapi ghcr.io/mbuechner/ddbapi:latest

# With OpenShift rewrite-target: / (BASE_PATH can stay unset)
docker run -d -p 8080:8080 ghcr.io/mbuechner/ddbapi:latest
```

**Troubleshooting**
- If `npm start` fails, verify that `npm ci` completed and port `8080` is free.
- If external OpenAPI URLs fail to load in the browser, the target server may block cross-origin requests (CORS).
