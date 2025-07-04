# Hack yourself into trouble

This is the repo for the Factory workshop.

## Labs

`bash startlab.sh` to start, view labs at [8088](http://127.0.0.1:8088). When pressing enter it'll automatically wipe.


## Dashboard Server

To install dashboard `chmod +x dashboardctf/installdahs.sh` and run it.

## copying the images to the pi

Thanks to [unregistry](https://github.com/psviderski/unregistry), we can copy using `ssh`. Don't forget to enable using `systemctl start ssh` on the pi.

```sh
docker pussh shoaloak/attack hack@192.168.1.174
docker pussh shoaloak/victim hack@192.168.1.174
```
