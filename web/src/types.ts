export type { Activity, Entry, EntryKind } from './contract/schema.ts'
export { CONTRACT_VERSION } from './contract/schema.ts'

export type ActivityScope = 'all' | string

/** @deprecated Prefer Entry */
export type { Entry as Expense } from './contract/schema.ts'
