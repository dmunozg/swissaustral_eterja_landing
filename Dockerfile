FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_TURNSTILE_SITE_KEY
ARG VITE_GOOGLE_TAG_MANAGER_ID
RUN VITE_TURNSTILE_SITE_KEY="$VITE_TURNSTILE_SITE_KEY" VITE_GOOGLE_TAG_MANAGER_ID="$VITE_GOOGLE_TAG_MANAGER_ID" npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
