// Apply the `drizzle/` migrations to the LOCAL Supabase stack (run by
// `pnpm db:start`). Production runs `pnpm db:migrate` from CI.

import { imovilDb } from '@/db'
import { readLocalSupabase } from '@cbrl/supabase/local'

imovilDb
  .migrate({ connectionString: readLocalSupabase().dbUrl })
  .then(() => console.log('imovil migrations applied to the local stack'))
  .catch((err: unknown) => {
    console.error(err)
    process.exitCode = 1
  })
