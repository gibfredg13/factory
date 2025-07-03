#!/bin/bash

# IP suffixes of the target hosts
hosts=(164 189 146 145 148 176 149 147)

# Credentials
USER="hack"
PASSWORD="trouble"

REPO_URL="https://github.com/shoaloak/factory"
TARGET_DIR="factory"

# Loop through each host
for suffix in "${hosts[@]}"; do
  ip="192.168.1.$suffix"
  echo "Pushing to $ip..."
  sshpass -p "$PASSWORD" docker pussh shoaloak/attack "$USER@$ip"
  sshpass -p "$PASSWORD" docker pussh shoaloak/victim "$USER@$ip"

  echo "cloning repo"
  sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$ip" "bash -s" <<EOF
if [ ! -d "\$HOME/$TARGET_DIR" ]; then
  echo "Cloning repo on $ip..."
  git clone $REPO_URL
else
  echo "Repo already cloned on $ip."
fi
EOF
  
  echo "updates and deps"
  sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$ip" "bash -s" <<EOF
sudo apt update
sudo apt upgrade -y
sudo apt install -y aircrack-ng
sudo apt autoremove
EOF
done

