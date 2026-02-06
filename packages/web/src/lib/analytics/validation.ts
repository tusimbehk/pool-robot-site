import { z } from 'zod';

export const EventPayloadSchema = z.object({
  event: z.string().min(1).max(100),
  properties: z.record(z.unknown()),
  anonymousId: z.string().min(1),
  userId: z.string().uuid().optional(),
  context: z.object({
    page: z.string().url().optional(),
    pageTitle: z.string().max(500).optional(),
    referrer: z.string().optional(),
    utmSource: z.string().max(50).optional(),
    utmMedium: z.string().max(50).optional(),
    utmCampaign: z.string().max(50).optional(),
    device: z.object({
      type: z.enum(['desktop', 'mobile', 'tablet']).optional(),
      browser: z.string().max(50).optional(),
      os: z.string().max(50).optional(),
    }).optional(),
    location: z.object({
      countryCode: z.string().length(2).optional(),
      city: z.string().max(100).optional(),
    }).optional(),
  }).optional(),
  timestamp: z.string().datetime().optional(),
});

export type EventPayload = z.infer<typeof EventPayloadSchema>;

export function validateEventPayload(data: unknown) {
  return EventPayloadSchema.safeParse(data);
}
