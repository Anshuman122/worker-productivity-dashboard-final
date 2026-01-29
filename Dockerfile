FROM node:20-bullseye

WORKDIR /app

ENV NODE_ENV=production
ENV TAILWIND_DISABLE_LIGHTNINGCSS=1

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
