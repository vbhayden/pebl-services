FROM redis:6.0.6

COPY dockerConfig/redis/redis.conf /etc/redis/redis.conf
COPY dockerConfig/redis/startRedis.sh /srv/

RUN chmod 755 /srv/startRedis.sh

CMD ["/srv/startRedis.sh"]
