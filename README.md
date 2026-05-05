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

Open `http://localhost:8080` to view the Swagger UI.

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
- If `npm start` fails, run `npm ci` instead of `npm install` and check that port `8080` is free.
- If external OpenAPI URLs fail to load in the browser, the target server may block cross-origin requests (CORS).
