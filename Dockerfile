FROM ubuntu:20.04
MAINTAINER Zotov Alexey

ENV NODE_ENV=production
ENV PGVER 12
ENV PORT 5000
EXPOSE $PORT

RUN apt-get -y update && apt-get install -y tzdata && apt-get install -y postgresql-$PGVER && apt-get install -y nodejs npm

RUN echo "host all  all    0.0.0.0/0  md5" >> /etc/postgresql/$PGVER/main/pg_hba.conf
RUN echo "listen_addresses='*'" >> /etc/postgresql/$PGVER/main/postgresql.conf

COPY ./ /opt/forums_db/

USER postgres
RUN service postgresql start &&\
    psql --command "CREATE USER zotov WITH SUPERUSER PASSWORD 'alex';" &&\
    psql < /opt/forums_db/initDB.sql &&\
    service postgresql stop

VOLUME  ["/etc/postgresql", "/var/log/postgresql", "/var/lib/postgresql"]

USER root
WORKDIR /opt/forums_db
RUN ls -la
RUN npm i --only=production
RUN npm i -g pm2
CMD service postgresql start && pm2-runtime start dist/index.js -i max
