import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  uid: z.string(),
  firebaseUid: z.string().optional(),
  name: z.string(),
  email: z.string().email().or(z.literal('')),
  role: z.enum(['student', 'teacher', 'admin']),
  subscriptionStatus: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.any().optional(),
}).passthrough();

export const MessageSchema = z.object({
  id: z.string(),
  text: z.string(),
  sender: z.string(),
  timestamp: z.any(),
  read: z.boolean().optional(),
}).passthrough();
