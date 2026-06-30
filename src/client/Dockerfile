FROM node:24-alpine AS build

WORKDIR /app/src/client

COPY src/client/package.json src/client/package-lock.json ./
RUN npm ci

COPY src/client ./
COPY .env /app/.env

RUN npm run build

FROM nginx:1.27-alpine

COPY src/client/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/src/client/dist /usr/share/nginx/html

ENV CLIENT_PORT=16011
ENV API_PROXY_HOST=server
ENV API_PROXY_PORT=16010

EXPOSE 16011

CMD ["nginx", "-g", "daemon off;"]