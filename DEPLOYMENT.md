# SMAD Dashboard Deployment Guide

This guide provides step-by-step instructions for deploying the SMAD Dashboard to a VPS server with Docker, Nginx, and SSL certificates.

## Prerequisites

- VPS server with Ubuntu 20.04+ or similar Linux distribution
- Domain name pointing to your VPS IP (smad.blckbrd.ir)
- Root or sudo access to the server
- At least 2GB RAM and 20GB storage

## Quick Deployment

### 1. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git unzip

# Clone the repository
git clone <your-repository-url> /opt/smad-dashboard
cd /opt/smad-dashboard
```

### 2. Run Deployment Script

```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment (will install Docker, configure firewall, etc.)
sudo ./deploy.sh
```

### 3. Configure Environment

```bash
# Copy and configure environment files
cp .env.production.template .env.production
cp .env.docker .env

# Edit environment files with your settings
nano .env.production
nano .env
```

### 4. Setup SSL Certificates

```bash
# Make SSL setup script executable
chmod +x init-letsencrypt.sh

# Run SSL setup (replace email with your email)
sudo ./init-letsencrypt.sh your-email@example.com
```

### 5. Start Services

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### 6. Setup Monitoring

```bash
# Setup automated monitoring and backups
chmod +x monitoring/setup-cron.sh
sudo monitoring/setup-cron.sh
```

## Manual Deployment Steps

### 1. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Start Docker service
sudo systemctl enable docker
sudo systemctl start docker
```

### 2. Configure Firewall

```bash
# Install and configure UFW
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

### 3. Setup Application

```bash
# Create application directory
sudo mkdir -p /opt/smad-dashboard
sudo chown $USER:$USER /opt/smad-dashboard

# Clone repository
git clone <your-repository-url> /opt/smad-dashboard
cd /opt/smad-dashboard
```

### 4. Configure Environment Variables

Edit `.env.production` with your specific settings:

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://smad.blckbrd.ir
NEXT_PUBLIC_API_URL=https://smad.blckbrd.ir/api

# Database
MONGODB_URI=mongodb://mongo:27017/analytics
MONGODB_DB_NAME=analytics

# Security
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=https://smad.blckbrd.ir

# Social Media APIs
TWITTER_BEARER_TOKEN=your-twitter-token
INSTAGRAM_ACCESS_TOKEN=your-instagram-token

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

Edit `.env.docker` for Docker-specific settings:

```bash
# Domain and SSL
DOMAIN=smad.blckbrd.ir
EMAIL=your-email@example.com

# Application
APP_PORT=3000
NGINX_PORT=80
NGINX_SSL_PORT=443

# Database
MONGO_PORT=27017
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=secure-password-here
```

### 5. Start Services

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 6. Setup SSL Certificates

```bash
# Run Let's Encrypt setup
./init-letsencrypt.sh your-email@example.com
```

## Service Management

### Start Services
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Stop Services
```bash
docker-compose -f docker-compose.prod.yml down
```

### Restart Services
```bash
docker-compose -f docker-compose.prod.yml restart
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f web
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

## Monitoring and Maintenance

### Health Checks
```bash
# Manual health check
./monitoring/health-check.sh check

# View monitoring dashboard
./monitoring/dashboard.sh
```

### Backups
```bash
# Manual backup
./monitoring/backup.sh

# View backup files
ls -la /opt/backups/smad/
```

### SSL Certificate Renewal
```bash
# Manual renewal
./monitoring/renew-ssl.sh

# Check certificate expiry
openssl s_client -connect smad.blckbrd.ir:443 -servername smad.blckbrd.ir < /dev/null 2>/dev/null | openssl x509 -noout -dates
```

### System Cleanup
```bash
# Manual cleanup
./monitoring/cleanup.sh
```

## Troubleshooting

### Common Issues

1. **Port 80/443 already in use**
   ```bash
   sudo netstat -tulpn | grep :80
   sudo systemctl stop apache2  # or nginx
   ```

2. **Docker permission denied**
   ```bash
   sudo usermod -aG docker $USER
   # Logout and login again
   ```

3. **SSL certificate issues**
   ```bash
   # Check certificate status
   docker-compose -f docker-compose.prod.yml logs certbot
   
   # Recreate certificates
   docker-compose -f docker-compose.prod.yml down
   sudo rm -rf certbot/
   ./init-letsencrypt.sh your-email@example.com
   ```

4. **Database connection issues**
   ```bash
   # Check MongoDB logs
   docker-compose -f docker-compose.prod.yml logs mongo
   
   # Connect to MongoDB
   docker-compose -f docker-compose.prod.yml exec mongo mongosh
   ```

5. **Application not responding**
   ```bash
   # Check application logs
   docker-compose -f docker-compose.prod.yml logs web
   
   # Restart application
   docker-compose -f docker-compose.prod.yml restart web
   ```

### Log Locations

- Application logs: `docker-compose logs web`
- Nginx logs: `docker-compose logs nginx`
- MongoDB logs: `docker-compose logs mongo`
- System logs: `/var/log/smad/`
- Health check logs: `/var/log/smad/health-check.log`
- Backup logs: `/var/log/smad/backup.log`

### Performance Monitoring

```bash
# Container resource usage
docker stats

# System resource usage
htop

# Disk usage
df -h
du -sh /opt/smad-dashboard/
```

## Security Considerations

1. **Firewall Configuration**
   - Only allow necessary ports (22, 80, 443)
   - Consider changing SSH port from default 22

2. **Regular Updates**
   - Keep system packages updated
   - Update Docker images regularly
   - Monitor security advisories

3. **Backup Strategy**
   - Automated daily backups are configured
   - Store backups in multiple locations
   - Test backup restoration regularly

4. **SSL/TLS**
   - Certificates auto-renew via cron job
   - Strong cipher suites configured in Nginx
   - HSTS headers enabled

5. **Database Security**
   - MongoDB runs in Docker network (not exposed)
   - Strong passwords for database access
   - Regular database backups

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review application and system logs
3. Check Docker container status
4. Verify environment configuration

## File Structure

```
/opt/smad-dashboard/
├── docker-compose.prod.yml     # Production Docker Compose
├── Dockerfile                  # Application container
├── deploy.sh                   # Deployment script
├── init-letsencrypt.sh        # SSL setup script
├── .env.production            # Production environment
├── .env.docker               # Docker environment
├── nginx/                    # Nginx configuration
│   ├── nginx.conf
│   └── conf.d/
│       └── smad.conf
├── monitoring/               # Monitoring scripts
│   ├── health-check.sh
│   ├── setup-cron.sh
│   ├── backup.sh
│   ├── dashboard.sh
│   └── cleanup.sh
└── certbot/                 # SSL certificates (auto-generated)
```