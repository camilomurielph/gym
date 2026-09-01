FROM node:22-alpine

WORKDIR /app

# Instalar Python, g++ y make (necesarios para compilar better-sqlite3)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "start"]
