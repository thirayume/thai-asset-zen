import { z } from "zod";

// Auth validation schemas
export const signupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters")
    .regex(/^[a-zA-Z\u0E00-\u0E7F\s]+$/, "Full name can only contain letters and spaces"),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters")
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be less than 72 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .toLowerCase(),
  password: z
    .string()
    .min(1, "Password is required"),
});

// Stock position validation schema
export const positionSchema = z.object({
  stockSymbol: z
    .string()
    .min(1, "Please select a stock")
    .max(10, "Stock symbol is invalid"),
  shares: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Shares must be a positive number",
    })
    .refine((val) => Number(val) <= 1000000000, {
      message: "Shares cannot exceed 1 billion",
    })
    .refine((val) => Number.isInteger(Number(val)), {
      message: "Shares must be a whole number",
    }),
  entryPrice: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Entry price must be a positive number",
    })
    .refine((val) => Number(val) <= 1000000, {
      message: "Entry price seems unreasonably high",
    }),
  purchaseDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    })
    .refine((val) => new Date(val) <= new Date(), {
      message: "Purchase date cannot be in the future",
    })
    .refine((val) => new Date(val) >= new Date("1900-01-01"), {
      message: "Purchase date is too far in the past",
    }),
});

// Gold position validation schema
export const goldPositionSchema = z.object({
  goldType: z.enum(["96.5%", "99.99%"], {
    errorMap: () => ({ message: "Please select a valid gold type" }),
  }),
  weightInBaht: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Weight must be a positive number",
    })
    .refine((val) => Number(val) <= 100, {
      message: "Weight cannot exceed 100 baht",
    })
    .refine((val) => Number(val) >= 0.01, {
      message: "Weight must be at least 0.01 baht",
    }),
  purchasePricePerBaht: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Purchase price must be a positive number",
    })
    .refine((val) => Number(val) <= 100000, {
      message: "Purchase price per baht cannot exceed 100,000 THB",
    })
    .refine((val) => Number(val) >= 1000, {
      message: "Purchase price per baht seems too low (minimum 1,000 THB)",
    }),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional()
    .transform((val) => val?.trim() || ""),
});

// Watchlist validation schema
export const watchlistSchema = z.object({
  stockSymbol: z
    .string()
    .min(1, "Please select a stock")
    .max(10, "Stock symbol is invalid"),
  targetEntryPrice: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        const num = Number(val);
        return !isNaN(num) && num > 0;
      },
      { message: "Target price must be a positive number" }
    )
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        return Number(val) <= 1000000;
      },
      { message: "Target price seems unreasonably high" }
    ),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional()
    .transform((val) => val?.trim() || ""),
});

export type SignupFormData = z.infer<typeof signupSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type PositionFormData = z.infer<typeof positionSchema>;
export type GoldPositionFormData = z.infer<typeof goldPositionSchema>;
export type WatchlistFormData = z.infer<typeof watchlistSchema>;
