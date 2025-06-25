# Hack yourself into trouble

This is the repo for the Factory workshop.

## copying the images to the pi

Thanks to [unregistry](https://github.com/psviderski/unregistry), we can copy using `ssh`. Don't forget to enable using `systemctl start ssh` on the pi.

```sh
docker pussh shoaloak/attack hack@192.168.1.174
docker pussh shoaloak/victim hack@192.168.1.174
```