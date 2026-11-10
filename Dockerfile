# Runtime-only image. CI runs `npm run build`; this image only copies the
# Vite output and the dependency-free Node server.
FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:26-slim

ENV NODE_ENV=production \
    PORT=3000 \
    TZ=Europe/Oslo \
    STATIC_DIR=/app/dist

WORKDIR /app

COPY --chown=nonroot:nonroot dist ./dist
COPY --chown=nonroot:nonroot server/server.mjs ./server/server.mjs

USER nonroot
EXPOSE 3000

CMD ["server/server.mjs"]
