import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin'
import { SESSION_COOKIE_MAX_AGE_MS, SESSION_COOKIE_NAME } from '@/lib/firebase/session-cookie'
import { FieldValue } from '@tekoa/db'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body: unknown = await request.json()
  const idToken =
    typeof body === 'object' &&
    body !== null &&
    'idToken' in body &&
    typeof body.idToken === 'string'
      ? body.idToken
      : undefined
  if (!idToken) {
    return NextResponse.json({ error: 'idToken required' }, { status: 400 })
  }

  const auth = getAdminAuth()
  const decoded = await auth.verifyIdToken(idToken)

  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_COOKIE_MAX_AGE_MS,
  })

  const userRef = getAdminDb().collection('users').doc(decoded.uid)
  const snap = await userRef.get()
  // `name` rides the DecodedIdToken index signature (`[key: string]: any`).
  const displayName = typeof decoded.name === 'string' ? decoded.name : null
  const profile = {
    displayName,
    avatarUrl: decoded.picture ?? null,
    updatedAt: FieldValue.serverTimestamp(),
    ...(snap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
  }
  await userRef.set(profile, { merge: true })

  const store = await cookies()
  store.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    // secure=false só em dev (localhost http). Em prod (App Hosting é sempre
    // https), NODE_ENV=production garante secure=true. NUNCA hardcodar `false`
    // — quebra prod e expõe sessão em texto-claro. CI/build setam NODE_ENV.
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_COOKIE_MAX_AGE_MS / 1000,
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const store = await cookies()
  store.delete(SESSION_COOKIE_NAME)
  return NextResponse.json({ ok: true })
}
