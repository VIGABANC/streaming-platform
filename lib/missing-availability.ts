import { z } from 'zod'

export const missingAvailabilitySchema = z.object({
  sourceId: z.string().trim().max(80).optional(),
  source: z.enum(['tmdb', 'anilist']).optional(),
  region: z.string().trim().regex(/^[A-Za-z]{2}$/).transform((value) => value.toUpperCase()).optional(),
  mediaType: z.enum(['movie', 'tv', 'anime']).optional(),
  providerId: z.string().trim().max(40).optional(),
  description: z.string().trim().max(500).optional(),
}).strict()

export type MissingAvailabilityReport = z.infer<typeof missingAvailabilitySchema>

export function parseMissingAvailabilityReport(input: unknown): MissingAvailabilityReport {
  return missingAvailabilitySchema.parse(input)
}

export const MISSING_AVAILABILITY_COPY = 'Report missing availability so VEYRA can investigate metadata or provider coverage. This does not request or promise uploading copyrighted content.'
