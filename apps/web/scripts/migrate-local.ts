// Apply the @imovil/db migrations to the LOCAL Supabase stack (run by
// `pnpm db:start`). Production runs `pnpm --filter @imovil/db db:migrate` from CI.

import { readLocalSupabase } from '@cbrl/supabase/local'
import { imovilDb } from '@imovil/db'

imovilDb
  .migrate({ connectionString: readLocalSupabase().dbUrl })
  .then(() => console.log('imovil migrations applied to the local stack'))
  .catch((err: unknown) => {
    console.error(err)
    process.exitCode = 1
  })
