FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm install -g npm@11.18.0 \
    && npm install --no-audit --no-fund

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
