import { createId } from '@paralleldrive/cuid2'
import { integer, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export const movies = pgTable('movies', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  title: varchar('title', { length: 255 }).notNull(),
  synopsis: varchar('synopsis', { length: 2000 }).notNull(),
  coverKey: varchar('cover_key', { length: 255 }).notNull(),
  rating: integer('rating').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})
