FROM postgres:11.4-alpine

# For more information check https://hub.docker.com/_/postgres and
# https://docs.docker.com/samples/library/postgres/

COPY 10-create-django-user.sql /docker-entrypoint-initdb.d/

#COPY pg_hba.conf /var/lib/postgresql/data/

COPY postgresql.conf /

USER postgres

# logs
# create cathapi db user with correct permissions
#/var/lib/postgresql/data/postgresql.conf
