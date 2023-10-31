FROM node:14
WORKDIR /usr/src/app
COPY package*.json ./
RUN yarn install
COPY . .
EXPOSE 3050
CMD yarn build && yarn start