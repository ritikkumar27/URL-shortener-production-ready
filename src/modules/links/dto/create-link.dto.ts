import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createLinkSchema = z.object({
  originalUrl: z
    .string()
    .url('Please provide a valid URL (including http:// or https://)')
    .max(2048, 'URL must not exceed 2048 characters'),
  customAlias: z
    .string()
    .min(3, 'Custom alias must be at least 3 characters')
    .max(30, 'Custom alias cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Custom alias can only contain letters, numbers, hyphens, and underscores')
    .optional(),
  title: z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
  password: z.string().min(4, 'Password must be at least 4 characters').max(64).optional(),
  expiresAt: z
    .string()
    .datetime({ message: 'Invalid ISO date string' })
    .refine((date) => new Date(date) > new Date(), {
      message: 'Expiration date must be in the future',
    })
    .optional(),
});

export class CreateLinkDto extends createZodDto(createLinkSchema) {}