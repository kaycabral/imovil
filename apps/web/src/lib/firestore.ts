// Typed Firestore read boundary (typed-linting burndown).
//
// `snapshot.data()` returns `DocumentData` (`{ [k: string]: any }`), so reads
// that destructure it leak `any` (no-unsafe-assignment/member-access). This is
// the ONE place that conversion to a known stored shape happens — pass a
// `validate` for runtime-checked reads, or omit it to trust the write path
// (the single reviewed assertion + ledger suppression lives in `trustData`).

export type Validate<T> = (data: unknown) => T

function trustData<T>(raw: FirebaseFirestore.DocumentData, validate?: Validate<T>): T {
  return validate ? validate(raw) : (raw as T)
}

/** Read a single doc as `T`. Returns `undefined` when the doc is absent. */
export function docData<T>(
  snap: FirebaseFirestore.DocumentSnapshot,
  validate?: Validate<T>,
): T | undefined {
  const raw = snap.data()
  return raw === undefined ? undefined : trustData(raw, validate)
}

/** Map a query snapshot to `T[]` (query docs always have data). */
export function queryData<T>(qs: FirebaseFirestore.QuerySnapshot, validate?: Validate<T>): T[] {
  return qs.docs.map((d) => trustData(d.data(), validate))
}

/** Read one query doc as `T`, keeping the snapshot in hand (`d.ref`/`d.id`). */
export function queryDocData<T>(
  d: FirebaseFirestore.QueryDocumentSnapshot,
  validate?: Validate<T>,
): T {
  return trustData(d.data(), validate)
}
