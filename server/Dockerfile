# ReviewLens API (Express). Build from the repository root:
#   docker build -f server/Dockerfile -t reviewlens-server .
FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production

# Install only the server workspace's production dependencies (uses the shared lockfile).
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci --workspace server --omit=dev --ignore-scripts && npm cache clean --force

COPY server/src server/src

# The JSON cache lives here; mount a volume so it survives container restarts.
RUN mkdir -p server/data && chown -R node:node server/data
USER node

WORKDIR /app/server
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3001) + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/index.js"]
