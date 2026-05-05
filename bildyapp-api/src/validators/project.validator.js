import { z } from 'zod';

const projectBody = {
  name: z.string().min(1, "Project name is required").trim(),
  projectCode: z.string().min(1, "Project code is required").trim(),
  client: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Client ID"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    postal: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
  active: z.boolean().optional(),
};

export const createProjectSchema = z.object({
  body: z.object(projectBody)
});

export const updateProjectSchema = z.object({
  body: z.object(projectBody).partial()
});