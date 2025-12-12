#!/bin/bash
set -e

echo "=== VPS Setup for study-sesh ==="

# Update system
echo "Updating system..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install -y docker-compose
rm get-docker.sh

# Install nginx
echo "Installing nginx..."
sudo apt install -y nginx

# Get domain and API key
read -p "Enter your domain (e.g., study-sesh.com): " DOMAIN
read -p "Enter your Hugging Face API key: " HF_KEY

# Clone/setup repo
echo "Setting up application..."
REPO_DIR="/var/www/study-sesh"
if [ ! -d "$REPO_DIR" ]; then
    read -p "Enter git repo URL: " REPO_URL
    sudo git clone "$REPO_URL" "$REPO_DIR"
fi

cd "$REPO_DIR"

# Create .env
echo "HUGGINGFACE_API_KEY=$HF_KEY" | sudo tee .env > /dev/null

# Configure nginx
echo "Configuring nginx..."
sudo tee /etc/nginx/sites-available/study-sesh > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/study-sesh /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Start Docker
echo "Starting Docker container..."
sudo docker-compose up -d

# Install SSL
read -p "Install SSL with Let's Encrypt? (y/n): " INSTALL_SSL
if [ "$INSTALL_SSL" = "y" ]; then
    sudo apt install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email
fi

echo ""
echo "=== Setup Complete ==="
echo "Your app is running at: http://$DOMAIN"
echo ""
echo "Useful commands:"
echo "  View logs: cd $REPO_DIR && sudo docker-compose logs -f"
echo "  Restart: cd $REPO_DIR && sudo docker-compose restart"
echo "  Update: cd $REPO_DIR && git pull && sudo docker-compose up -d --build"
