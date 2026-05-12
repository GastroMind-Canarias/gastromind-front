# Etapa 1: Build con Node.js
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Construcción del proyecto para producción
RUN npm run build -- --configuration production

# Etapa 2: Servidor de producción con Nginx
FROM nginx:alpine
# Copiamos el resultado del build de Angular al directorio de Nginx
COPY --from=build /app/dist/gastromind/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80