#!/bin/bash

# silence docker hints
export DOCKER_CLI_HINTS=false

# --- Constants ---
KALI_CONTAINER="kali"
BADWEB_CONTAINER="badweb"
HTTP_PORT="8069"
HTML_FILE="/tmp/index.html"

# --- Functions ---

cleanup_environment() {
  echo "Cleaning up previous containers and network..."
  pkill -f "python3 -m http.server $HTTP_PORT"
  rm -f "$HTML_FILE"
  docker rm "$KALI_CONTAINER" --force
  docker rm "$BADWEB_CONTAINER" --force
  docker network rm demo
}

setup_environment() {
  echo "Setting up environment..."
  docker network create demo

  echo "Creating Kali container..."
  docker run -d --privileged --network demo -h attackmachine -it --rm --name "$KALI_CONTAINER" kalilinux/kali-last-release

  echo "Creating Badweb container..."
  # TODO: This container is AMD64, not sure how well it'll execute on a Pi
  docker run -d -h victimmachine --network demo -it --rm --name "$BADWEB_CONTAINER" asecurityguru/abccorpdockerapp:v1
}

configure_badweb_services() {
  echo "Configuring services on Badweb..."
  docker exec "$BADWEB_CONTAINER" bash -c "
    sed -i 's/listen=NO/listen=YES/' /etc/vsftpd.conf &&
    vsftpd /etc/vsftpd.conf &
    useradd -m -g admin admin -s /bin/bash &&
    echo 'admin:aaabb' | chpasswd &&
    echo '<html><head><title>Hello</title></head><body><h1>Hello World!</h1></body></html>' > /home/admin/index.html &&
    chown admin:admin /home/admin/index.html &&
    cd /home/admin &&
    nohup python -m SimpleHTTPServer 80 &>/dev/null &
  "
}

update_kali_and_install_tools() {
  echo "Updating Kali and installing tools..."
  docker exec -it "$KALI_CONTAINER" bash -c "
    apt-get update &&
    apt-get install -y ca-certificates &&
    sed -i 's/http:/https:/' /etc/apt/sources.list &&
    apt-get update &&
    apt-get install -y aircrack-ng metasploit-framework nmap hydra vim crunch iputils-ping &&
    cd /usr/share/nmap/scripts/ &&
    git clone https://github.com/vulnersCom/nmap-vulners.git &&
    cd vulscan/utilities/updater/ &&
    chmod +x updateFiles.sh &&
    ./updateFiles.sh
  "
  # TODO: I think nmap vulners should be `git clone https://github.com/scipag/vulscan.git vulscan`
}

get_container_ip() {
  docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$1"
}

run_nmap_scan() {
  local attacker_container="$1"
  local target_ip="$2"
  echo "Running Nmap scan on $target_ip from $attacker_container..."
  docker exec "$attacker_container" nmap -sV -p 21 "$target_ip"
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
  python3 -m http.server "$HTTP_PORT" -d /tmp/ &
  echo "HTTP server running. Open http://127.0.0.1:$HTTP_PORT in your browser."
}

main() {
  # --- Cleanup and Setup ---
  cleanup_environment
  setup_environment
  configure_badweb_services
  update_kali_and_install_tools

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
}

main
