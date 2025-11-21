# Deployment Guide

This guide explains how to deploy the Price Tracker API to a remote server using GitHub Actions.

## Prerequisites

- Remote server with:
  - Docker and Docker Compose installed
  - Nginx installed and configured
  - SSH access enabled
  - SSL certificates for `khdev.ru` domain (using Let's Encrypt)

## GitHub Repository Setup

### Required Secrets

Configure these secrets in your GitHub repository (Settings > Secrets and variables > Actions > Secrets):

1. `SERVER_SSH_HOST` - The hostname or IP address of your remote server (e.g., `khdev.ru` or `192.168.1.100`)
2. `SERVER_SSH_LOGIN` - SSH username (e.g., `root` or `deploy`)
3. `SERVER_SSH_PASSWORD` - SSH password for authentication
4. `BEARER_TOKENS` - Comma-separated list of valid bearer tokens for API authentication
5. `POSTGRES_PASSWORD` - Strong password for PostgreSQL database
6. `DRIZZLE_GATEWAY_MASTERPASS` - Master password for Drizzle Gateway web interface
7. `SSL_EMAIL` - Email address for Let's Encrypt SSL certificate notifications and renewal reminders

### Optional Secrets (for Email Functionality)

7. `SMTP_APP_PASS` - Application-specific password for SMTP authentication (e.g., Gmail app password)
   - **Note**: If not configured, email sending will be disabled and verification codes will be logged to console

### Repository Variables

Configure these variables in your GitHub repository (Settings > Secrets and variables > Actions > Variables):

1. `ALLOWED_DOMAINS` - Comma-separated list of allowed CORS domains (e.g., `khdev.ru,api.khdev.ru`)
2. `LOG_SECURITY_EVENTS` - Set to `true` to log security events (default: `true`)
3. `NODE_ENV` - Environment mode (default: `production`)
4. `PORT` - API server port (default: `3002`)
5. `TRUST_PROXY` - Set to `true` when behind a reverse proxy (default: `true`)
6. `POSTGRES_DB` - PostgreSQL database name (default: `price_tracker_db`)
7. `POSTGRES_USER` - PostgreSQL username (default: `postgres_user`)
8. `API_DOMAIN` - Domain for API service (e.g., `api.khdev.ru`)
9. `STUDIO_DOMAIN` - Domain for Drizzle Studio (e.g., `studio.khdev.ru`)
10. `SMTP_HOST` - SMTP server hostname (e.g., `smtp.gmail.com`)
11. `SMTP_PORT` - SMTP server port (e.g., `587` for TLS, `465` for SSL)
12. `SMTP_MAIL` - Email address to send from (e.g., `noreply@yourdomain.com`)

**Note**: For email functionality to work, you must configure all SMTP variables along with the `SMTP_APP_PASS` secret.

## Deployment Process

### Manual Deployment via GitHub Actions

1. Go to your repository on GitHub
2. Click on "Actions" tab
3. Select "Deploy to Remote Server" workflow from the left sidebar
4. Click "Run workflow" button
5. Select the branch you want to deploy (default: `main`)
6. Click "Run workflow" to start the deployment

### What Happens During Deployment

The deployment workflow performs the following steps:

1. **Validate Secrets**: Checks that all required secrets and variables are configured
2. **Checkout Code**: Checks out the selected branch
3. **Create Directories**: Creates necessary directories on the remote server
4. **Copy Files**: Transfers application files to `/var/www/ptracker-api`
5. **Create Environment File**: Generates `.env` file with configuration from GitHub secrets/variables
6. **Initialize SSL Certificates**: Automatically obtains free SSL certificates from Let's Encrypt (first deployment only)
7. **Deploy with Docker**: Builds and starts Docker containers using `docker-compose.yml`
8. **Verify Deployment**: Checks container status and logs

The deployment includes:
- **Nginx Reverse Proxy**: Automatically configured with SSL/TLS support
- **Let's Encrypt SSL**: Free SSL certificates with automatic renewal
- **HTTP to HTTPS Redirect**: All HTTP traffic is automatically redirected to HTTPS
- **Security Headers**: HSTS, X-Frame-Options, and other security headers are automatically added

## Server Structure

After deployment, the following structure is created on the remote server:

```
/var/www/ptracker-api/
├── .env                          # Environment variables (generated)
├── Dockerfile                    # Docker build configuration
├── docker-compose.yml            # Docker Compose config
├── start.sh                      # Container startup script
├── package.json                  # Node.js dependencies
├── tsconfig.json                 # TypeScript configuration
├── drizzle.config.ts            # Database ORM configuration
├── src/                         # Source code
├── drizzle/                     # Database migrations
└── logs/                        # Application logs
```

## Services

The deployment creates five Docker containers:

### 1. PostgreSQL Database (`price-tracker-postgres`)
- Internal database service
- Data persisted in Docker volume `postgres_data`
- Accessible internally on port 5432

### 2. Backend API (`price-tracker-api`)
- Runs the Price Tracker API
- Exposed via nginx reverse proxy at `https://api.khdev.ru`
- Internal port: 3002

### 3. Drizzle Gateway (`price-tracker-drizzle-gateway`)
- Database management UI
- Exposed via nginx reverse proxy at `https://studio.khdev.ru`
- Internal port: 4983

### 4. Nginx (`price-tracker-nginx`)
- Reverse proxy with SSL/TLS termination
- Serves both API and Drizzle Studio
- Handles SSL certificate validation
- External ports: 80 (HTTP), 443 (HTTPS)

### 5. Certbot (`price-tracker-certbot`)
- Manages SSL certificates from Let's Encrypt
- Automatically renews certificates every 12 hours
- Runs in the background

## Domain Configuration

### API Endpoint
- **URL**: `https://api.khdev.ru`
- **Purpose**: Main API endpoint for the application
- **Example**: `https://api.khdev.ru/api/auth/register`

### Drizzle Studio
- **URL**: `https://studio.khdev.ru`
- **Purpose**: Database management interface
- **Security**: Consider enabling basic authentication in nginx config

## Post-Deployment Verification

After deployment, verify the services are running:

```bash
# SSH into the server
ssh user@khdev.ru

# Check container status
cd /var/www/ptracker-api
docker-compose ps

# View logs
docker-compose logs -f backend

# Test API endpoint
curl https://api.khdev.ru/api

# Test Drizzle Studio
curl https://studio.khdev.ru
```

## Nginx Configuration

Nginx is automatically configured and deployed as part of the Docker Compose stack. The configuration includes:

1. **HTTP to HTTPS redirect** for both subdomains
2. **Reverse proxy** to Docker containers (backend:3002 and drizzle-gateway:4983)
3. **SSL/TLS termination** with Let's Encrypt certificates
4. **Security headers** (HSTS, X-Frame-Options, etc.)
5. **WebSocket support** for Drizzle Studio
6. **Access and error logging**
7. **Automatic SSL certificate renewal**

### Automated SSL Setup

SSL certificates are automatically obtained and configured during the first deployment. The process:

1. Creates dummy self-signed certificates for initial nginx startup
2. Starts nginx to serve ACME challenges
3. Requests real SSL certificates from Let's Encrypt
4. Reloads nginx with the new certificates
5. Configures automatic renewal every 12 hours

### Manual SSL Initialization (Optional)

If you need to initialize SSL certificates separately or the automatic process fails:

```bash
# SSH into the server
ssh user@khdev.ru

# Navigate to the deployment directory
cd /var/www/ptracker-api

# Run the SSL initialization script
API_DOMAIN=api.khdev.ru \
STUDIO_DOMAIN=studio.khdev.ru \
EMAIL=admin@yourdomain.com \
./scripts/init-ssl.sh
```

### Nginx Configuration Files

The nginx configuration is stored in the `nginx/` directory:
- `nginx/nginx.conf` - Main nginx configuration
- `nginx/conf.d/api.conf.template` - API reverse proxy configuration
- `nginx/conf.d/studio.conf.template` - Drizzle Studio reverse proxy configuration
- `nginx/docker-entrypoint.sh` - Startup script that processes templates

These files are automatically built into the nginx Docker image.

## SSL Certificates

SSL certificates are automatically managed by the deployment process using Let's Encrypt and certbot.

### Automatic Certificate Management

The deployment includes:
- **Initial Certificate Generation**: First deployment automatically obtains SSL certificates
- **Auto-Renewal**: Certificates are automatically renewed every 12 hours via the certbot container
- **Certificate Storage**: Certificates are stored in `./certbot/conf/live/`
- **Zero Downtime**: Certificate renewal happens without service interruption

### Certificate Files Location

Certificates are stored on the server at:
- `/var/www/ptracker-api/certbot/conf/live/api.khdev.ru/`
  - `fullchain.pem` - Full certificate chain
  - `privkey.pem` - Private key
  - `chain.pem` - Certificate chain
- `/var/www/ptracker-api/certbot/conf/live/studio.khdev.ru/`
  - Same structure as above

### Manual Certificate Setup

If you need to manually obtain certificates or the automated process fails:

```bash
# SSH into the server
ssh user@khdev.ru

cd /var/www/ptracker-api

# Use the initialization script
API_DOMAIN=api.khdev.ru \
STUDIO_DOMAIN=studio.khdev.ru \
EMAIL=admin@yourdomain.com \
./scripts/init-ssl.sh
```

### Certificate Renewal

Certificates are automatically renewed by the certbot container. To manually trigger renewal:

```bash
cd /var/www/ptracker-api

# Trigger manual renewal
docker-compose exec certbot certbot renew

# Reload nginx to use renewed certificates
docker-compose exec nginx nginx -s reload
```

### Troubleshooting SSL

If SSL certificate generation fails:

1. **Check DNS**: Ensure your domains point to the server
   ```bash
   nslookup api.khdev.ru
   nslookup studio.khdev.ru
   ```

2. **Check Port 80 is Open**: Let's Encrypt requires port 80 for validation
   ```bash
   sudo netstat -tulpn | grep :80
   ```

3. **Check Certbot Logs**:
   ```bash
   docker-compose logs certbot
   ```

4. **Verify Domain Ownership**: Make sure `.well-known/acme-challenge/` is accessible
   ```bash
   curl http://api.khdev.ru/.well-known/acme-challenge/test
   ```

## Troubleshooting

### Check Container Logs
```bash
cd /var/www/ptracker-api
docker-compose logs -f
```

### Restart Services
```bash
cd /var/www/ptracker-api
docker-compose restart
```

### Rebuild Containers
```bash
cd /var/www/ptracker-api
docker-compose up -d --build
```

### Check Nginx Status
```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/api.khdev.ru.error.log
```

### Database Issues
```bash
# Access database shell
docker-compose exec postgres psql -U postgres -d price_tracker_db

# Check database migrations
docker-compose exec backend npx drizzle-kit push
```

## Security Considerations

1. **BEARER_TOKENS**: Use strong, random tokens (generate with `openssl rand -base64 32`)
2. **Database Password**: Change default postgres password in production
3. **Drizzle Studio**: Consider adding basic auth or IP restrictions in nginx
4. **SSH Access**: Use SSH keys instead of passwords when possible
5. **Firewall**: Ensure only necessary ports are open (80, 443)
6. **Regular Updates**: Keep Docker images and system packages updated

## Rollback

To rollback to a previous version:

1. Run the deployment workflow with the previous branch/commit
2. Or manually on the server:
   ```bash
   cd /var/www/ptracker-api
   git checkout <previous-commit>
   docker-compose up -d --build
   ```

## Monitoring

Monitor your deployment with:

```bash
# Container resource usage
docker stats

# Container health status
docker-compose ps

# Application logs
docker-compose logs -f backend

# Nginx access logs
sudo tail -f /var/log/nginx/api.khdev.ru.access.log
```
