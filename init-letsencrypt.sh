#!/bin/bash

# Let's Encrypt SSL Certificate Initialization Script
# This script sets up SSL certificates for smad.blckbrd.ir

set -e

# Configuration
DOMAIN="smad.blckbrd.ir"
EMAIL="admin@blckbrd.ir"  # Change this to your email address
DATA_PATH="./certbot"
RSA_KEY_SIZE=4096
REGEX="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[SSL Setup]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[SSL Setup] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[SSL Setup] ERROR:${NC} $1"
    exit 1
}

# Validate email format
validate_email() {
    if [[ ! $EMAIL =~ $REGEX ]]; then
        error "Invalid email format: $EMAIL"
    fi
}

# Check if certificate already exists
check_existing_cert() {
    if [ -d "$DATA_PATH/conf/live/$DOMAIN" ]; then
        warn "Certificate for $DOMAIN already exists."
        read -p "Do you want to recreate it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Keeping existing certificate."
            exit 0
        fi
        log "Removing existing certificate..."
        rm -rf "$DATA_PATH/conf/live/$DOMAIN"
        rm -rf "$DATA_PATH/conf/archive/$DOMAIN"
        rm -rf "$DATA_PATH/conf/renewal/$DOMAIN.conf"
    fi
}

# Create dummy certificate for nginx to start
create_dummy_cert() {
    log "Creating dummy certificate for $DOMAIN..."
    
    mkdir -p "$DATA_PATH/conf/live/$DOMAIN"
    
    # Generate dummy certificate
    openssl req -x509 -nodes -newkey rsa:$RSA_KEY_SIZE -days 1 \
        -keyout "$DATA_PATH/conf/live/$DOMAIN/privkey.pem" \
        -out "$DATA_PATH/conf/live/$DOMAIN/fullchain.pem" \
        -subj "/CN=localhost"
    
    log "Dummy certificate created"
}

# Start nginx with dummy certificate
start_nginx() {
    log "Starting nginx..."
    docker-compose -f docker-compose.prod.yml up --force-recreate -d nginx
    
    # Wait for nginx to start
    sleep 5
    
    if ! docker-compose -f docker-compose.prod.yml ps nginx | grep -q "Up"; then
        error "Failed to start nginx"
    fi
    
    log "Nginx started successfully"
}

# Delete dummy certificate
delete_dummy_cert() {
    log "Deleting dummy certificate..."
    rm -rf "$DATA_PATH/conf/live/$DOMAIN"
}

# Request Let's Encrypt certificate
request_certificate() {
    log "Requesting Let's Encrypt certificate for $DOMAIN..."
    
    # Select appropriate email arg
    case "$EMAIL" in
        "") email_arg="--register-unsafely-without-email" ;;
        *) email_arg="--email $EMAIL" ;;
    esac
    
    # Enable staging mode if needed (remove --staging for production)
    docker-compose -f docker-compose.prod.yml run --rm --entrypoint "\
        certbot certonly --webroot -w /var/www/certbot \
        $email_arg \
        -d $DOMAIN \
        --rsa-key-size $RSA_KEY_SIZE \
        --agree-tos \
        --force-renewal" certbot
    
    if [ $? -eq 0 ]; then
        log "Certificate obtained successfully"
    else
        error "Failed to obtain certificate"
    fi
}

# Reload nginx
reload_nginx() {
    log "Reloading nginx..."
    docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
    
    if [ $? -eq 0 ]; then
        log "Nginx reloaded successfully"
    else
        warn "Failed to reload nginx, restarting container..."
        docker-compose -f docker-compose.prod.yml restart nginx
    fi
}

# Verify certificate
verify_certificate() {
    log "Verifying certificate..."
    
    # Check if certificate files exist
    if [ ! -f "$DATA_PATH/conf/live/$DOMAIN/fullchain.pem" ] || [ ! -f "$DATA_PATH/conf/live/$DOMAIN/privkey.pem" ]; then
        error "Certificate files not found"
    fi
    
    # Test HTTPS connection
    if curl -f -s "https://$DOMAIN" > /dev/null; then
        log "✓ HTTPS is working correctly"
    else
        warn "HTTPS test failed - please check your DNS and firewall settings"
    fi
    
    # Show certificate info
    log "Certificate information:"
    openssl x509 -in "$DATA_PATH/conf/live/$DOMAIN/fullchain.pem" -text -noout | grep -E "Subject:|Not After :"
}

# Main execution
main() {
    log "Initializing Let's Encrypt SSL certificate for $DOMAIN"
    
    # Validate configuration
    validate_email
    
    # Check for existing certificates
    check_existing_cert
    
    # Create directories
    mkdir -p "$DATA_PATH/conf"
    mkdir -p "$DATA_PATH/www"
    
    # Create dummy certificate
    create_dummy_cert
    
    # Start nginx
    start_nginx
    
    # Delete dummy certificate
    delete_dummy_cert
    
    # Request real certificate
    request_certificate
    
    # Reload nginx
    reload_nginx
    
    # Verify certificate
    verify_certificate
    
    log "SSL certificate setup completed successfully!"
    log "Your site should now be accessible at https://$DOMAIN"
}

# Check if docker-compose file exists
if [ ! -f "docker-compose.prod.yml" ]; then
    error "docker-compose.prod.yml not found. Please run this script from the project root directory."
fi

# Run main function
main