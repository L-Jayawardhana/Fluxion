#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# One-time SSL setup on the Azure VM
# Installs nginx + certbot, gets a Let's Encrypt certificate, and enables HTTPS
#
# Usage: sudo bash scripts/setup-vm-ssl.sh <domain> <email>
# Example: sudo bash scripts/setup-vm-ssl.sh api.yourdomain.com admin@yourdomain.com
# ─────────────────────────────────────────────────────────────────────────────
set -e

DOMAIN=${1:?"Usage: $0 <domain> <email>"}
EMAIL=${2:?"Usage: $0 <domain> <email>"}

echo "🔧 Installing nginx and certbot..."
apt-get update -qq
apt-get install -y -qq nginx certbot python3-certbot-nginx

echo "📝 Writing nginx config for $DOMAIN..."
sed "s/YOUR_DOMAIN/$DOMAIN/g" /opt/fluxion/nginx/api.conf \
  | tee /etc/nginx/conf.d/fluxion-api.conf > /dev/null

# Remove the default nginx site to avoid conflicts on port 80
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl enable nginx
systemctl start nginx

echo "🔒 Obtaining Let's Encrypt certificate for $DOMAIN..."
certbot --nginx -d "$DOMAIN" \
  --non-interactive --agree-tos -m "$EMAIL" --redirect

echo ""
echo "✅ SSL setup complete!"
echo "   Backend API is now available at: https://$DOMAIN/api"
echo ""
echo "Next steps:"
echo "  1. Update VITE_API_URL in Vercel → Project Settings → Environment Variables"
echo "     to: https://$DOMAIN/api"
echo "  2. Update GitHub Secrets ALLOWED_ORIGIN_0 / ALLOWED_ORIGIN_1 to your Vercel URLs"
echo "  3. Add https://$DOMAIN to Google Cloud Console → OAuth → Authorized JS Origins"
echo "  4. Push to main to trigger a re-deploy"
