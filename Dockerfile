FROM oven/bun:latest

RUN apt-get update && apt-get install -y \
    postgresql \
    postgresql-client \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json bun.lock ./

COPY client ./client
COPY server ./server

RUN bun install:client
RUN bun install:server

RUN bun run build

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]

