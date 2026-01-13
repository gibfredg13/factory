#!/bin/bash

# Check for root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (sudo ./enable_docker_tcp.sh)"
  exit
fi

echo "--- Configuring Docker to listen on TCP 2375 ---"

# 1. Create Systemd Override Directory
OVERRIDE_DIR="/etc/systemd/system/docker.service.d"
OVERRIDE_FILE="$OVERRIDE_DIR/override.conf"

mkdir -p "$OVERRIDE_DIR"

# 2. Write the override configuration
# We clear ExecStart first (ExecStart=) to avoid "too many arguments" error
cat > "$OVERRIDE_FILE" <<EOF
[Service]
ExecStart=
ExecStart=/usr/bin/dockerd -H fd:// -H tcp://0.0.0.0:2375
EOF

echo "✓ Systemd override file created."

# 3. Reload and Restart
echo "Reloading systemd and restarting Docker..."
systemctl daemon-reload
systemctl restart docker

# 4. Handle Firewall (Smart Detection)
echo "Configuring Firewall..."

if command -v firewall-cmd &> /dev/null; then
    # Fedora / RHEL / CentOS
    echo "Detected firewalld."
    firewall-cmd --permanent --add-port=2375/tcp
    firewall-cmd --reload
    echo "✓ Firewalld updated."
elif command -v ufw &> /dev/null; then
    # Raspberry Pi (if ufw is installed/active)
    if ufw status | grep -q "Status: active"; then
        echo "Detected UFW."
        ufw allow 2375/tcp
        echo "✓ UFW updated."
    else
        echo "UFW is installed but inactive. Skipping."
    fi
else
    echo "No active firewall manager (firewalld/ufw) detected or unknown. Ensure port 2375 is open manually if needed."
fi

# 5. Verification
echo "--- Verification ---"
# Sleep briefly to ensure socket is up
sleep 2

# Check if port is listening using ss (modern replacement for netstat)
if ss -lntp | grep -q ":2375"; then
    echo "SUCCESS: Docker is listening on port 2375."
else
    echo "ERROR: Port 2375 is NOT listening. Check 'journalctl -u docker' for details."
    exit 1
fi

# Functional test
echo "Testing API response..."
if curl -s --connect-timeout 3 http://127.0.0.1:2375/version > /dev/null; then
    echo "SUCCESS: Docker API is reachable."
else 
    echo "WARNING: Port is open, but API did not respond to curl."
fi
