FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

RUN chown -R node:node /app

USER node

EXPOSE 3000

ENTRYPOINT ["node", "server.js"]