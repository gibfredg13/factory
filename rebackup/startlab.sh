#!/bin/bash

# silence docker hints
export DOCKER_CLI_HINTS=false

# --- Constants ---
KALI_CONTAINER="kali"
KALI_PORT="8008"
BADWEB_CONTAINER="badweb"
HTTP_PORT="8088"
HTML_FILE="/tmp/index.html"
FLAG_1_FILE="flag.sh"
FLAG_2_FILE="flag2gen.sh"
BONUS_HTML="bonus.html"
DOCKER_HTML="docker"
VSFTPD_HTML="vsftpd"

# --- Functions ---

copy_bonus() {
  echo "Copying Bonus and Docker"
  cp -r "$VSFTPD_HTML" "/tmp/" 
  cp -r "$DOCKER_HTML" "/tmp/"
  cp -r "$BONUS_HTML" "/tmp/"
}

cleanup_environment() {
  echo "Cleaning up previous containers and network..."
  pkill -f "python3 -m http.server $HTTP_PORT"
  rm -f /tmp/*.html
  docker rm "$KALI_CONTAINER" --force
  docker rm "$BADWEB_CONTAINER" --force
  docker network rm demo
  stop_http_server
}

setup_environment() {
  echo "Setting up environment..."
  docker network create demo

  echo "Creating Kali container..."
  # privileged for some network tools
  docker run -d --privileged --network demo -h attackmachine -it --rm --name "$KALI_CONTAINER" kalilinux/kali-rolling

  echo "Creating Badweb container..."
  docker run -d -h victimmachine --network demo -it -p 21:21 --name "$BADWEB_CONTAINER" clintmint/vsftpd-2.3.4:1.0
}

configure_badweb_services() {
 docker exec "$BADWEB_CONTAINER" sh -c "
 apk update &&
 apk add bash &&
 start-vsftpd && sh"

}

configure_kali_services() {
  echo "Configuring services on Badweb..."
  docker exec "$KALI_CONTAINER" bash -c "
  apt update && apt install -y metasploit-framework docker.io curl nmap
  "
}


start_http_server() {
  echo "Starting HTTP server on port 3001 and 3002"
#  python3 -m http.server "$HTTP_PORT" -d /tmp/ >/dev/null 2>&1 &
  cd /tmp/docker && npm install
cd /tmp/vsftpd && npm install
npx concurrently "cd /tmp/docker && npm run dev -- --host --port 8080" "cd /tmp/vsftpd && npm run dev -- --host --port 3002"
 # echo "HTTP server running. Open http://127.0.0.1:$HTTP_PORT in your browser."
}

###### 

banner_exists() {
    local container="$1"
    docker exec "$container" bash -c 'grep -q "# ING Factory Banner" ~/.bashrc 2>/dev/null'
}
install_flags() {
  chmod +x "$FLAG_1_FILE"
  chmod +x "$FLAG_2_FILE"
  ./"$FLAG_1_FILE"
  ./"$FLAG_2_FILE"
  
}
# Install banner if it doesn't exist
install_banner() {
    local container="$1"
    
    if banner_exists "$container"; then
        echo "Banner already exists in $container, skipping."
        return
    fi
    
    echo "Installing banner on $container..."
    docker exec "$container" bash -c '
cat >> ~/.bashrc << "EOF"
# ING Factory Banner
echo -e "\033[38;5;208m
██╗███╗   ██╗ ██████╗     ███████╗ █████╗  ██████╗████████╗ ██████╗ ██████╗ ██╗   ██╗
██║████╗  ██║██╔════╝     ██╔════╝██╔══██╗██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗╚██╗ ██╔╝
██║██╔██╗ ██║██║  ███╗    █████╗  ███████║██║        ██║   ██║   ██║██████╔╝ ╚████╔╝
██║██║╚██╗██║██║   ██║    ██╔══╝  ██╔══██║██║        ██║   ██║   ██║██╔══██╗  ╚██╔╝
██║██║ ╚████║╚██████╔╝    ██║     ██║  ██║╚██████╗   ██║   ╚██████╔╝██║  ██║   ██║
╚═╝╚═╝  ╚═══╝ ╚═════╝     ╚═╝     ╚═╝  ╚═╝ ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝
                              ⚙️  ⚙️  ⚙️  \033[91m[$(hostname)]\033[0m\033[38;5;208m
\033[0m"
EOF
'
}

# Install on both containers
configure_container_banners() {
    install_banner "badweb"
    install_banner "kali"
}

#######

main() {
  # --- Cleanup and Setup ---
  cleanup_environment
  setup_environment
  configure_badweb_services
  configure_kali_services

  # --- Generate Report and Serve ---
  start_http_server

  # --- Install Banners and labs on containers ---
  configure_container_banners
  install_flags
  copy_bonus


  echo "If you are done with the labs, continue to shutdown AND wipe"
  read -p "Press enter to continue"
  cleanup_environment
}

main
