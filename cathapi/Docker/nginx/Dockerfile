FROM nginx:1.16.0-alpine

# For more information check https://hub.docker.com/_/nginx and
# https://docs.docker.com/samples/library/nginx/

RUN adduser --system --ingroup users ucbcisi && \
    touch /var/run/nginx.pid && \
    chown -R ucbcisi:users /var/run/nginx.pid && \
    chown -R ucbcisi:users /var/cache/nginx

ADD nginx.conf /etc/nginx/nginx.conf

USER ucbcisi:users