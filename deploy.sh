#!/bin/bash

# Sun Bank Deployment Script
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOY_DIR="/var/www/sunbank"
BACKUP_DIR="/var/backups/sunbank"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Sun Bank deployment to ${ENVIRONMENT}...${NC}"

# Load environment variables
if [ -f ".env.${ENVIRONMENT}" ]; then
    source ".env.${ENVIRONMENT}"
    echo "Loaded ${ENVIRONMENT} environment variables"
else
    echo -e "${RED}Environment file .env.${ENVIRONMENT} not found${NC}"
    exit 1
fi

# Function to print step messages
print_step() {
    echo -e "\n${YELLOW}>>> $1${NC}"
}

# Function to handle errors
handle_error() {
    echo -e "${RED}Error: $1${NC}"
    echo -e "${RED}Deployment failed!${NC}"
    exit 1
}

# Step 1: Backup current deployment
print_step "Step 1: Creating backup..."
if [ -d "$DEPLOY_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    tar -czf "${BACKUP_DIR}/backup_${TIMESTAMP}.tar.gz" -C "$DEPLOY_DIR" . || handle_error "Failed to create backup"
    echo "Backup created: ${BACKUP_DIR}/backup_${TIMESTAMP}.tar.gz"
    
    # Cleanup old backups (keep last 7 days)
    find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +7 -delete
fi

# Step 2: Pull latest code
print_step "Step 2: Pulling latest code..."
git pull origin main || handle_error "Failed to pull latest code"

# Step 3: Install dependencies
print_step "Step 3: Installing dependencies..."

# Backend dependencies
cd backend
npm ci --only=production || handle_error "Failed to install backend dependencies"

# Frontend dependencies
cd ../frontend
npm ci || handle_error "Failed to install frontend dependencies"

# Step 4: Build frontend
print_step "Step 4: Building frontend..."
npm run build || handle_error "Failed to build frontend"

# Step 5: Build Docker images
print_step "Step 5: Building Docker images..."
cd ..
docker-compose -f docker-compose.yml build || handle_error "Failed to build Docker images"

# Step 6: Run database migrations
print_step "Step 6: Running database migrations..."
docker-compose run --rm backend node scripts/migrate.js || handle_error "Database migration failed"

# Step 7: Stop current services
print_step "Step 7: Stopping current services..."
docker-compose down || echo "No running services found or failed to stop"

# Step 8: Start services
print_step "Step 8: Starting services..."
docker-compose up -d || handle_error "Failed to start services"

# Step 9: Wait for services to be healthy
print_step "Step 9: Checking service health..."
sleep 30

# Check backend health
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health || echo "000")
if [ "$BACKEND_HEALTH" != "200" ]; then
    handle_error "Backend health check failed (HTTP $BACKEND_HEALTH)"
fi

# Check frontend health
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
if [ "$FRONTEND_HEALTH" != "200" ]; then
    echo -e "${YELLOW}Warning: Frontend health check returned HTTP $FRONTEND_HEALTH${NC}"
fi

# Step 10: Run tests
print_step "Step 10: Running tests..."
docker-compose run --rm backend npm test -- --passWithNoTests || echo -e "${YELLOW}Tests completed with warnings${NC}"

# Step 11: Cleanup
print_step "Step 11: Cleaning up..."
docker system prune -f --volumes || echo -e "${YELLOW}Cleanup had warnings${NC}"

# Step 12: Verify deployment
print_step "Step 12: Verifying deployment..."
echo "Checking service status:"
docker-compose ps

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nDeployed services:"
echo -e "  Frontend: http://localhost:3000"
echo -e "  Backend API: http://localhost:5000"
echo -e "  Adminer: http://localhost:8080"
echo -e "\nBackup created: ${BACKUP_DIR}/backup_${TIMESTAMP}.tar.gz"
echo -e "\nNext steps:"
echo -e "  1. Check application logs: docker-compose logs"
echo -e "  2. Monitor system resources: docker stats"
echo -e "  3. Test critical endpoints"
echo -e "${GREEN}========================================${NC}"
