# Estágio 1: Base com Node.js
FROM node:20-alpine AS base
# Não precisamos mais do pnpm global

# Estágio 2: Instalação de dependências
FROM base AS deps
WORKDIR /app
# Correção: Copiar o package-lock.json
COPY package.json package-lock.json ./
# Correção: Usar o npm install
# Instala todas as dependências, incluindo dev (necessário para tsx)
RUN npm install

# Estágio 3: Build/Produção
FROM base AS production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Expõe a porta da API
EXPOSE 8080

# Comando padrão: usa npm para rodar o script
CMD ["npm", "run", "dev"]