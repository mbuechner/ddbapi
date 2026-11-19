FROM node:26-trixie-slim
LABEL maintainer="Michael Büchner <m.buechner@dnb.de>"

WORKDIR /usr/src/app
ARG SOURCE_DATE_EPOCH

# Install the locked production dependencies and record their installed inventory.
COPY package.json package-lock.json ./
RUN <<'BUILD'
set -eu
SCARF_ANALYTICS=false npm ci --omit=dev --no-audit --no-fund --cache /tmp/npm-cache
npm sbom --omit=dev --sbom-format=cyclonedx --cache /tmp/npm-cache > sbom.cdx.json
node <<'NODE'
const fs = require('node:fs');
const path = 'sbom.cdx.json';
const sbom = JSON.parse(fs.readFileSync(path, 'utf8'));
const epoch = process.env.SOURCE_DATE_EPOCH;

delete sbom.serialNumber;
if (epoch) {
    sbom.metadata.timestamp = new Date(Number(epoch) * 1000).toISOString();
} else {
    delete sbom.metadata.timestamp;
}

fs.writeFileSync(path, `${JSON.stringify(sbom, null, 2)}\n`);
NODE
rm -rf /tmp/npm-cache
BUILD

COPY server.js ./
COPY images/ ./images/
COPY public/ ./public/
COPY scripts/ ./scripts/

# Create the non-root account. Debian's useradd uses SOURCE_DATE_EPOCH.
RUN groupadd --system appgroup \
    && useradd --system --gid appgroup --create-home --no-log-init --shell /usr/sbin/nologin appuser \
    && chown -R appuser:appgroup /usr/src/app

USER appuser
ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "server.js"]
