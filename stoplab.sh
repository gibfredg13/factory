echo Deleting containers
pkill -f "python3 -m http.server 8088"
rm /tmp/index.html
docker rm kali --force
docker rm badweb --force
docker network rm demo
