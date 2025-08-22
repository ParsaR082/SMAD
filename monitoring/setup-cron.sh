#!/bin/bash

# Setup Cron Jobs for SMAD Dashboard Monitoring and Maintenance
# This script sets up automated tasks for production deployment

set -e

# Configuration
APP_DIR="/opt/smad-dashboard"
MONITORING_DIR="$APP_DIR/monitoring"
BACKUP_DIR="/opt/backups/smad"
LOG_DIR="/var/log/smad"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[Cron Setup]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[Cron Setup] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[Cron Setup] ERROR:${NC} $1"
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
    fi
}

# Create necessary directories
setup_directories() {
    log "Creating necessary directories..."
    
    mkdir -p $BACKUP_DIR
    mkdir -p $LOG_DIR
    mkdir -p $MONITORING_DIR
    
    # Set permissions
    chmod 755 $BACKUP_DIR
    chmod 755 $LOG_DIR
    chmod 755 $MONITORING_DIR
    
    log "Directories created successfully"
}

# Create backup script
create_backup_script() {
    log "Creating backup script..."
    
    cat > $MONITORING_DIR/backup.sh << 'EOF'
#!/bin/bash

# SMAD Dashboard Backup Script

set -e

APP_DIR="/opt/smad-dashboard"
BACKUP_DIR="/opt/backups/smad"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/smad-backup-$DATE.tar.gz"
LOG_FILE="/var/log/smad/backup.log"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

log "Starting backup process..."

cd $APP_DIR

# Create MongoDB backup
log "Creating MongoDB backup..."
docker-compose -f docker-compose.prod.yml exec -T mongo \
    mongodump --db analytics --archive --gzip > "$BACKUP_DIR/mongodb-$DATE.gz"

# Create application backup (excluding node_modules and .git)
log "Creating application backup..."
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='certbot' \
    --exclude='.next' \
    -czf "$BACKUP_FILE" .

# Cleanup old backups (keep last 7 days)
log "Cleaning up old backups..."
find $BACKUP_DIR -name "smad-backup-*.tar.gz" -type f -mtime +7 -delete
find $BACKUP_DIR -name "mongodb-*.gz" -type f -mtime +7 -delete

log "Backup completed: $BACKUP_FILE"

# Check backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup size: $BACKUP_SIZE"

EOF

    chmod +x $MONITORING_DIR/backup.sh
    log "Backup script created"
}

# Create log rotation script
create_logrotate_script() {
    log "Creating log rotation configuration..."
    
    cat > /etc/logrotate.d/smad << 'EOF'
/var/log/smad/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        # Restart rsyslog if needed
        /bin/kill -HUP `cat /var/run/rsyslogd.pid 2> /dev/null` 2> /dev/null || true
    endscript
}

/var/log/smad-health.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF

    log "Log rotation configured"
}

# Create SSL renewal script
create_ssl_renewal_script() {
    log "Creating SSL renewal script..."
    
    cat > $MONITORING_DIR/renew-ssl.sh << 'EOF'
#!/bin/bash

# SSL Certificate Renewal Script

set -e

APP_DIR="/opt/smad-dashboard"
LOG_FILE="/var/log/smad/ssl-renewal.log"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

log "Starting SSL certificate renewal..."

cd $APP_DIR

# Renew certificates
docker-compose -f docker-compose.prod.yml run --rm certbot renew

# Reload nginx if renewal was successful
if [ $? -eq 0 ]; then
    log "Certificate renewal successful, reloading nginx..."
    docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
    log "Nginx reloaded successfully"
else
    log "Certificate renewal failed"
    exit 1
fi

log "SSL renewal process completed"

EOF

    chmod +x $MONITORING_DIR/renew-ssl.sh
    log "SSL renewal script created"
}

# Create system cleanup script
create_cleanup_script() {
    log "Creating system cleanup script..."
    
    cat > $MONITORING_DIR/cleanup.sh << 'EOF'
#!/bin/bash

# System Cleanup Script

set -e

LOG_FILE="/var/log/smad/cleanup.log"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

log "Starting system cleanup..."

# Clean Docker system
log "Cleaning Docker system..."
docker system prune -f
docker image prune -f
docker volume prune -f

# Clean old log files
log "Cleaning old log files..."
find /var/log -name "*.log" -type f -mtime +30 -delete 2>/dev/null || true

# Clean temporary files
log "Cleaning temporary files..."
find /tmp -type f -mtime +7 -delete 2>/dev/null || true

# Clean package cache
log "Cleaning package cache..."
apt-get autoremove -y
apt-get autoclean

log "System cleanup completed"

EOF

    chmod +x $MONITORING_DIR/cleanup.sh
    log "Cleanup script created"
}

# Setup cron jobs
setup_cron_jobs() {
    log "Setting up cron jobs..."
    
    # Create cron jobs
    cat > /tmp/smad-cron << EOF
# SMAD Dashboard Automated Tasks

# Health check every 5 minutes
*/5 * * * * $MONITORING_DIR/health-check.sh check >> /var/log/smad/health-check.log 2>&1

# Daily backup at 2:00 AM
0 2 * * * $MONITORING_DIR/backup.sh >> /var/log/smad/backup.log 2>&1

# SSL certificate renewal check twice daily
0 0,12 * * * $MONITORING_DIR/renew-ssl.sh >> /var/log/smad/ssl-renewal.log 2>&1

# Weekly system cleanup on Sunday at 3:00 AM
0 3 * * 0 $MONITORING_DIR/cleanup.sh >> /var/log/smad/cleanup.log 2>&1

# Weekly health report on Monday at 9:00 AM
0 9 * * 1 $MONITORING_DIR/health-check.sh report >> /var/log/smad/health-report.log 2>&1

# Monthly disk usage report on 1st day at 10:00 AM
0 10 1 * * df -h > /var/log/smad/disk-usage-\$(date +\%Y\%m).log 2>&1

EOF

    # Install cron jobs
    crontab /tmp/smad-cron
    rm /tmp/smad-cron
    
    log "Cron jobs installed successfully"
}

# Create monitoring dashboard script
create_monitoring_dashboard() {
    log "Creating monitoring dashboard script..."
    
    cat > $MONITORING_DIR/dashboard.sh << 'EOF'
#!/bin/bash

# SMAD Dashboard Monitoring Dashboard
# Displays real-time system status

APP_DIR="/opt/smad-dashboard"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

clear

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    SMAD Dashboard Status                     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# System Information
echo -e "${YELLOW}System Information:${NC}"
echo "Date: $(date)"
echo "Uptime: $(uptime -p)"
echo "Load: $(uptime | awk -F'load average:' '{print $2}')"
echo ""

# Container Status
echo -e "${YELLOW}Container Status:${NC}"
cd $APP_DIR
docker-compose -f docker-compose.prod.yml ps
echo ""

# Resource Usage
echo -e "${YELLOW}Resource Usage:${NC}"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')"
echo "Memory: $(free -h | grep Mem | awk '{print "Used: "$3" / Total: "$2" ("$3/$2*100"%)"}')"
echo "Disk: $(df -h / | tail -1 | awk '{print "Used: "$3" / Total: "$2" ("$5")"}')"
echo ""

# Recent Logs
echo -e "${YELLOW}Recent Application Logs (last 10 lines):${NC}"
docker-compose -f docker-compose.prod.yml logs --tail=10 web
echo ""

# SSL Certificate Status
echo -e "${YELLOW}SSL Certificate Status:${NC}"
if openssl s_client -connect smad.blckbrd.ir:443 -servername smad.blckbrd.ir < /dev/null 2>/dev/null | openssl x509 -noout -dates 2>/dev/null; then
    echo -e "${GREEN}✓ SSL Certificate is valid${NC}"
else
    echo -e "${RED}✗ SSL Certificate check failed${NC}"
fi
echo ""

# Application Health
echo -e "${YELLOW}Application Health:${NC}"
if curl -f -s -m 5 "https://smad.blckbrd.ir/api/health" > /dev/null; then
    echo -e "${GREEN}✓ Application is responding${NC}"
else
    echo -e "${RED}✗ Application is not responding${NC}"
fi

EOF

    chmod +x $MONITORING_DIR/dashboard.sh
    log "Monitoring dashboard created"
}

# Main function
main() {
    log "Setting up SMAD Dashboard monitoring and maintenance..."
    
    check_root
    setup_directories
    create_backup_script
    create_logrotate_script
    create_ssl_renewal_script
    create_cleanup_script
    create_monitoring_dashboard
    setup_cron_jobs
    
    log "Monitoring setup completed successfully!"
    log ""
    log "Available commands:"
    log "  $MONITORING_DIR/health-check.sh - Manual health check"
    log "  $MONITORING_DIR/backup.sh - Manual backup"
    log "  $MONITORING_DIR/dashboard.sh - View system status"
    log "  $MONITORING_DIR/cleanup.sh - Manual cleanup"
    log ""
    log "Automated tasks:"
    log "  - Health checks every 5 minutes"
    log "  - Daily backups at 2:00 AM"
    log "  - SSL renewal checks twice daily"
    log "  - Weekly system cleanup on Sundays"
    log "  - Weekly health reports on Mondays"
}

main