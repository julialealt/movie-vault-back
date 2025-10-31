import 'dotenv/config'

import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { client, db } from './index'

async function runMigrations() {
  console.log('Iniciando conexão com o banco de dados para migração...')

  console.log('Rodando migrações da pasta: ./.migrations')

  try {
    await migrate(db, { migrationsFolder: './.migrations' })

    console.log('Migrações aplicadas com sucesso!')
  } catch (error) {
    console.error('Falha ao aplicar migrações:', error)
    process.exit(1)
  } finally {
    await client.end()
    console.log('Conexão fechada.')
    process.exit(0)
  }
}

runMigrations()
