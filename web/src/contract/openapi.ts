import { z } from 'zod'
import {
  CONTRACT_VERSION,
  activitySchema,
  entrySchema,
  errorSchema,
  healthSchema,
  metaSchema,
} from './schema.ts'

type JsonSchema = Record<string, unknown>

export function openApiDocument(): Record<string, unknown> {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Money tracker',
      version: CONTRACT_VERSION,
      description: [
        'HTTP contract for a money-tracker backend.',
        'The app sends Authorization: Bearer on every request except GET /health.',
        'GET /health needs no token. It checks that API_TOKEN is set and the database can accept a backup. Respond 503 with { "error": string } when it cannot.',
        'Allow the app origin in CORS for GET, PUT, and DELETE, and allow the Authorization header.',
        'PUT creates or replaces the resource with that id. Client ids are stable.',
        'DELETE sets deletedAt and returns the resource. Do not remove the row.',
        'When the same id is written twice, keep the resource with the later updatedAt.',
        'updatedSince returns resources whose updatedAt is greater than that instant.',
        'Respond 401 with { "error": string } for a missing or rejected token.',
        'Respond 409 with { "error": string } only when the JSON body fails validation.',
      ].join(' '),
    },
    servers: [
      {
        url: 'https://example.com',
        description: 'Replace with the base URL saved in the app.',
      },
    ],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer' },
      },
      schemas: {
        Activity: jsonSchema(activitySchema),
        Entry: jsonSchema(entrySchema),
        ActivityList: listSchema('Activity'),
        EntryList: listSchema('Entry'),
        Meta: jsonSchema(metaSchema),
        Health: jsonSchema(healthSchema),
        Error: jsonSchema(errorSchema),
      },
    },
    paths: {
      '/meta': {
        get: operation({
          summary: 'Contract version and server time',
          responses: {
            '200': jsonResponse('Meta'),
            '401': jsonResponse('Error'),
          },
        }),
      },
      '/health': {
        get: {
          ...operation({
            summary: 'Server can accept a backup',
            responses: {
              '200': jsonResponse('Health'),
              '503': jsonResponse('Error'),
            },
          }),
          security: [],
        },
      },
      '/activities': {
        get: collectionOperation('ActivityList', 'List activities changed since updatedSince'),
      },
      '/activities/{id}': {
        put: writeOperation('Activity', 'Create or replace an activity'),
        delete: writeOperation('Activity', 'Tombstone an activity'),
      },
      '/entries': {
        get: collectionOperation('EntryList', 'List entries changed since updatedSince'),
      },
      '/entries/{id}': {
        put: writeOperation('Entry', 'Create or replace an entry'),
        delete: writeOperation('Entry', 'Tombstone an entry'),
      },
    },
  }
}

function jsonSchema(schema: z.ZodType): JsonSchema {
  const document = z.toJSONSchema(schema) as JsonSchema
  delete document.$schema
  return document
}

function listSchema(itemName: string): JsonSchema {
  return {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: { $ref: `#/components/schemas/${itemName}` },
      },
    },
    required: ['items'],
    additionalProperties: false,
  }
}

function operation(input: {
  summary: string
  parameters?: unknown[]
  requestBody?: unknown
  responses: Record<string, unknown>
}) {
  return {
    summary: input.summary,
    parameters: input.parameters,
    requestBody: input.requestBody,
    responses: input.responses,
  }
}

function collectionOperation(schemaName: string, summary: string) {
  return operation({
    summary,
    parameters: [
      {
        name: 'updatedSince',
        in: 'query',
        required: false,
        schema: { type: 'string', format: 'date-time' },
      },
    ],
    responses: {
      '200': jsonResponse(schemaName),
      '401': jsonResponse('Error'),
    },
  })
}

function writeOperation(schemaName: string, summary: string) {
  const isPut = summary.startsWith('Create')
  return operation({
    summary,
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', minLength: 1 },
      },
    ],
    requestBody: isPut
      ? {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${schemaName}` },
            },
          },
        }
      : undefined,
    responses: {
      '200': jsonResponse(schemaName),
      '401': jsonResponse('Error'),
      '409': jsonResponse('Error'),
    },
  })
}

function jsonResponse(schemaName: string) {
  return {
    description: schemaName,
    content: {
      'application/json': {
        schema: { $ref: `#/components/schemas/${schemaName}` },
      },
    },
  }
}
