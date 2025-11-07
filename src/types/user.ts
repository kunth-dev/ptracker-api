import { z } from "zod";

// User data type
export interface User {
  userId: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// Request validation schemas
export const CreateUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

// Email-only schema used for password reset requests and resending codes
export const EmailOnlySchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().min(6, "Reset code must be at least 6 characters"),
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
});

export const UpdateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(8, "Password must be at least 8 characters long").optional(),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Type inference from schemas
export type CreateUserRequest = z.infer<typeof CreateUserSchema>;
export type EmailOnlyRequest = z.infer<typeof EmailOnlySchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>;
export type LoginRequest = z.infer<typeof LoginSchema>;

// Deprecated: Use EmailOnlySchema instead
/** @deprecated Use EmailOnlySchema for both send-reset-code and forgot-password endpoints */
export const SendResetCodeSchema = EmailOnlySchema;
/** @deprecated Use EmailOnlySchema for both send-reset-code and forgot-password endpoints */
export const ForgotPasswordSchema = EmailOnlySchema;
/** @deprecated Use EmailOnlyRequest type instead */
export type SendResetCodeRequest = EmailOnlyRequest;
/** @deprecated Use EmailOnlyRequest type instead */
export type ForgotPasswordRequest = EmailOnlyRequest;
