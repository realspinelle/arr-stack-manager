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

# Setup PostgreSQL user and db
USER postgres
RUN /etc/init.d/postgresql start && \
    psql --command "CREATE USER arrstackmanager WITH SUPERUSER PASSWORD 'weC0xWiNGqNxkbmP2MM5Bj0gW1NYo0cZ';" && \
    createdb -O arrstackmanager arrstackmanager
USER root

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]

