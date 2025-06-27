#!/bin/bash

# silence docker hints
export DOCKER_CLI_HINTS=false

# --- Constants ---
KALI_CONTAINER="kali"
KALI_PORT="8008"
BADWEB_CONTAINER="badweb"
HTTP_PORT="8088"
HTML_FILE="/tmp/index.html"

# --- Functions ---

stop_http_server() {
  echo "Stopping HTTP server on port $HTTP_PORT..."
  pids=$(ps aux | grep "[h]ttp.server" | awk '{print $2}')
  for pid in $pids; do
    kill $pid
  done
  echo "HTTP server stopped."
}

cleanup_environment() {
  echo "Cleaning up previous containers and network..."
  pkill -f "python3 -m http.server $HTTP_PORT"
  rm -f "$HTML_FILE"
  docker rm "$KALI_CONTAINER" --force
  docker rm "$BADWEB_CONTAINER" --force
  docker network rm demo
  stop_http_server
}

setup_environment() {
  echo "Setting up environment..."
  docker network create demo

  echo "Creating Kali container..."
  # privileged for airmon-ng
  docker run -d --privileged --network demo -h attackmachine -it --rm --name "$KALI_CONTAINER" shoaloak/attack

  echo "Creating Badweb container..."
  docker run -d -h victimmachine --network demo -it -p $KALI_PORT:80 --rm --name "$BADWEB_CONTAINER" shoaloak/victim
}

configure_badweb_services() {
  echo "Configuring services on Badweb..."
  docker exec "$BADWEB_CONTAINER" bash -c "
    vsftpd /etc/vsftpd.conf &
    cd /home/admin &&
    nohup python -m SimpleHTTPServer 80 &>/dev/null &
  "
}

get_container_ip() {
  docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$1"
}

run_nmap_scan() {
  local attacker_container="$1"
  local target_ip="$2"
  echo "Running Nmap scan on $target_ip from $attacker_container..."
  docker exec "$attacker_container" nmap -sV -p -100 --script vulners "$target_ip"
}

generate_html_report() {
  local kali_ip="$1"
  local badweb_ip="$2"
  local badweb_hostname="$3"
  local nmap_result="$4"
  local nmap_status="$5"

  echo "Generating HTML report..."
  template=$(<template.html)

  # Replace placeholders in template
  populated_template=${template//\$kali_ip/$kali_ip}
  populated_template=${populated_template//\$badweb_ip/$badweb_ip}
  populated_template=${populated_template//\$badweb_hostname/$badweb_hostname}
  populated_template=${populated_template//\$nmap_result/$nmap_result}
  populated_template=${populated_template//\$nmap_status/$nmap_status}

  # Write populated HTML to file
  echo "$populated_template" > "$HTML_FILE"
}

start_http_server() {
  echo "Starting HTTP server on port $HTTP_PORT..."
  python3 -m http.server "$HTTP_PORT" -d /tmp/ >/dev/null 2>&1 &
  echo "HTTP server running. Open http://127.0.0.1:$HTTP_PORT in your browser."
}

###### 

banner_exists() {
    local container="$1"
    docker exec "$container" bash -c 'grep -q "# ING Factory Banner" ~/.bashrc 2>/dev/null'
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

  # --- Gather Information ---
  local kali_ip=$(get_container_ip "$KALI_CONTAINER")
  local badweb_ip=$(get_container_ip "$BADWEB_CONTAINER")
  local badweb_hostname="victimmachine"

  # --- Perform Actions ---
  local nmap_result=$(run_nmap_scan "$KALI_CONTAINER" "$badweb_ip")
  local nmap_status=$([[ $? -eq 0 ]] && echo "success" || echo "failed")

  # --- Generate Report and Serve ---
  generate_html_report "$kali_ip" "$badweb_ip" "$badweb_hostname" "$nmap_result" "$nmap_status"
  start_http_server

  # --- Install Banners on containers ---
  configure_container_banners

  echo "If you are done with the labs, continue to shutdown AND wipe"
  read -p "Press enter to continue"
  cleanup_environment
}

main
