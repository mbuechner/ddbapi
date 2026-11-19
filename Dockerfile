FROM node:26-alpine3 AS dependencies

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

FROM alpine:3
LABEL maintainer="Michael Büchner <m.buechner@dnb.de>"
ARG SOURCE_DATE_EPOCH

WORKDIR /usr/src/app
RUN apk upgrade --no-cache \
    && apk add --no-cache libstdc++ libatomic \
    && addgroup -S appgroup \
    && adduser -S -G appgroup appuser \
    && chown appuser:appgroup .

COPY --from=dependencies /usr/local/bin/node /usr/local/bin/node
COPY --from=dependencies /usr/local/LICENSE /usr/local/share/doc/node/LICENSE
COPY --from=dependencies --chown=appuser:appgroup /usr/src/app/ ./

USER appuser
ENV NODE_ENV=production

RUN node --version

EXPOSE 8080

CMD ["node", "server.js"]
