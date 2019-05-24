#!/bin/sh
# shellcheck disable=SC2039

set -e

if ! grep "docker.host.internal" /etc/hosts
then
  echo -e "$(/bin/ip route|awk '/default/ { print $3 }')\tdocker.host.internal" >> /etc/hosts
fi

/bin/prometheus \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/prometheus \
  --web.console.libraries=/etc/prometheus/console_libraries \
  --web.console.templates=/etc/prometheus/consoles \
  --log.level=debug