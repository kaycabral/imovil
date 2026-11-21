// Server-side Postgres (Supabase) access for the app.
//
// `server-only` fails the build if this module ever lands in a client bundle:
// it opens a `pg` pool with the database credentials.

import 'server-only'

export * from '@/db'
