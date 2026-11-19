# ReviewLens frontend: build the React app, then serve it with nginx. Build from the repository root:
#   docker build -f client/Dockerfile -t reviewlens-client .
FROM node:24-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci --workspace client --ignore-scripts

COPY client client
# Leave empty to call the API on the same origin (nginx proxies /api to the server container).
# Set it to the backend's public URL when the frontend is deployed on its own.
ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build --workspace client

FROM nginx:1.27-alpine
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 80
