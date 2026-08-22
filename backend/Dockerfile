# ============ Giai đoạn 1: biên dịch TypeScript ============
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ============ Giai đoạn 2: image chạy thật ============
# Tách hai giai đoạn để image cuối KHÔNG chứa mã nguồn TypeScript,
# không chứa devDependencies - nhỏ hơn và ít bề mặt tấn công hơn.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# Cài trước schema rồi mới npm ci: postinstall của @prisma/client cần schema
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Không chạy bằng root - nguyên tắc đặc quyền tối thiểu (Bài 6 - App Security)
USER node

EXPOSE 3000

# Render/Docker tự khởi động lại container nếu health check thất bại
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
