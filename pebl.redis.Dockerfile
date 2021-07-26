FROM redis:6.0.6

COPY pebl-services/dockerConfig/redis/redis.conf /etc/redis/redis.conf
COPY pebl-services/dockerConfig/redis/startRedis.sh /srv/

RUN chmod 755 /srv/startRedis.sh

CMD ["/srv/startRedis.sh"]
