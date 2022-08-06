FROM node:18-slim
RUN apt-get update && apt-get upgrade && apt-get install -y --no-install-recommends make g++ python python3
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . ./
RUN npm run build
CMD [ "npm", "start" ]
