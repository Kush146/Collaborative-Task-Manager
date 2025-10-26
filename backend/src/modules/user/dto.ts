// backend/src/modules/user/dto.ts
import { z } from 'zod';

export const UpdateMeDto = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Max 50 chars'),
});

export type UpdateMeDto = z.infer<typeof UpdateMeDto>;
