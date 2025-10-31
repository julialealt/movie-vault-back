# Estágio 1: Base com Node.js e pnpm
FROM node:20-alpine AS base
RUN npm install -g pnpm

# Estágio 2: Instalação de dependências
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# Instala todas as dependências, incluindo dev (necessário para tsx)
RUN pnpm install --prod=false

# Estágio 3: Build/Produção
FROM base AS production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Expõe a porta da API
EXPOSE 8080

# Comando padrão: iniciar o servidor da API
# O worker será iniciado com um comando diferente no docker-compose
CMD ["pnpm", "run", "dev"]