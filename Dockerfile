FROM node:boron

WORKDIR /app

COPY . .

RUN npm install 

EXPOSE 1337

ENV NODE_ENV production

CMD ["node", "main.js"]
