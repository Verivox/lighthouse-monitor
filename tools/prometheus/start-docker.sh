#!/bin/bash

THIS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

pushd "$THIS_DIR" > /dev/null

set -e
# set -x

docker build -t local/prometheus:local .

docker run \
  -v "$THIS_DIR/prometheus.yml:/etc/prometheus/prometheus.yml" \
  -v "$THIS_DIR/reports:/reports" \
  -p 9090:9090 \
  --name prometheus \
  --rm \
  -it \
  local/prometheus:local

popd > /dev/null