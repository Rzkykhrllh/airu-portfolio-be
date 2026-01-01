# Deployment Guide - Docker to VM

## Prerequisites di VM
- Docker installed
- Docker Compose installed
- Git installed

## Step 1: Prepare VM

```bash
# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

## Step 2: Clone Repository ke VM

```bash
# Clone repository
git clone https://github.com/Rzkykhrllh/airu-portfolio-be.git
cd airu-portfolio-be

# Checkout main branch
git checkout main
```

## Step 3: Setup Environment Variables

Create `.env` file di VM:

```bash
nano .env
```

Required environment variables:
```env
# Database
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_strong_password
POSTGRES_DB=portfolio_db
DATABASE_URL=postgresql://your_postgres_user:your_strong_password@postgres:5432/portfolio_db

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars

# Cloudflare R2
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# Server
PORT=8080
NODE_ENV=production
```

## Step 4: Build and Run dengan Docker Compose

```bash
# Build images
docker compose build

# Start services
docker compose up -d

# Check logs
docker compose logs -f api

# Check status
docker compose ps
```

## Step 5: Verify Deployment

```bash
# Test API health
curl http://localhost:8080/health

# Check logs jika ada error
docker compose logs api
docker compose logs postgres
```

## Step 6: Run Database Migrations (First Time Only)

Migrations akan auto-run di container startup. Tapi kalau perlu manual:

```bash
# Run migrations
docker compose exec api npx prisma migrate deploy

# Generate Prisma client (kalau belum)
docker compose exec api npx prisma generate
```

## Management Commands

### Stop containers
```bash
docker compose down
```

### Stop and remove volumes (HATI-HATI: akan hapus data!)
```bash
docker compose down -v
```

### Restart containers
```bash
docker compose restart
```

### Restart hanya api (tanpa database)
```bash
docker compose restart api
```

### View logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f postgres
```

### Update deployment (pull latest code)
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose up -d --build

# Or rebuild specific service
docker compose up -d --build api
```

## Step 7: Setup Nginx Reverse Proxy (Optional tapi Recommended)

Install Nginx:
```bash
sudo apt-get install nginx
```

Create Nginx config:
```bash
sudo nano /etc/nginx/sites-available/portfolio-api
```

Nginx config:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # Ganti dengan domain lu

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/portfolio-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 8: Setup SSL dengan Certbot (Optional tapi Recommended)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Troubleshooting

### Container tidak start
```bash
# Check logs
docker compose logs api

# Check container status
docker compose ps

# Rebuild from scratch
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Database connection error
```bash
# Check PostgreSQL is running
docker compose ps postgres

# Check database logs
docker compose logs postgres

# Verify DATABASE_URL in .env
docker compose exec api env | grep DATABASE_URL
```

### Prisma migration failed
```bash
# Manual migration
docker compose exec api npx prisma migrate deploy

# Reset database (HATI-HATI!)
docker compose exec api npx prisma migrate reset
```

### Port already in use
```bash
# Check what's using port 8080
sudo lsof -i :8080

# Change port di docker-compose.yml
# ports:
#   - "3000:8080"  # host:container
```

## Production Checklist

- [ ] .env file configured dengan production values
- [ ] JWT_SECRET is strong and random
- [ ] Database credentials are strong
- [ ] Nginx reverse proxy setup
- [ ] SSL certificate configured
- [ ] Firewall configured (allow 80, 443, block 8080 from public)
- [ ] Docker containers auto-restart on reboot
- [ ] Log rotation configured
- [ ] Backup strategy for PostgreSQL data
- [ ] Monitoring setup (optional)

## Backup Database

```bash
# Backup
docker compose exec postgres pg_dump -U your_postgres_user portfolio_db > backup.sql

# Restore
docker compose exec -T postgres psql -U your_postgres_user portfolio_db < backup.sql
```

## Auto-start on Boot

Docker containers with `restart: unless-stopped` will auto-start on reboot. Verify:

```bash
# Enable Docker to start on boot
sudo systemctl enable docker

# Check status
sudo systemctl status docker
```

---

**Notes:**
- Container names: `airu-portfolio-api`, `airu-portfolio-db`
- Container port: 8080
- Host exposed port: 8080 (bisa diganti di docker-compose.yml)
- Database volume: `pgdata` (persistent)
- Network: `airu-portfolio-network`
