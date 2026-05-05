import { z } from 'zod';

const deliveryNoteBody = z.object({
  client: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Client ID"),
  project: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Project ID"),
  format: z.enum(['material', 'hours']),
  description: z.string().min(1, "Description is required"),
  workDate: z.string().pipe(z.coerce.date()),
  material: z.string().optional(),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  hours: z.number().optional(),
  workers: z.array(z.object({
    name: z.string(),
    hours: z.number()
  })).optional(),
}).refine((data) => {
  if (data.format === 'material') {
    return !!data.material && data.quantity !== undefined;
  }
  if (data.format === 'hours') {
    return data.hours !== undefined || (data.workers && data.workers.length > 0);
  }
  return true;
}, {
  message: "Required fields for the selected format are missing",
  path: ["format"]
});

export const createDeliveryNoteSchema = z.object({
  body: deliveryNoteBody
});