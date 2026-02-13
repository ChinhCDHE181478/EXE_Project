FROM node:20-alpine

WORKDIR /app

# Copy package.json và cài dependencies
COPY package*.json ./
RUN npm install

# Copy toàn bộ code
COPY . .
COPY .env.local .env.local

EXPOSE 3000
CMD ["npm", "run", "dev"]

