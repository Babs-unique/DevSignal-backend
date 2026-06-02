import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z.string().min(6, 'Confirm Password must be at least 6 characters long')
    })
})

export const loginSchema = z.object({
    body: z.object({
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    })
});


export type RegisterRequest = z.infer<typeof registerSchema>['body'];
export type LoginRequest = z.infer<typeof loginSchema>['body'];