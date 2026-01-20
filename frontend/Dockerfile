#----- BUILD STAGE -----#
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

#----- PRODUCTION STAGE -----#
FROM nginx:1.29.4-alpine

COPY --from=build /app/build /usr/share/nginx/html

# Create custom nginx config for port 8080
RUN printf 'server {\n\
    listen 8080;\n\
    server_name localhost;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]



