FROM kalilinux/kali-last-release

RUN apt-get update \
    && apt-get install -y ca-certificates \
    && sed -i 's/http:/https:/' /etc/apt/sources.list \
    && apt-get update \
    && apt-get install -y aircrack-ng metasploit-framework nmap hydra vim crunch iputils-ping tnftp rsmangler \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

