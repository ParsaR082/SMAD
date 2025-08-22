#!/bin/bash

# SMAD Dashboard Health Check and Monitoring Script
# This script performs comprehensive health checks and sends alerts if needed

set -e

# Configuration
DOMAIN="smad.blckbrd.ir"
APP_DIR="/opt/smad-dashboard"
LOG_FILE="/var/log/smad-health.log"
ALERT_EMAIL="admin@blckbrd.ir"
SLACK_WEBHOOK=""  # Add your Slack webhook URL if needed

# Thresholds
CPU_THRESHOLD=80
MEMORY_THRESHOLD=80
DISK_THRESHOLD=85
RESPONSE_TIME_THRESHOLD=5000  # milliseconds

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a $LOG_FILE
}

# Send alert function
send_alert() {
    local message="$1"
    local severity="$2"
    
    # Log the alert
    if [ "$severity" = "critical" ]; then
        error "ALERT: $message"
    else
        warn "ALERT: $message"
    fi
    
    # Send email alert (requires mailutils)
    if command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "SMAD Dashboard Alert - $severity" $ALERT_EMAIL
    fi
    
    # Send Slack alert
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 SMAD Dashboard Alert\\n**Severity:** $severity\\n**Message:** $message\"}" \
            $SLACK_WEBHOOK
    fi
}

# Check container health
check_containers() {
    log "Checking container health..."
    
    cd $APP_DIR
    
    # Get container status
    local containers=("smad-web-prod" "smad-mongodb-prod" "smad-sentiment-api-prod" "smad-nginx-prod")
    local failed_containers=()
    
    for container in "${containers[@]}"; do
        if ! docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container.*Up"; then
            failed_containers+=("$container")
        fi
    done
    
    if [ ${#failed_containers[@]} -eq 0 ]; then
        log "✓ All containers are running"
        return 0
    else
        local message="Failed containers: ${failed_containers[*]}"
        send_alert "$message" "critical"
        return 1
    fi
}

# Check application response
check_application_response() {
    log "Checking application response..."
    
    # Check main application
    local start_time=$(date +%s%3N)
    if curl -f -s -m 10 "https://$DOMAIN" > /dev/null; then
        local end_time=$(date +%s%3N)
        local response_time=$((end_time - start_time))
        
        if [ $response_time -gt $RESPONSE_TIME_THRESHOLD ]; then
            warn "Application response time is high: ${response_time}ms"
        else
            log "✓ Application is responding (${response_time}ms)"
        fi
    else
        send_alert "Application is not responding at https://$DOMAIN" "critical"
        return 1
    fi
    
    # Check API health endpoint
    if curl -f -s -m 5 "https://$DOMAIN/api/health" > /dev/null; then
        log "✓ API health check passed"
    else
        send_alert "API health check failed" "high"
        return 1
    fi
    
    return 0
}

# Check SSL certificate
check_ssl_certificate() {
    log "Checking SSL certificate..."
    
    # Check certificate expiration
    local cert_info=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        local expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
        local expiry_timestamp=$(date -d "$expiry_date" +%s)
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [ $days_until_expiry -lt 7 ]; then
            send_alert "SSL certificate expires in $days_until_expiry days" "high"
        elif [ $days_until_expiry -lt 30 ]; then
            warn "SSL certificate expires in $days_until_expiry days"
        else
            log "✓ SSL certificate is valid (expires in $days_until_expiry days)"
        fi
    else
        send_alert "Failed to check SSL certificate" "medium"
        return 1
    fi
    
    return 0
}

# Check system resources
check_system_resources() {
    log "Checking system resources..."
    
    # Check CPU usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    cpu_usage=${cpu_usage%.*}  # Remove decimal part
    
    if [ $cpu_usage -gt $CPU_THRESHOLD ]; then
        send_alert "High CPU usage: ${cpu_usage}%" "medium"
    else
        log "✓ CPU usage: ${cpu_usage}%"
    fi
    
    # Check memory usage
    local memory_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    
    if [ $memory_usage -gt $MEMORY_THRESHOLD ]; then
        send_alert "High memory usage: ${memory_usage}%" "medium"
    else
        log "✓ Memory usage: ${memory_usage}%"
    fi
    
    # Check disk usage
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
    
    if [ $disk_usage -gt $DISK_THRESHOLD ]; then
        send_alert "High disk usage: ${disk_usage}%" "high"
    else
        log "✓ Disk usage: ${disk_usage}%"
    fi
}

# Check database connectivity
check_database() {
    log "Checking database connectivity..."
    
    cd $APP_DIR
    
    # Test MongoDB connection
    if docker-compose -f docker-compose.prod.yml exec -T mongo mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
        log "✓ Database is accessible"
    else
        send_alert "Database connectivity failed" "critical"
        return 1
    fi
    
    # Check database size
    local db_size=$(docker-compose -f docker-compose.prod.yml exec -T mongo mongosh --quiet --eval "db.stats().dataSize" analytics 2>/dev/null)
    if [ -n "$db_size" ]; then
        local db_size_mb=$((db_size / 1024 / 1024))
        log "✓ Database size: ${db_size_mb}MB"
    fi
    
    return 0
}

# Check log files for errors
check_logs() {
    log "Checking application logs for errors..."
    
    cd $APP_DIR
    
    # Check for recent errors in logs
    local error_count=$(docker-compose -f docker-compose.prod.yml logs --since="1h" 2>&1 | grep -i "error\|exception\|failed" | wc -l)
    
    if [ $error_count -gt 10 ]; then
        send_alert "High number of errors in logs: $error_count in the last hour" "medium"
    elif [ $error_count -gt 0 ]; then
        warn "Found $error_count errors in logs (last hour)"
    else
        log "✓ No significant errors in recent logs"
    fi
}

# Generate health report
generate_report() {
    log "Generating health report..."
    
    local report_file="/tmp/smad-health-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "SMAD Dashboard Health Report"
        echo "Generated: $(date)"
        echo "Domain: $DOMAIN"
        echo "========================================"
        echo ""
        
        echo "Container Status:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep smad
        echo ""
        
        echo "System Resources:"
        echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')"
        echo "Memory: $(free -h | grep Mem | awk '{print $3"/"$2}')"
        echo "Disk: $(df -h / | tail -1 | awk '{print $3"/"$2" ("$5" used)"}')"
        echo ""
        
        echo "Recent Logs (last 50 lines):"
        cd $APP_DIR && docker-compose -f docker-compose.prod.yml logs --tail=50
        
    } > $report_file
    
    log "Health report saved to: $report_file"
}

# Main health check function
main() {
    log "Starting SMAD Dashboard health check..."
    
    local checks_passed=0
    local total_checks=6
    
    # Run all checks
    check_containers && ((checks_passed++))
    check_application_response && ((checks_passed++))
    check_ssl_certificate && ((checks_passed++))
    check_system_resources && ((checks_passed++))
    check_database && ((checks_passed++))
    check_logs && ((checks_passed++))
    
    # Summary
    log "Health check completed: $checks_passed/$total_checks checks passed"
    
    if [ $checks_passed -eq $total_checks ]; then
        log "✓ All systems are healthy"
        exit 0
    else
        local failed_checks=$((total_checks - checks_passed))
        error "$failed_checks checks failed"
        exit 1
    fi
}

# Handle command line arguments
case "${1:-check}" in
    "check")
        main
        ;;
    "report")
        generate_report
        ;;
    "containers")
        check_containers
        ;;
    "ssl")
        check_ssl_certificate
        ;;
    "resources")
        check_system_resources
        ;;
    "database")
        check_database
        ;;
    *)
        echo "Usage: $0 {check|report|containers|ssl|resources|database}"
        echo ""
        echo "Commands:"
        echo "  check      - Run all health checks (default)"
        echo "  report     - Generate detailed health report"
        echo "  containers - Check container status only"
        echo "  ssl        - Check SSL certificate only"
        echo "  resources  - Check system resources only"
        echo "  database   - Check database connectivity only"
        exit 1
        ;;
esac