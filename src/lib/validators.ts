import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.string().email("Email invalide"),
    password: z
      .string()
      .min(8, "Au moins 8 caractères")
      .regex(/[A-Z]/, "Au moins une majuscule")
      .regex(/[0-9]/, "Au moins un chiffre"),
    firstName: z.string().min(2, "Prénom trop court"),
    lastName: z.string().min(2, "Nom trop court"),
    birthDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
      message: "Date invalide",
    }),
    phone: z.string().optional(),
    level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
    acceptTerms: z.boolean().refine((v) => v === true, {
      message: "Vous devez accepter les CGU",
    }),
  })
  .refine(
    (data) => {
      const ageYears =
        (Date.now() - Date.parse(data.birthDate)) /
        (1000 * 60 * 60 * 24 * 365);
      return ageYears >= 18;
    },
    { message: "Vous devez avoir 18 ans ou plus", path: ["birthDate"] }
  );

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const runSchema = z.object({
  title: z.string().min(3).max(80),
  description: z.string().max(500).optional(),
  startAddress: z.string().min(3),
  startLat: z.number(),
  startLng: z.number(),
  scheduledAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
    message: "Date invalide",
  }),
  durationMin: z.number().int().min(15).max(180),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  maxParticipants: z.number().int().min(2).max(20),
  routeId: z.string().optional(),
});

export type RunInput = z.infer<typeof runSchema>;

export const reportSchema = z.object({
  reportedId: z.string().min(1),
  reason: z.enum([
    "HARASSMENT",
    "INAPPROPRIATE_BEHAVIOR",
    "FAKE_PROFILE",
    "SAFETY_ISSUE",
    "OTHER",
  ]),
  comment: z.string().max(500).optional(),
});

export type ReportInput = z.infer<typeof reportSchema>;

export const emergencyContactSchema = z.object({
  name: z.string().min(2).max(60),
  phone: z.string().min(6).max(30),
  email: z.string().email().optional().or(z.literal("")),
  relation: z.string().max(40).optional(),
});

export type EmergencyContactInput = z.infer<typeof emergencyContactSchema>;

export const messageSchema = z.object({
  content: z.string().min(1).max(500),
});
