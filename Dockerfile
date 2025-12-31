# ------------------------
# Stage 1: Builder
# ------------------------
FROM node:20-bullseye AS builder

# Install required system dependencies
RUN apt-get update && apt-get install -y \
  python3 make g++ gcc postgresql-client \
  && ln -sf python3 /usr/bin/python \
  && rm -rf /var/lib/apt/lists/*

# Set working directory
RUN mkdir -p /usr/src/app && chown -R node:node /usr/src/app
WORKDIR /usr/src/app
USER node

# Copy package files and install dependencies
COPY --chown=node:node package*.json ./
RUN npm ci

# Copy entire project
COPY --chown=node:node . .

# Generate Prisma Client inside container
RUN npx prisma generate

# Build NestJS project
RUN npm run build


# ------------------------
# Stage 2: Runtime
# ------------------------
FROM node:20-bullseye AS runtime

RUN apt-get update && apt-get install -y \
  python3 make g++ gcc postgresql-client \
  && ln -sf python3 /usr/bin/python \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Create uploads directories and set permissions
RUN mkdir -p /usr/src/app/uploads/profile-images && \
    mkdir -p /usr/src/app/uploads-file/png && \
    chown -R node:node /usr/src/app/uploads && \
    chown -R node:node /usr/src/app/uploads-file

USER node

# Copy built files, node_modules, and prisma folder
COPY --from=builder --chown=node:node /usr/src/app/dist ./dist
# COPY --from=builder --chown=node:node /usr/src/app/generated ./generated
COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=node:node /usr/src/app/prisma ./prisma
COPY --from=builder --chown=node:node /usr/src/app/package*.json ./

# Set environment
ENV NODE_ENV=production

# Expose API port
EXPOSE 8800

# Start container with safety checks + migrations

CMD ["bash", "-c", "\
  echo '⏳ Waiting for PostgreSQL...'; \
  until pg_isready -h db -p 5432 -U \"$POSTGRES_USER\"; do \
    sleep 2; \
  done; \
  echo '⚙️ Generating Prisma Client...'; \
  npx prisma generate; \
  echo '📦 Running Prisma Migrations...'; \
  npx prisma migrate deploy; \
  echo '🚀 Starting NestJS API...'; \
  exec node dist/src/main.js \
"]


