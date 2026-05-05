import { z } from 'zod';

const clientBody = {
  name: z.string().min(1, "Name is required").trim(),
  cif: z.string().min(1, "CIF is required").trim(),
  email: z.string().email("Invalid email address").trim(),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    postal: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
  }).optional(),
};

export const createClientSchema = z.object({
  body: z.object(clientBody)
});

// For PUT requests, we make the fields optional so you can update just a few
export const updateClientSchema = z.object({
  body: z.object(clientBody).partial()
});