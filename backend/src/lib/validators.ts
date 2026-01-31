import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

// Podcast schemas
export const createPodcastSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  author: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  language: z.string().length(2).default('ja'),
});

export const updatePodcastSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  author: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  language: z.string().length(2).optional(),
});

// Episode schemas
export const createEpisodeSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(10000).optional(),
  publishedAt: z.string().datetime().optional(),
  episodeNumber: z.number().int().positive().optional(),
  seasonNumber: z.number().int().positive().optional(),
  explicit: z.boolean().default(false),
});

export const updateEpisodeSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(10000).optional(),
  publishedAt: z.string().datetime().optional(),
  episodeNumber: z.number().int().positive().optional(),
  seasonNumber: z.number().int().positive().optional(),
  explicit: z.boolean().optional(),
});

// AudioFile schemas
export const audioMetadataSchema = z.object({
  filename: z.string(),
  mimeType: z.enum(['audio/mpeg', 'audio/mp4', 'audio/aac']),
  fileSize: z.number().int().positive(),
  gcsBucket: z.string(),
  gcsPath: z.string(),
});

// Artwork schemas
export const artworkSchema = z.object({
  filename: z.string(),
  mimeType: z.enum(['image/jpeg', 'image/png']),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  validated: z.boolean().default(false),
});

// Team schemas
export const inviteTeamMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'EDITOR']).default('EDITOR'),
});

export const updateTeamMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'EDITOR']),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreatePodcastInput = z.infer<typeof createPodcastSchema>;
export type UpdatePodcastInput = z.infer<typeof updatePodcastSchema>;
export type CreateEpisodeInput = z.infer<typeof createEpisodeSchema>;
export type UpdateEpisodeInput = z.infer<typeof updateEpisodeSchema>;
export type AudioMetadataInput = z.infer<typeof audioMetadataSchema>;
export type ArtworkInput = z.infer<typeof artworkSchema>;
export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>;
export type UpdateTeamMemberRoleInput = z.infer<typeof updateTeamMemberRoleSchema>;
