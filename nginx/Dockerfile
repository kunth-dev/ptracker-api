FROM nginx:alpine

# Install gettext for envsubst command
RUN apk add --no-cache gettext

# Copy nginx configuration files
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/*.template /etc/nginx/conf.d/

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create directory for certbot challenges
RUN mkdir -p /var/www/certbot

# Expose HTTP and HTTPS ports
EXPOSE 80 443

# Use custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
