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
    
    # Install git if not installed (for downloading files)
    if ! check_installed git; then
        print_status "Installing git..."
        $PKG_MANAGER install -y git
    fi
    
    # Install wget if not installed (for downloading audio files)
    if ! check_installed wget; then
        print_status "Installing wget..."
        $PKG_MANAGER install -y wget
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
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Enable CORS
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static('public'));

// Serve ctf.html as the index
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ctf.html'));
});

// In-memory storage
let gameState = {
    teams: [],
    message: '',
    lastUpdate: Date.now()
};

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    // Send current state to newly connected client
    socket.emit('state_update', gameState);
    
    // Handle admin authentication
    socket.on('admin_auth', (password) => {
        if (password === 'hacktheplanet') {
            socket.join('admins');
            socket.emit('auth_success');
            console.log('Admin authenticated:', socket.id);
        } else {
            socket.emit('auth_failed');
        }
    });
    
    // Handle team creation (admin only)
    socket.on('create_team', (data) => {
        if (socket.rooms.has('admins')) {
            const newTeam = {
                id: Date.now(),
                name: data.name,
                flag1: false,
                flag2: false,
                flag3: false
            };
            gameState.teams.push(newTeam);
            gameState.lastUpdate = Date.now();
            
            // Broadcast to all clients
            io.emit('state_update', gameState);
            console.log('Team created:', newTeam.name);
        }
    });
    
    // Handle flag updates (admin only)
    socket.on('update_flags', (data) => {
        if (socket.rooms.has('admins')) {
            const team = gameState.teams.find(t => t.id === data.teamId);
            if (team) {
                team.flag1 = data.flag1;
                team.flag2 = data.flag2;
                team.flag3 = data.flag3;
                gameState.lastUpdate = Date.now();
                
                // Broadcast to all clients
                io.emit('state_update', gameState);
                
                // Check for victory
                if (team.flag1 && team.flag2 && team.flag3) {
                    io.emit('trigger_effect', { type: 'victory' });
                    gameState.message = `🏆 ${team.name} HAS CAPTURED ALL FLAGS! 🏆`;
                    io.emit('state_update', gameState);
                }
                console.log('Flags updated for team:', team.name);
            }
        }
    });
    
    // Handle message broadcast (admin only)
    socket.on('broadcast_message', (message) => {
        if (socket.rooms.has('admins')) {
            gameState.message = message;
            gameState.lastUpdate = Date.now();
            io.emit('state_update', gameState);
            io.emit('trigger_effect', { type: 'flash' });
            console.log('Message broadcast:', message);
        }
    });
    
    // Handle sound triggers (admin only)
    socket.on('play_sound', (soundType) => {
        if (socket.rooms.has('admins')) {
            io.emit('trigger_sound', { type: soundType });
            console.log('Sound triggered:', soundType);
        }
    });
    
    // Handle effect triggers (admin only)
    socket.on('trigger_effect', (effectType) => {
        if (socket.rooms.has('admins')) {
            io.emit('trigger_effect', { type: effectType });
            console.log('Effect triggered:', effectType);
        }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`CTF Server running on port ${PORT}`);
    console.log(`WebSocket server ready for connections`);
    console.log(`Access the CTF at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
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
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.1",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF

    # Check if ctf.html exists in current directory or common locations
    CTF_HTML_FOUND=false
    if [ -f "ctf.html" ]; then
        print_status "Found ctf.html in current directory. Copying..."
        cp ctf.html "$CTF_DIR/public/ctf.html"
        CTF_HTML_FOUND=true
    elif [ -f "/usr/share/nginx/html/dashboardctf/ctf.html" ]; then
        print_status "Found ctf.html in nginx directory. Copying..."
        cp /usr/share/nginx/html/dashboardctf/ctf.html "$CTF_DIR/public/ctf.html"
        CTF_HTML_FOUND=true
    elif [ -f "/tmp/ctf.html" ]; then
        print_status "Found ctf.html in /tmp. Copying..."
        cp /tmp/ctf.html "$CTF_DIR/public/ctf.html"
        CTF_HTML_FOUND=true
    fi
    
    if [ "$CTF_HTML_FOUND" = false ]; then
        print_warning "ctf.html not found in common locations"
        print_warning "Please copy your ctf.html file to: $CTF_DIR/public/ctf.html"
    fi
    
    # Set permissions
    chown -R $CTF_USER:$CTF_USER "$CTF_DIR"
    chmod -R 755 "$CTF_DIR"
}

download_audio_files() {
    print_status "Downloading audio files for offline use..."
    
    # Create sounds directory
    mkdir -p "$CTF_DIR/public/sounds"
    cd "$CTF_DIR/public/sounds"
    
    # Download audio files
    print_status "Downloading rickroll sound..."
    wget -q -O rickroll.mp3 "https://www.myinstants.com/media/sounds/rick-roll.mp3" || {
        print_warning "Failed to download rickroll.mp3"
    }
    
    print_status "Downloading alert sound..."
    wget -q -O alert.mp3 "https://www.myinstants.com/media/sounds/alarm.mp3" || {
        print_warning "Failed to download alert.mp3"
    }
    
    print_status "Downloading hack sound..."
    wget -q -O hack.mp3 "https://www.myinstants.com/media/sounds/windows-error.mp3" || {
        print_warning "Failed to download hack.mp3"
    }
    
    # Alternative: Create sounds using sox if downloads fail
    if ! [ -f "rickroll.mp3" ] || ! [ -f "alert.mp3" ] || ! [ -f "hack.mp3" ]; then
        if check_installed sox; then
            print_status "Generating fallback sounds with sox..."
            # Generate alert sound (siren)
            [ -f "alert.mp3" ] || sox -n alert.mp3 synth 2 sine 800-1000 sine 1000-800 repeat 2
            # Generate hack sound (glitch)
            [ -f "hack.mp3" ] || sox -n hack.mp3 synth 1 square 200-800 tremolo 10 50
            # Generate rickroll placeholder (musical notes)
            [ -f "rickroll.mp3" ] || sox -n rickroll.mp3 synth 0.5 sine 523.25 sine 587.33 sine 659.25 sine 783.99
        else
            print_warning "Install 'sox' for audio generation: $PKG_MANAGER install sox"
        fi
    fi
    
    # Update the HTML file to use local sounds
    if [ -f "$CTF_DIR/public/ctf.html" ]; then
        print_status "Updating HTML to use local audio files..."
        # Backup original
        cp "$CTF_DIR/public/ctf.html" "$CTF_DIR/public/ctf.html.bak"
        
        # Replace CDN URLs with local paths
        sed -i "s|https://www.myinstants.com/media/sounds/rick-roll.mp3|/sounds/rickroll.mp3|g" "$CTF_DIR/public/ctf.html"
        sed -i "s|https://www.myinstants.com/media/sounds/alarm.mp3|/sounds/alert.mp3|g" "$CTF_DIR/public/ctf.html"
        sed -i "s|https://www.myinstants.com/media/sounds/windows-error.mp3|/sounds/hack.mp3|g" "$CTF_DIR/public/ctf.html"
    fi
    
    # Set permissions
    chown -R $CTF_USER:$CTF_USER "$CTF_DIR/public/sounds"
    chmod -R 755 "$CTF_DIR/public/sounds"
    
    cd "$CTF_DIR"
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
    
    # Proxy settings
    location / {
        proxy_pass http://localhost:$NODE_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:$NODE_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
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
        firewall-cmd --permanent --add-service=https 2>/dev/null || true
        firewall-cmd --reload 2>/dev/null || true
    fi
    
    # For Debian/Raspbian (ufw)
    if check_installed ufw; then
        ufw allow 80/tcp 2>/dev/null || true
        ufw allow 443/tcp 2>/dev/null || true
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
    echo "📄 HTML File Location: $CTF_DIR/public/ctf.html"
    echo "🎵 Audio Files: $CTF_DIR/public/sounds/"
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
    echo "   Edit server: sudo nano $CTF_DIR/server.js"
    echo ""
    
    if [ ! -f "$CTF_DIR/public/ctf.html" ]; then
        echo -e "${YELLOW}⚠️  WARNING: ctf.html not found!${NC}"
        echo "   Please copy your ctf.html file to:"
        echo "   $CTF_DIR/public/ctf.html"
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
    download_audio_files
    install_npm_packages
    configure_nginx
    create_systemd_service
    configure_firewall
    print_status_report
}

# Run main function
main
