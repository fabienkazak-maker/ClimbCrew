FROM oven/bun:1.3.14-debian

WORKDIR /app
COPY package.json ./
RUN bun install
COPY schema.sql ./
COPY src ./src

EXPOSE 3000
CMD ["bun", "run", "dev"]
