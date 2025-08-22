# Quick Deployment Guide

This guide shows how to deploy the SMAD Dashboard with a single command after cloning the repository.

## Prerequisites

- Docker and Docker Compose installed
- Git installed
- Port 3000 available on your system

## One-Command Deployment

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd smad-dashboard
   ```

2. **Deploy with Docker Compose:**
   ```bash
   docker-compose up -d --build
   ```

That's it! The application will be available at `http://localhost:3000`

## What Gets Deployed

The `docker-compose up -d --build` command automatically:

- ✅ Builds the Next.js web application
- ✅ Sets up MongoDB database with replica set
- ✅ Deploys the sentiment analysis API
- ✅ Configures networking between services
- ✅ Sets up health checks for all services
- ✅ Uses sensible default environment variables

## Services Included

| Service | Container Name | Port | Description |
|---------|----------------|------|-------------|
| Web App | `smad-web` | 3000 | Main dashboard application |
| Database | `smad-mongodb` | 27017 | MongoDB with analytics data |
| Sentiment API | `smad-sentiment-api` | 8000 | Python FastAPI for sentiment analysis |

## Checking Status

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f web
docker-compose logs -f mongo
docker-compose logs -f sentiment-api
```

## Stopping the Application

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (deletes data)
docker-compose down -v
```

## Environment Configuration

The application uses default values from `.env` file. For production deployment:

1. Copy `.env.production.template` to `.env`
2. Update the values as needed
3. Use `docker-compose -f docker-compose.prod.yml up -d --build` for production

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, modify the `docker-compose.yml` file:
```yaml
web:
  ports:
    - "8080:3000"  # Change 8080 to any available port
```

### Services Not Starting
Check service health:
```bash
docker-compose ps
docker-compose logs [service-name]
```

### Database Connection Issues
Ensure MongoDB is fully initialized:
```bash
docker-compose logs mongo
```
Look for "Replica set initialized" message.

## Production Deployment

For production deployment with SSL, domain configuration, and monitoring:
- See `DEPLOYMENT.md` for comprehensive production setup
- Use `docker-compose.prod.yml` for production configuration
- Run `./deploy.sh` for automated production deployment

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Verify all containers are running: `docker-compose ps`
3. Ensure ports are available: `netstat -tulpn | grep :3000`
4. Review the full deployment guide in `DEPLOYMENT.md`