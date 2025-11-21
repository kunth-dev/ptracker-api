#!/bin/sh

# Substitute environment variables in nginx configuration templates
echo "Configuring nginx with domains:"
echo "  API_DOMAIN: ${API_DOMAIN}"
echo "  STUDIO_DOMAIN: ${STUDIO_DOMAIN}"

# Process API configuration template
envsubst '${API_DOMAIN}' < /etc/nginx/conf.d/api.conf.template > /etc/nginx/conf.d/api.conf

# Process Studio configuration template
envsubst '${STUDIO_DOMAIN}' < /etc/nginx/conf.d/studio.conf.template > /etc/nginx/conf.d/studio.conf

# Remove templates after processing
rm -f /etc/nginx/conf.d/*.template

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

# Start nginx in the foreground
echo "Starting nginx..."
exec nginx -g 'daemon off;'
