# ---- Giai đoạn build ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Vite nhúng biến môi trường vào lúc BUILD, không đọc lúc chạy.
# Vì vậy VITE_API_URL phải truyền vào ở đây chứ không phải khi khởi động container.
ARG VITE_API_URL=http://localhost:3000/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- Giai đoạn chạy: chỉ còn file tĩnh + nginx ----
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
