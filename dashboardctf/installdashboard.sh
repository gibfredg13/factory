#!/bin/bash

# CTF Installation Script
# Compatible with Raspberry Pi OS and Fedora
# This script installs and configures the ING Factory CTF application

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CTF_DIR="/opt/ctf-app"
CTF_USER="ctf"
NODE_PORT="3000"
NGINX_PORT="80"
SERVICE_NAME="ctf-server"

# Functions
print_status() {
    echo -e "${GREEN}[*]${NC} $1"
}

print_error() {
    echo -e "${RED}[!]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VER=$VERSION_ID
    else
        print_error "Cannot detect OS"
        exit 1
    fi
    
    if [[ "$OS" == "raspbian" ]] || [[ "$OS" == "debian" ]]; then
        PKG_MANAGER="apt-get"
        PKG_UPDATE="apt-get update"
        NGINX_SITES="/etc/nginx/sites-available"
        NGINX_ENABLED="/etc/nginx/sites-enabled"
        NODE_PACKAGE="nodejs npm"
    elif [[ "$OS" == "fedora" ]] || [[ "$OS" == "rhel" ]] || [[ "$OS" == "centos" ]]; then
        PKG_MANAGER="dnf"
        PKG_UPDATE="dnf check-update || true"
        NGINX_SITES="/etc/nginx/conf.d"
        NGINX_ENABLED="/etc/nginx/conf.d"
        NODE_PACKAGE="nodejs npm"
    else
        print_error "Unsupported OS: $OS"
        exit 1
    fi
    
    print_status "Detected OS: $OS $VER"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then 
        print_error "Please run as root (use sudo)"
        exit 1
    fi
}

check_installed() {
    command -v $1 >/dev/null 2>&1
}

install_dependencies() {
    print_status "Updating package list..."
    $PKG_UPDATE
    
    # Install Node.js and npm if not installed
    if ! check_installed node; then
        print_status "Installing Node.js and npm..."
        $PKG_MANAGER install -y $NODE_PACKAGE
    else
        print_status "Node.js already installed: $(node --version)"
    fi
    
    # Install nginx if not installed
    if ! check_installed nginx; then
        print_status "Installing nginx..."
        $PKG_MANAGER install -y nginx
    else
        print_status "Nginx already installed: $(nginx -v 2>&1)"
    fi
    
    # Install git if not installed
    if ! check_installed git; then
        print_status "Installing git..."
        $PKG_MANAGER install -y git
    fi
}

create_ctf_user() {
    if ! id "$CTF_USER" &>/dev/null; then
        print_status "Creating CTF user..."
        useradd -r -m -d /var/lib/ctf -s /bin/false $CTF_USER || true
    else
        print_status "CTF user already exists"
    fi
    
    # Ensure the user has a proper home directory for npm
    if [ ! -d "/var/lib/ctf" ]; then
        mkdir -p /var/lib/ctf
        chown $CTF_USER:$CTF_USER /var/lib/ctf
    fi
}

setup_ctf_directory() {
    print_status "Setting up CTF directory..."
    
    # Create directory if it doesn't exist
    if [ ! -d "$CTF_DIR" ]; then
        mkdir -p "$CTF_DIR/public"
    fi
    
    # Check if server.js already exists
    if [ -f "$CTF_DIR/server.js" ]; then
        print_warning "server.js already exists. Backing up..."
        cp "$CTF_DIR/server.js" "$CTF_DIR/server.js.bak.$(date +%s)"
    fi
    
    # Create server.js
    cat > "$CTF_DIR/server.js" << 'EOF'
// server.js - CTF WebSocket Server
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = 'hacktheplanet';

// Serve the main HTML file
app.use(express.static(path.join(__dirname, 'public')));

// --- Game State (managed by the server) ---
let gameState = {
    teams: [
        {id: 1, name: "Blue Team", flag1: true, flag2: false, flag3: false},
        {id: 2, name: "Red Team", flag1: false, flag2: true, flag3: false},
        {id: 3, name: "Green Team", flag1: false, flag2: false, flag3: false},
    ],
    message: 'Welcome to the CTF!'
};

// --- Socket.IO Connection Handling ---
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Send the current state to the newly connected client
    socket.emit('state_update', gameState);

    // --- Admin Authentication ---
    socket.on('admin_auth', (password) => {
        if (password === ADMIN_PASSWORD) {
            socket.emit('auth_success');
            console.log(`Admin access granted to ${socket.id}`);
        } else {
            socket.emit('auth_failed');
            console.log(`Failed admin login attempt from ${socket.id}`);
        }
    });

    // --- State Management ---
    socket.on('create_team', (data) => {
        const newId = gameState.teams.length > 0 ? Math.max(...gameState.teams.map(t => t.id)) + 1 : 1;
        gameState.teams.push({ id: newId, name: data.name, flag1: false, flag2: false, flag3: false });
        io.emit('state_update', gameState); // Broadcast updated state to all clients
    });
    
    socket.on('delete_team', (data) => {
        gameState.teams = gameState.teams.filter(t => t.id !== data.teamId);
        io.emit('state_update', gameState);
    });

    socket.on('update_flags', (data) => {
        const team = gameState.teams.find(t => t.id === data.teamId);
        if (team) {
            team.flag1 = data.flag1;
            team.flag2 = data.flag2;
            team.flag3 = data.flag3;
        }
        io.emit('state_update', gameState);
    });
    
    socket.on('broadcast_message', (message) => {
        gameState.message = message;
        io.emit('state_update', gameState);
    });

    // --- Chaos Controls ---
    socket.on('play_sound', (data) => {
        io.emit('trigger_sound', data); // Broadcast to all clients
    });

    socket.on('trigger_effect', (data) => {
        io.emit('trigger_effect', data); // Broadcast to all clients
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`CTF server running on http://localhost:${PORT}`);
});
EOF

    # Create package.json
    cat > "$CTF_DIR/package.json" << 'EOF'
{
  "name": "ctf-websocket-server",
  "version": "1.0.0",
  "description": "WebSocket server for ING Factory CTF",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.4"
  }
}
EOF

    # Check if ctf.html exists in current directory or common locations
    CTF_HTML_FOUND=false
    if [ -f "ctf.html" ]; then
        print_status "Found ctf.html in current directory. Copying..."
        cp ctf.html "$CTF_DIR/public/index.html"
        CTF_HTML_FOUND=true
    elif [ -f "/usr/share/nginx/html/dashboardctf/ctf.html" ]; then
        print_status "Found ctf.html in nginx directory. Copying..."
        cp /usr/share/nginx/html/dashboardctf/ctf.html "$CTF_DIR/public/index.html"
        CTF_HTML_FOUND=true
    elif [ -f "/tmp/ctf.html" ]; then
        print_status "Found ctf.html in /tmp. Copying..."
        cp /tmp/ctf.html "$CTF_DIR/public/index.html"
        CTF_HTML_FOUND=true
    fi
    
    if [ "$CTF_HTML_FOUND" = false ]; then
        print_warning "ctf.html not found in common locations"
        print_warning "Please copy your ctf.html file to: $CTF_DIR/public/index.html"
    fi
    
    # Set permissions
    chown -R $CTF_USER:$CTF_USER "$CTF_DIR"
    chmod -R 755 "$CTF_DIR"
}

install_npm_packages() {
    print_status "Installing npm packages..."
    cd "$CTF_DIR"
    
    # Set HOME environment variable for npm
    export HOME=/var/lib/ctf
    
    # Check if node_modules already exists
    if [ -d "node_modules" ]; then
        print_status "Node modules already installed. Updating..."
        sudo -u $CTF_USER env HOME=/var/lib/ctf npm update
    else
        sudo -u $CTF_USER env HOME=/var/lib/ctf npm install
    fi
}

configure_nginx() {
    print_status "Configuring nginx..."
    
    # Backup existing config if it exists
    if [[ "$OS" == "fedora" ]]; then
        NGINX_CONFIG="$NGINX_SITES/ctf.conf"
    else
        NGINX_CONFIG="$NGINX_SITES/ctf"
    fi
    
    if [ -f "$NGINX_CONFIG" ]; then
        print_warning "Nginx config already exists. Backing up..."
        cp "$NGINX_CONFIG" "${NGINX_CONFIG}.bak.$(date +%s)"
    fi
    
    # Create nginx config
    cat > "$NGINX_CONFIG" << EOF
server {
    listen $NGINX_PORT;
    server_name _;
    
    # Logs
    access_log /var/log/nginx/ctf_access.log;
    error_log /var/log/nginx/ctf_error.log;
    
    location / {
        proxy_pass http://localhost:$NODE_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    
    # Enable site (Debian/Raspbian only)
    if [[ "$OS" == "raspbian" ]] || [[ "$OS" == "debian" ]]; then
        # Disable default site if it exists and is enabled
        if [ -L "$NGINX_ENABLED/default" ]; then
            print_status "Disabling default nginx site..."
            rm -f "$NGINX_ENABLED/default"
        fi
        
        # Enable CTF site if not already enabled
        if [ ! -L "$NGINX_ENABLED/ctf" ]; then
            ln -s "$NGINX_CONFIG" "$NGINX_ENABLED/ctf"
        fi
    fi
    
    # Test nginx configuration
    nginx -t
    
    # Restart nginx
    systemctl restart nginx
    systemctl enable nginx
}

create_systemd_service() {
    print_status "Creating systemd service..."
    
    # Check if service already exists
    if [ -f "/etc/systemd/system/${SERVICE_NAME}.service" ]; then
        print_warning "Service already exists. Stopping and backing up..."
        systemctl stop $SERVICE_NAME 2>/dev/null || true
        cp "/etc/systemd/system/${SERVICE_NAME}.service" "/etc/systemd/system/${SERVICE_NAME}.service.bak.$(date +%s)"
    fi
    
    # Create service file
    cat > "/etc/systemd/system/${SERVICE_NAME}.service" << EOF
[Unit]
Description=CTF WebSocket Server
After=network.target

[Service]
Type=simple
User=$CTF_USER
WorkingDirectory=$CTF_DIR
ExecStart=$(which node) server.js
Restart=always
RestartSec=10

# Environment
Environment=NODE_ENV=production
Environment=PORT=$NODE_PORT

# Security
NoNewPrivileges=true
PrivateTmp=true
Environment=HOME=/var/lib/ctf

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and start service
    systemctl daemon-reload
    systemctl enable $SERVICE_NAME
    systemctl start $SERVICE_NAME
}

configure_firewall() {
    print_status "Configuring firewall..."
    
    # For Fedora (firewalld)
    if check_installed firewall-cmd; then
        firewall-cmd --permanent --add-service=http 2>/dev/null || true
        firewall-cmd --reload 2>/dev/null || true
    fi
    
    # For Debian/Raspbian (ufw)
    if check_installed ufw; then
        ufw allow 80/tcp 2>/dev/null || true
    fi
}

print_status_report() {
    echo ""
    echo "========================================"
    echo "       CTF Installation Complete!"
    echo "========================================"
    echo ""
    
    # Check service status
    if systemctl is-active --quiet $SERVICE_NAME; then
        echo -e "✅ CTF Server: ${GREEN}Running${NC}"
    else
        echo -e "❌ CTF Server: ${RED}Not Running${NC}"
        echo "   Run: sudo systemctl status $SERVICE_NAME"
    fi
    
    if systemctl is-active --quiet nginx; then
        echo -e "✅ Nginx: ${GREEN}Running${NC}"
    else
        echo -e "❌ Nginx: ${RED}Not Running${NC}"
        echo "   Run: sudo systemctl status nginx"
    fi
    
    echo ""
    echo "📁 Installation Directory: $CTF_DIR"
    echo "📄 HTML File Location: $CTF_DIR/public/index.html"
    echo ""
    
    # Get IP addresses
    echo "🌐 Access URLs:"
    echo "   Local: http://localhost/"
    
    # Get all IP addresses
    for ip in $(hostname -I); do
        echo "   Network: http://$ip/"
    done
    
    echo ""
    echo "🔧 Useful Commands:"
    echo "   View logs: sudo journalctl -u $SERVICE_NAME -f"
    echo "   Restart server: sudo systemctl restart $SERVICE_NAME"
    echo "   Restart nginx: sudo systemctl restart nginx"
    echo ""
    
    if [ ! -f "$CTF_DIR/public/index.html" ]; then
        echo -e "${YELLOW}⚠️  WARNING: index.html not found!${NC}"
        echo "   Please copy your ctf.html file to:"
        echo "   $CTF_DIR/public/index.html"
        echo ""
    fi
    
    echo "🎮 Admin Access:"
    echo "   1. Click the π symbol (top-right)"
    echo "   2. Password: hacktheplanet"
    echo ""
}

# Main installation flow
main() {
    echo "========================================"
    echo "    ING Factory CTF Installer"
    echo "========================================"
    echo ""
    
    check_root
    detect_os
    install_dependencies
    create_ctf_user
    setup_ctf_directory
    install_npm_packages
    configure_nginx
    create_systemd_service
    configure_firewall
    print_status_report
}

# Run main function
main

