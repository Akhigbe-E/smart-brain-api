FROM node:12.16

WORKDIR /usr/src/smart-brain-api

COPY ./ ./

RUN npm install

CMD ["bin/bash"]