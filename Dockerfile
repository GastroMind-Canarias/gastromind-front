# Etapa 1: Build con Node.js
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
# Instalamos dependencias
RUN npm install
COPY . .
# Construcción del proyecto (los budgets se controlan en angular.json)
RUN npm run build -- --configuration production

# Etapa 2: Servidor de producción con Nginx
FROM nginx:alpine

# 1. Copiamos el contenido del build.
# Según tu 'ls -la', los archivos están en /app/dist/gastromind/browser
COPY --from=build /app/dist/gastromind/browser /usr/share/nginx/html

# 2. Copiamos TU archivo de configuración personalizado
# Este archivo debe existir en la misma carpeta que el Dockerfile
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
