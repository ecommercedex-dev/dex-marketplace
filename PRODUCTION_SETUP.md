# DEX Production Setup Guide

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- SSL Certificate
- Domain name

## Quick Start

1. **Environment Setup**
   ```bash
   cp DEX_BACKEND/.env.example DEX_BACKEND/.env
   # Edit .env with your production values
   ```

2. **Deploy**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

## Manual Setup

### 1. Database Setup
```bash
# Create database
createdb dex_db

# Run migrations
cd DEX_BACKEND
npx prisma migrate deploy
```

### 2. SSL Certificate
```bash
# Place your SSL files in ./ssl/
# cert.pem - SSL certificate
# key.pem - Private key
```

### 3. Environment Variables
```bash
# Required production variables
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@localhost:5432/dex_db
JWT_SECRET=your-super-secure-secret
FRONTEND_URL=https://yourdomain.com
```

### 4. Start Services
```bash
docker-compose up -d
```

## Monitoring

- **Health Check**: `GET /health`
- **Logs**: `docker-compose logs -f api`
- **Metrics**: Check `logs/` directory

## Security Checklist

- ✅ HTTPS enabled
- ✅ Security headers configured
- ✅ Rate limiting active
- ✅ Input validation implemented
- ✅ File upload restrictions
- ✅ Database connection secured
- ✅ JWT secrets rotated
- ✅ Error logging enabled

## Performance Optimizations

- ✅ Gzip compression
- ✅ Static file caching
- ✅ Database connection pooling
- ✅ Request timeout handling
- ✅ Memory usage monitoring

## Backup Strategy

1. **Database Backup**
   ```bash
   pg_dump dex_db > backup_$(date +%Y%m%d).sql
   ```

2. **File Backup**
   ```bash
   tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
   ```

## Scaling Considerations

- Use load balancer for multiple API instances
- Implement Redis for session storage
- Consider CDN for static assets
- Monitor database performance
- Set up auto-scaling policies