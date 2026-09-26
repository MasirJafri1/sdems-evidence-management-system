FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx hardhat build
EXPOSE 8545
CMD ["node", "start.js"]
