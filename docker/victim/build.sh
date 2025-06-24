#!/bin/bash
docker buildx create --name mybuilder --use
docker buildx inspect --bootstrap

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t shoaloak/vuln_vsftpd_httpd:latest \
  --load .
  #--push \
  #.
