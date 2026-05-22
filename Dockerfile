# Grave Goods — single-stage app image.
# Full node:20 (not slim) so bcrypt's native addon builds without extra apt
# packages. The box has ~860G free, so image size isn't worth a multi-stage
# build's complexity here — simplicity wins.
FROM node:20

WORKDIR /app

# Install workspace deps first so this layer caches unless a manifest changes.
# (NODE_ENV is still unset here, so npm ci installs devDeps — needed to build.)
COPY package.json package-lock.json ./
COPY web/package.json web/package.json
COPY backend/package.json backend/package.json
COPY shared/package.json shared/package.json
RUN npm ci

# Copy source and build all workspaces: shared types -> web/dist -> backend/dist.
COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 4000

# Express serves both /api and the built SPA (web/dist) on this port.
# Migrations + product seed run on boot (see backend/src/index.ts).
CMD ["node", "backend/dist/index.js"]
