import { z } from 'zod'

export const CONTRACT_VERSION = '1.0.0'

const dateTime = z.iso.datetime()

export const entryKindSchema = z.enum(['expense', 'income'])

export const activitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: dateTime,
  updatedAt: dateTime,
  deletedAt: dateTime.nullable(),
})

export const entrySchema = z.object({
  id: z.string().min(1),
  kind: entryKindSchema,
  activityId: z.string().min(1),
  concept: z.string().min(1),
  amount: z.number().positive().finite(),
  createdAt: dateTime,
  updatedAt: dateTime,
  deletedAt: dateTime.nullable(),
})

export const activityListSchema = z.object({
  items: z.array(activitySchema),
})

export const entryListSchema = z.object({
  items: z.array(entrySchema),
})

export const metaSchema = z.object({
  contractVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  serverTime: dateTime,
})

export const healthSchema = z.object({
  status: z.literal('ok'),
})

export const errorSchema = z.object({
  error: z.string().min(1),
})

export type EntryKind = z.infer<typeof entryKindSchema>
export type Activity = z.infer<typeof activitySchema>
export type Entry = z.infer<typeof entrySchema>
export type Meta = z.infer<typeof metaSchema>

export function contractMajor(version: string): string {
  return version.split('.')[0] ?? ''
}
