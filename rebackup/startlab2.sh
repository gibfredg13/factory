#!/bin/bash

# --- Configuration & Constants ---
# Network Settings
SUBNET_RANGE="172.20.0.0/16"
KALI_IP="172.20.0.5"
BADWEB_IP="172.20.0.6"

# Container & Port Settings
KALI_CONTAINER="kali"
BADWEB_CONTAINER="badweb"
HTTP_PORT_1="8066"
HTTP_PORT_2="3002"

# File Paths
FLAG_1_FILE="flag.sh"
FLAG_2_FILE="flag2gen.sh"
BONUS_HTML="bonus.html"
DOCKER_HTML="docker"
VSFTPD_HTML="vsftpd"

# Silence Docker hints
export DOCKER_CLI_HINTS=false

# --- Functions ---

copy_files_to_tmp() {
  echo ">>> [1/7] Copying Lab Files to /tmp..."
  # Check if source directories exist to avoid errors
  if [ -d "$VSFTPD_HTML" ] && [ -d "$DOCKER_HTML" ]; then
      cp -r "$VSFTPD_HTML" "/tmp/"
      cp -r "$DOCKER_HTML" "/tmp/"
      cp -r "$BONUS_HTML" "/tmp/" 2>/dev/null || true # Optional bonus
  else
      echo "Error: Source directories ($VSFTPD_HTML or $DOCKER_HTML) not found in current folder."
      exit 1
  fi
}

cleanup_environment() {
  echo ">>> Cleaning up environment..."
  
  # Kill the Node web server if we captured its PID
  if [ ! -z "$WEB_SERVER_PID" ]; then
      echo "Stopping Web Server (PID $WEB_SERVER_PID)..."
      kill $WEB_SERVER_PID 2>/dev/null
  fi

  # Remove local files
  rm -f /tmp/*.html
  rm -rf /tmp/docker /tmp/vsftpd

  # Force remove containers
  docker rm "$KALI_CONTAINER" --force >/dev/null 2>&1
  docker rm "$BADWEB_CONTAINER" --force >/dev/null 2>&1
  
  # Remove network
  docker network rm demo >/dev/null 2>&1
}

setup_environment() {
  echo ">>> [2/7] Setting up Docker Network and Containers..."
  
  # Create network with explicit subnet (Required for Static IPs)
  docker network create --subnet "$SUBNET_RANGE" demo >/dev/null 2>&1 || true

  echo "  - Creating Kali ($KALI_IP)..."
  docker run -d \
    --privileged \
    --network demo \
    --ip "$KALI_IP" \
    -h attackmachine \
    -it --rm \
    --name "$KALI_CONTAINER" \
    kalilinux/kali-rolling >/dev/null

  echo "  - Creating Badweb ($BADWEB_IP)..."
  docker run -d \
    -h victimmachine \
    --network demo \
    --ip "$BADWEB_IP" \
    -it \
    -p 21:21 \
    --name "$BADWEB_CONTAINER" \
    clintmint/vsftpd-2.3.4:1.0 >/dev/null
}

configure_badweb_services() {
 echo ">>> [3/7] Configuring Badweb internal services..."
 docker exec "$BADWEB_CONTAINER" sh -c "apk update && apk add bash && start-vsftpd && sh" >/dev/null 2>&1
}

configure_kali_services() {
  echo ">>> [4/7] Installing tools on Kali (this takes a moment)..."
  docker exec "$KALI_CONTAINER" bash -c "apt update && apt install -y metasploit-framework docker.io curl nmap" >/dev/null 2>&1
}

start_http_server() {
  echo ">>> [5/7] Starting Local Web Server..."
  
  # Install dependencies silently
  (cd /tmp/docker && npm install >/dev/null 2>&1)
  (cd /tmp/vsftpd && npm install >/dev/null 2>&1)

  # Run concurrently in BACKGROUND (&) so the script continues
  # Using nohup or just & ensures it doesn't block the next function
  npx concurrently \
    "sudo apt upgrade -y && sudo apt update -y && sudo apt install npx"
    "cd /tmp/docker && npm run dev -- --host --port $HTTP_PORT_1" \
    "cd /tmp/vsftpd && npm run dev -- --host --port $HTTP_PORT_2" >/dev/null 2>&1 &
  
  WEB_SERVER_PID=$!
  echo "    Web Server started with PID: $WEB_SERVER_PID"
}

# --- Banner & Flag Logic ---

banner_exists() {
    local container="$1"
    docker exec "$container" bash -c 'grep -q "# ING Factory Banner" ~/.bashrc 2>/dev/null'
}

install_flags() {
  echo ">>> [6/7] Installing Flags..."
  chmod +x "$FLAG_1_FILE"
  chmod +x "$FLAG_2_FILE"
  ./"$FLAG_1_FILE" >/dev/null 2>&1
  ./"$FLAG_2_FILE" >/dev/null 2>&1
}

install_banner() {
    local container="$1"
    if banner_exists "$container"; then return; fi

    # Using single quotes for the outer block to avoid expansion issues
    docker exec "$container" bash -c '
cat >> ~/.bashrc << "EOF"
# ING Factory Banner
echo -e "\033[38;5;208m
██╗███╗   ██╗ ██████╗      ███████╗ █████╗  ██████╗████████╗ ██████╗ ██████╗ ██╗   ██╗
██║████╗  ██║██╔════╝      ██╔════╝██╔══██╗██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗╚██╗ ██╔╝
██║██╔██╗ ██║██║  ███╗     █████╗  ███████║██║         ██║   ██║   ██║██████╔╝ ╚████╔╝
██║██║╚██╗██║██║   ██║     ██╔══╝  ██╔══██║██║         ██║   ██║   ██║██╔══██╗  ╚██╔╝
██║██║ ╚████║╚██████╔╝     ██║      ██║  ██║╚██████╗   ██║   ╚██████╔╝██║  ██║   ██║
╚═╝╚═╝  ╚═══╝ ╚═════╝      ╚═╝      ╚═╝  ╚═╝ ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝
                             ⚙️  ⚙️  ⚙️  \033[91m[$(hostname)]\033[0m\033[38;5;208m
\033[0m"
EOF
'
}

configure_container_banners() {
    echo ">>> [7/7] Installing Banners..."
    install_banner "badweb"
    install_banner "kali"
}

# --- Main Execution ---

main() {
  # Trap Ctrl+C to ensure cleanup runs if user aborts early
  trap cleanup_environment SIGINT

  # 1. Prepare Environment
  cleanup_environment
  copy_files_to_tmp      # Moved this UP so files exist for the web server
  setup_environment
  
  # 2. Configure Containers
  configure_badweb_services
  configure_kali_services

  # 3. Start Web Server (Now runs in background)
  start_http_server

  # 4. Final Polish
  configure_container_banners
  install_flags

  # 5. Display Status
  echo ""
  echo "========================================================"
  echo "               LAB ENVIRONMENT READY"
  echo "========================================================"
  echo " Network Subnet : $SUBNET_RANGE"
  echo "--------------------------------------------------------"
  echo " ATTACKER (Kali): $KALI_IP"
  echo " VICTIM (Badweb): $BADWEB_IP  (FTP Port 21)"
  echo "--------------------------------------------------------"
  echo " Web Interface 1: http://localhost:$HTTP_PORT_1"
  echo " Web Interface 2: http://localhost:$HTTP_PORT_2"
  echo "========================================================"
  echo ""
  
  echo "Press [ENTER] to stop the web server, kill containers, and wipe data."
  read -p ""
  
  cleanup_environment
  echo "Cleanup complete. Goodbye!"
}

main
