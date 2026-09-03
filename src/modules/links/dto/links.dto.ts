import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const CreateLinkSchema = z.object({
  originalUrl: z
    .url({ message: 'Must be a valid URL with http:// or https://' })
    .max(2048, { message: 'URL cannot exceed 2048 characters' }),

  customCode: z
    .string()
    .min(3, { message: 'Custom alias must be at least 3 char' })
    .max(30, { message: 'Custom alias must be at max 30 char' })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message:
        'Custom alias can only contain alphanumeric characters, hyphens, and underscores',
    })
    .optional(),

  title: z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
  expiresAt: z.iso.datetime().optional(),
  password: z.string().min(4).max(64).optional(),
});


export const UpdateLinkSchema = z.object({
    title: z.string().max(255).optional(),
    description: z.string().max(1000).optional(),
    originalUrl: z.url().max(2048).optional(),
    isActive: z.boolean().optional(),
    expiresAt: z.iso.datetime().nullable().optional(),
});

export class CreateLinkDto extends createZodDto(CreateLinkSchema) {}
export class UpdateLinkDto extends createZodDto(UpdateLinkSchema) {}