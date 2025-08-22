#!/bin/bash

# SMAD Dashboard Production Deployment Script
# Usage: ./deploy.sh [init|update|ssl|backup|logs]

set -e

# Configuration
DOMAIN="smad.blckbrd.ir"
EMAIL="admin@blckbrd.ir"  # Change this to your email
APP_DIR="/opt/smad-dashboard"
BACKUP_DIR="/opt/backups/smad"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
    fi
}

# Install Docker and Docker Compose
install_docker() {
    log "Installing Docker and Docker Compose..."
    
    # Update package index
    apt-get update
    
    # Install required packages
    apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    # Install Docker Compose (standalone)
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    log "Docker installation completed"
}

# Setup firewall
setup_firewall() {
    log "Configuring firewall..."
    
    # Install ufw if not present
    apt-get install -y ufw
    
    # Reset firewall rules
    ufw --force reset
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (adjust port if needed)
    ufw allow 22/tcp
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Enable firewall
    ufw --force enable
    
    log "Firewall configured"
}

# Create application directory and setup
setup_app_directory() {
    log "Setting up application directory..."
    
    # Create directories
    mkdir -p $APP_DIR
    mkdir -p $BACKUP_DIR
    mkdir -p $APP_DIR/certbot/conf
    mkdir -p $APP_DIR/certbot/www
    
    # Set permissions
    chown -R $SUDO_USER:$SUDO_USER $APP_DIR
    chmod -R 755 $APP_DIR
    
    log "Application directory setup completed"
}

# Deploy application
deploy_app() {
    log "Deploying SMAD Dashboard..."
    
    cd $APP_DIR
    
    # Pull latest code (assuming git repository)
    if [ -d ".git" ]; then
        log "Updating existing repository..."
        git pull origin main
    else
        warn "No git repository found. Please upload your application files to $APP_DIR"
        return 1
    fi
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env.production" ]; then
        log "Creating production environment file..."
        cat > .env.production << EOF
# Production Environment Configuration
NODE_ENV=production
DATABASE_URL=mongodb://mongo:27017/analytics
SENTIMENT_API_URL=http://sentiment-api:8000
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Add your additional environment variables here
EOF
        warn "Please review and update .env.production file with your configuration"
    fi
    
    # Build and start services
    log "Building and starting services..."
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.prod.yml build --no-cache
    docker-compose -f docker-compose.prod.yml up -d
    
    log "Application deployed successfully"
}

# Setup SSL certificates
setup_ssl() {
    log "Setting up SSL certificates for $DOMAIN..."
    
    cd $APP_DIR
    
    # Stop nginx temporarily
    docker-compose -f docker-compose.prod.yml stop nginx
    
    # Get initial certificate
    docker-compose -f docker-compose.prod.yml run --rm certbot \
        certonly --webroot --webroot-path=/var/www/certbot \
        --email $EMAIL --agree-tos --no-eff-email \
        -d $DOMAIN
    
    # Start nginx
    docker-compose -f docker-compose.prod.yml start nginx
    
    log "SSL certificates setup completed"
}

# Backup database
backup_database() {
    log "Creating database backup..."
    
    BACKUP_FILE="$BACKUP_DIR/mongodb-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    cd $APP_DIR
    
    # Create MongoDB backup
    docker-compose -f docker-compose.prod.yml exec -T mongo \
        mongodump --db analytics --archive | gzip > $BACKUP_FILE
    
    log "Database backup created: $BACKUP_FILE"
    
    # Keep only last 7 backups
    find $BACKUP_DIR -name "mongodb-backup-*.tar.gz" -type f -mtime +7 -delete
}

# Show logs
show_logs() {
    cd $APP_DIR
    docker-compose -f docker-compose.prod.yml logs -f --tail=100
}

# Health check
health_check() {
    log "Performing health check..."
    
    cd $APP_DIR
    
    # Check if containers are running
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        log "✓ Containers are running"
    else
        error "✗ Some containers are not running"
    fi
    
    # Check if application is responding
    if curl -f -s https://$DOMAIN/api/health > /dev/null; then
        log "✓ Application is responding"
    else
        warn "✗ Application health check failed"
    fi
    
    # Check SSL certificate
    if openssl s_client -connect $DOMAIN:443 -servername $DOMAIN < /dev/null 2>/dev/null | openssl x509 -noout -dates; then
        log "✓ SSL certificate is valid"
    else
        warn "✗ SSL certificate check failed"
    fi
}

# Main function
main() {
    case "$1" in
        "init")
            check_root
            log "Initializing SMAD Dashboard deployment..."
            install_docker
            setup_firewall
            setup_app_directory
            log "Initialization completed. Please upload your application files to $APP_DIR and run './deploy.sh update'"
            ;;
        "update")
            check_root
            deploy_app
            ;;
        "ssl")
            check_root
            setup_ssl
            ;;
        "backup")
            check_root
            backup_database
            ;;
        "logs")
            show_logs
            ;;
        "health")
            health_check
            ;;
        *)
            echo "Usage: $0 {init|update|ssl|backup|logs|health}"
            echo ""
            echo "Commands:"
            echo "  init    - Initialize server (install Docker, setup firewall, create directories)"
            echo "  update  - Deploy/update application"
            echo "  ssl     - Setup SSL certificates"
            echo "  backup  - Create database backup"
            echo "  logs    - Show application logs"
            echo "  health  - Perform health check"
            exit 1
            ;;
    esac
}

main "$@"