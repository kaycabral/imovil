import type { PropertyDetail, PropertyImage } from '@imovil/shared'
import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { authUsers } from 'drizzle-orm/supabase'

/**
 * Postgres (Supabase) schema for imovil.
 *
 * Every table has RLS enabled with NO policies: the only reader/writer is the
 * server (the `postgres` role via the Supabase pooler, which bypasses RLS), so
 * the public PostgREST API exposed with the publishable key returns nothing.
 * The browser only talks to Supabase Auth and Storage directly — see the
 * `0001_auth_storage` migration for the auth trigger and the storage policies.
 */

export const propertyKind = pgEnum('property_kind', ['apartment', 'studio', 'kitnet', 'house'])
export const propertyDeal = pgEnum('property_deal', ['rental', 'sale'])
export const propertyStatus = pgEnum('property_status', ['published', 'draft', 'paused'])

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()

/**
 * One row per Supabase Auth user, created by the `on_auth_user_created` trigger
 * from the Google identity (name + avatar). Phone and CRECI are filled by the
 * broker before publishing.
 */
export const profiles = pgTable('profiles', {
  id: uuid('id')
    .primaryKey()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  phone: text('phone'),
  creci: text('creci'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}).enableRLS()

export const properties = pgTable(
  'properties',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull().unique(),
    status: propertyStatus('status').notNull().default('draft'),
    kind: propertyKind('kind').notNull(),
    deal: propertyDeal('deal').notNull(),
    title: text('title').notNull(),
    subtitle: text('subtitle').notNull().default(''),
    postalCode: text('postal_code').notNull(),
    street: text('street').notNull().default(''),
    neighborhood: text('neighborhood').notNull(),
    city: text('city').notNull(),
    state: text('state').notNull(),
    /** Rounded (~100 m) for privacy; both null when geocoding failed. */
    lat: doublePrecision('lat'),
    lng: doublePrecision('lng'),
    /** Cents. bigint: a sale price in cents overflows int4 above R$ 21M. */
    price: bigint('price', { mode: 'number' }).notNull(),
    condo: integer('condo').notNull().default(0),
    iptu: integer('iptu').notNull().default(0),
    area: integer('area').notNull(),
    rooms: integer('rooms').notNull(),
    suites: integer('suites').notNull().default(0),
    parking: integer('parking').notNull().default(0),
    floor: integer('floor'),
    petFriendly: boolean('pet_friendly').notNull().default(false),
    furnished: boolean('furnished').notNull().default(false),
    transitDistanceMin: integer('transit_distance_min').notNull().default(0),
    transitLabel: text('transit_label').notNull().default(''),
    builtYear: integer('built_year').notNull(),
    description: text('description').array().notNull(),
    details: jsonb('details')
      .$type<PropertyDetail[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    images: jsonb('images').$type<PropertyImage[]>().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check('properties_price_positive', sql`${t.price} > 0`),
    check('properties_area_positive', sql`${t.area} > 0`),
    check(
      'properties_non_negative_counts',
      sql`${t.condo} >= 0 AND ${t.iptu} >= 0 AND ${t.rooms} >= 0 AND ${t.suites} >= 0 AND ${t.parking} >= 0 AND ${t.transitDistanceMin} >= 0 AND (${t.floor} IS NULL OR ${t.floor} >= 0)`,
    ),
    check('properties_built_year_range', sql`${t.builtYear} BETWEEN 1900 AND 2100`),
    check('properties_postal_code_format', sql`${t.postalCode} ~ '^[0-9]{8}$'`),
    check('properties_state_uf', sql`char_length(${t.state}) = 2`),
    check('properties_coords_pair', sql`(${t.lat} IS NULL) = (${t.lng} IS NULL)`),
    index('properties_status_idx').on(t.status),
    index('properties_owner_idx').on(t.ownerId),
  ],
).enableRLS()

/** Release notes shown on /novidades. */
export const changelog = pgTable('changelog', {
  tagName: text('tag_name').primaryKey(),
  name: text('name').notNull(),
  body: text('body').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
}).enableRLS()
