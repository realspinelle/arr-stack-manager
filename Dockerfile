FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lock ./

COPY client ./client
COPY server ./server

RUN bun install:client
RUN bun install:server

RUN bun build

CMD ["bun", "prod"]