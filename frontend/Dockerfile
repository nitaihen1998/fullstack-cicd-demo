#----- BUILD STAGE -----#
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

#----- PRODUCTION STAGE -----#
FROM nginx:1.29.4-alpine

COPY --from=build /app/build /usr/share/nginx/html

RUN adduser -r -U nginx-user && \
    chown -R nginx-user:nginx-user /usr/share/nginx/*

USER nginx-user

EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]



