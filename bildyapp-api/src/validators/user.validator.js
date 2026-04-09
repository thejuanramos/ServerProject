import z from 'zod';

const emailSchema = z.string().email('Invalid email').trim().toLowerCase();
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters long');
const codeSchema = z.string().regex(/^\d{6}$/, 'Code must have exactly 6 digits');

const requiredTrimmed = (field) => z.string().trim().min(1, `${field} is required`);

const addressSchema = z.object({
  street: requiredTrimmed('Street'),
  number: requiredTrimmed('Number'),
  postal: requiredTrimmed('Postal code'),
  city: requiredTrimmed('City'),
  province: requiredTrimmed('Province'),
});

export const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
  }),
});

export const emailValidationSchema = z.object({
  body: z.object({
    code: codeSchema,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: requiredTrimmed('Name'),
    lastName: requiredTrimmed('Last name'),
    nif: requiredTrimmed('NIF'),
    address: addressSchema.optional(),
  }),
});

export const updateCompanySchema = z.object({
  body: z.discriminatedUnion('isFreelance', [
    z.object({
      isFreelance: z.literal(true),
      name: z.string().trim().optional(),
      cif: z.string().trim().optional(),
      address: addressSchema.optional(),
    }),
    z.object({
      isFreelance: z.literal(false),
      name: requiredTrimmed('Company name'),
      cif: requiredTrimmed('CIF').transform((v) => v.toUpperCase()),
      address: addressSchema,
    }),
  ]),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().trim().min(1),
  }),
});

export const passwordChangeSchema = z.object({
  body: z.object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
  }).refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different',
    path: ['newPassword'],
  }),
});

export const inviteSchema = z.object({
  body: z.object({
    email: emailSchema,
    name: requiredTrimmed('Name'),
    lastName: requiredTrimmed('Last name'),
    nif: requiredTrimmed('NIF'),
  }),
});