import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateLinkSchema = z.object({
  title: z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
  expiresAt: z
    .string()
    .datetime({ message: 'Invalid ISO date string' })
    .refine((date) => new Date(date) > new Date(), {
      message: 'Expiration date must be in the future',
    })
    .nullable()
    .optional(),
});

export class UpdateLinkDto extends createZodDto(updateLinkSchema) {}
