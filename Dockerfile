FROM node:20-alpine AS build

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

COPY . .
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev --no-audit --no-fund

COPY --from=build /app/server ./server
COPY --from=build /app/dist ./dist
COPY --from=build /app/seed ./seed

RUN mkdir -p /app/data

EXPOSE 4000
VOLUME ["/app/data"]

CMD ["node", "server/index.js"]
