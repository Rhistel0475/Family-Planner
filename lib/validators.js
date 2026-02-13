import { z } from 'zod';
import { DAY_NAMES, ROLES, RECURRENCE_PATTERNS } from './constants';

/**
 * Validation schemas for API routes
 */

export const choreSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  assignedTo: z.string().min(1, 'Assignee is required').max(100, 'Assignee name too long'),
  dueDay: z.enum(DAY_NAMES, { message: 'Invalid day of week' }),
  isRecurring: z.boolean().optional().default(false),
  recurrencePattern: z.enum([
    RECURRENCE_PATTERNS.DAILY,
    RECURRENCE_PATTERNS.WEEKLY,
    RECURRENCE_PATTERNS.MONTHLY,
    RECURRENCE_PATTERNS.YEARLY
  ]).nullable().optional(),
  recurrenceInterval: z.number().int().positive().max(365).optional(),
  recurrenceEndDate: z.string().datetime().or(z.date()).nullable().optional()
});

export const familyMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  role: z.enum([ROLES.MEMBER, ROLES.PARENT, ROLES.KID]).optional().default(ROLES.MEMBER),
  workingHours: z.string().max(50).nullable().optional()
});

export const familyMemberUpdateSchema = z.object({
  id: z.string().cuid('Invalid member ID'),
  name: z.string().min(1).max(100).optional(),
  role: z.enum([ROLES.MEMBER, ROLES.PARENT, ROLES.KID]).optional(),
  workingHours: z.string().max(50).nullable().optional()
});

export const recipeSchema = z.object({
  name: z.string().min(1, 'Recipe name is required').max(200, 'Name too long'),
  ingredients: z.string().min(1, 'Ingredients are required').max(1000, 'Ingredients list too long'),
  cookDay: z.enum(DAY_NAMES, { message: 'Invalid day of week' })
});

export const eventSchema = z.object({
  type: z.enum(['WORK', 'EVENT']).default('EVENT'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000).optional(),
  startsAt: z.string().datetime().or(z.date()),
  endsAt: z.string().datetime().or(z.date()).nullable().optional(),
  location: z.string().max(200).optional(),
  isRecurring: z.boolean().optional().default(false),
  recurrencePattern: z.enum([
    RECURRENCE_PATTERNS.DAILY,
    RECURRENCE_PATTERNS.WEEKLY,
    RECURRENCE_PATTERNS.MONTHLY,
    RECURRENCE_PATTERNS.YEARLY
  ]).nullable().optional(),
  recurrenceInterval: z.number().int().positive().max(365).optional(),
  recurrenceEndDate: z.string().datetime().or(z.date()).nullable().optional()
});

export const setupSchema = z.object({
  familyName: z.string().min(1).max(100).optional()
});

/**
 * Helper function to validate and return errors in a consistent format
 */
export function validateRequest(schema, data) {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));

    return {
      success: false,
      errors,
      error: errors[0]?.message || 'Validation failed'
    };
  }

  return {
    success: true,
    data: result.data
  };
}
