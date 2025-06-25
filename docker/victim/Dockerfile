# Stage 1: Build VSFTPd 2.3.4
FROM debian:bullseye-slim AS build

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    git \
    build-essential \
    libpam0g-dev \
    checkinstall \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Download and compile VSFTPd 2.3.4
RUN git clone https://github.com/DoctorKisow/vsftpd-2.3.4.git /tmp/vsftpd

WORKDIR /tmp/vsftpd
RUN sed -i 's/-lcrypt/-lcrypt -lpam/g' Makefile
RUN make clean || true && make
RUN mkdir -p /usr/local/man/man8 /usr/local/man/man5
RUN checkinstall --pkgname=vsftpd-backdoor --pkgversion=2.3.4 --default --install=no

# Stage 2: Runtime environment
FROM debian:bullseye-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    lighttpd \
    libpam0g \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy compiled VSFTPd .deb from the build stage
COPY --from=build /tmp/vsftpd/vsftpd-backdoor*.deb /tmp/

# Install VSFTPd package
RUN dpkg -i /tmp/vsftpd-backdoor*.deb || apt-get install -f -y \
    && rm /tmp/vsftpd-backdoor*.deb

# Create admin home directory and index.html
RUN useradd -m -d /home/admin -s /bin/bash admin \
    && echo "admin:aaabb" | chpasswd \
    && mkdir -p /home/admin \
    && echo '<html><head><title>Hello</title></head><body><h1>Hello World!</h1></body></html>' > /home/admin/index.html \
    && mkdir /usr/share/empty

# Copy configs
COPY lighttpd.conf /etc/lighttpd/lighttpd.conf
COPY vsftpd.conf /etc/vsftpd.conf

# Expose FTP and HTTP ports
EXPOSE 21 80

# Command to run both services
CMD ["/bin/bash", "-c", "vsftpd /etc/vsftpd.conf & lighttpd -D -f /etc/lighttpd/lighttpd.conf"]
