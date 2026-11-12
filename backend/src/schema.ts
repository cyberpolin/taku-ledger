import { z } from 'zod'

export const CONTRACT_VERSION = '1.0.0'

const dateTime = z.iso.datetime()

export const activitySchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    createdAt: dateTime,
    updatedAt: dateTime,
    deletedAt: dateTime.nullable(),
  })
  .strict()

export const entrySchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(['expense', 'income']),
    activityId: z.string().min(1),
    concept: z.string().min(1),
    amount: z.number().positive().finite(),
    createdAt: dateTime,
    updatedAt: dateTime,
    deletedAt: dateTime.nullable(),
  })
  .strict()

export type Activity = z.infer<typeof activitySchema>
export type Entry = z.infer<typeof entrySchema>
