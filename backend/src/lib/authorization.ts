import { Role } from '@prisma/client';
import { prisma } from './db';

export const checkPodcastOwnership = async (
  userId: string,
  podcastId: string
): Promise<boolean> => {
  const podcast = await prisma.podcast.findUnique({
    where: { id: podcastId },
    select: { ownerId: true },
  });

  return podcast?.ownerId === userId;
};

export const checkTeamMembership = async (userId: string, podcastId: string): Promise<boolean> => {
  const membership = await prisma.teamMember.findUnique({
    where: {
      userId_podcastId: { userId, podcastId },
    },
  });

  return !!membership;
};

export const checkTeamMemberRole = async (
  userId: string,
  podcastId: string,
  requiredRole: Role
): Promise<boolean> => {
  const isOwner = await checkPodcastOwnership(userId, podcastId);
  if (isOwner) return true; // Owner has all permissions

  const membership = await prisma.teamMember.findUnique({
    where: {
      userId_podcastId: { userId, podcastId },
    },
  });

  if (!membership) return false;

  if (requiredRole === Role.EDITOR) {
    return membership.role === Role.EDITOR || membership.role === Role.ADMIN;
  }

  if (requiredRole === Role.ADMIN) {
    return membership.role === Role.ADMIN;
  }

  return false;
};

export const requirePodcastAccess = (requiredRole?: Role) => {
  return async (userId: string, podcastId: string): Promise<boolean> => {
    const isOwner = await checkPodcastOwnership(userId, podcastId);
    if (isOwner) return true;

    if (!requiredRole) {
      return checkTeamMembership(userId, podcastId);
    }

    return checkTeamMemberRole(userId, podcastId, requiredRole);
  };
};
