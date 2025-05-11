FROM node:22-slim
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npx hardhat compile
RUN npx wagmi generate
RUN npx tsx scripts/copy-contract-bytecode.ts
