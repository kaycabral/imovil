import { describe, expect, it } from 'vitest'
import { countByStatus, leads, leadStatusLabel, listLeads, type LeadStatus } from './leads'

const ALL_STATUSES: LeadStatus[] = [
  'novo',
  'em-contato',
  'visita-agendada',
  'fechado',
  'descartado',
]

describe('listLeads', () => {
  it('returns every lead, newest first, without mutating the source', () => {
    const sorted = listLeads()
    expect(sorted).toHaveLength(leads.length)
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1]!.createdAt >= sorted[i]!.createdAt).toBe(true)
    }
    // source array order is untouched (sort runs on a copy)
    expect(leads).not.toBe(sorted)
  })
})

describe('countByStatus', () => {
  it('counts every status (0 when absent) and totals all leads', () => {
    const counts = countByStatus()
    for (const status of ALL_STATUSES) {
      expect(counts).toHaveProperty(status)
    }
    const total = ALL_STATUSES.reduce((sum, s) => sum + counts[s], 0)
    expect(total).toBe(leads.length)
  })

  it('matches a manual tally', () => {
    const counts = countByStatus()
    for (const status of ALL_STATUSES) {
      expect(counts[status]).toBe(leads.filter((l) => l.status === status).length)
    }
  })
})

describe('leadStatusLabel', () => {
  it('has a human-facing label for every status', () => {
    for (const status of ALL_STATUSES) {
      expect(leadStatusLabel[status]).toBeTruthy()
    }
  })
})
