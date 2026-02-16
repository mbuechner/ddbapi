FROM node:25-alpine
LABEL maintainer="Michael Büchner <m.buechner@dnb.de>"

WORKDIR /usr/src/app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Create non-root user and set ownership
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /usr/src/app

USER appuser
ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "server.js"]
