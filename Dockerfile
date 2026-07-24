# API de rastreamento — imagem para deploy (EasyPanel / Docker)
FROM node:20-alpine

WORKDIR /app

# Dependências primeiro (melhor cache). Inclui devDeps porque o sequelize-cli
# é usado para rodar as migrations na subida do container.
COPY package.json package-lock.json ./
RUN npm ci --include=dev && npm cache clean --force

# Código da aplicação
COPY . .

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# Checa saúde batendo no /ping (busybox wget já vem no alpine)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/v1/ping" || exit 1

# Aplica migrations (idempotente) e sobe a API
CMD ["sh", "-c", "npm run migrate && node app.js"]
