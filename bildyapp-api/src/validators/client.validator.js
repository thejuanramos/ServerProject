import { z } from 'zod';

export const createClientSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    cif: z.string().min(9).max(9),
    address: z.object({
      street: z.string(),
      number: z.string(),
      postal: z.string(),
      city: z.string(),
      province: z.string()
    })
  })
});