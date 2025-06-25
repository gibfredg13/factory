#!/bin/bash
docker buildx create --name mybuilder --use
docker buildx inspect --bootstrap

#readonly PLATFORMS="linux/amd64,linux/arm64"
readonly PLATFORMS="linux/arm64"

docker buildx build \
  --platform $PLATFORMS \
  -t shoaloak/victim:latest \
  --load ./victim
  #--push

docker buildx build \
  --platform $PLATFORMS \
  -t shoaloak/attack:latest \
  --load ./attack
  #--push