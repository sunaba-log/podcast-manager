import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { prisma } from '../../lib/db';
import { createPodcastSchema, updatePodcastSchema } from '../../lib/validators';
import { ApiError, NotFoundError, ForbiddenError, handleError } from '../../lib/errors';
import { logger } from '../../lib/logger';
import { checkPodcastOwnership, requirePodcastAccess } from '../../lib/authorization';

const router = Router();

// Middleware - require authentication
router.use(authMiddleware);

// Create a new podcast
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const validationResult = createPodcastSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Invalid input', details: validationResult.error });
    }

    const data = validationResult.data;
    const podcast = await prisma.podcast.create({
      data: {
        ...data,
        ownerId: req.userId!,
      },
    });

    logger.info('Podcast created', { podcastId: podcast.id, userId: req.userId });
    res.status(201).json(podcast);
  } catch (error) {
    const { statusCode, body } = handleError(error);
    res.status(statusCode).json(body);
  }
});

// Get all podcasts for current user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const podcasts = await prisma.podcast.findMany({
      where: {
        OR: [
          { ownerId: req.userId },
          {
            teamMembers: {
              some: { userId: req.userId },
            },
          },
        ],
      },
      include: {
        artwork: true,
        _count: { select: { episodes: true } },
      },
    });

    res.json(podcasts);
  } catch (error) {
    const { statusCode, body } = handleError(error);
    res.status(statusCode).json(body);
  }
});

// Get a specific podcast
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check access
    const hasAccess = await requirePodcastAccess()(req.userId!, id);
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this podcast');
    }

    const podcast = await prisma.podcast.findUnique({
      where: { id },
      include: {
        artwork: true,
        episodes: {
          select: {
            id: true,
            title: true,
            publishedAt: true,
            episodeNumber: true,
            seasonNumber: true,
          },
        },
        teamMembers: {
          select: {
            user: { select: { id: true, name: true, email: true } },
            role: true,
          },
        },
      },
    });

    if (!podcast) {
      throw new NotFoundError('Podcast');
    }

    res.json(podcast);
  } catch (error) {
    const { statusCode, body } = handleError(error);
    res.status(statusCode).json(body);
  }
});

// Update a podcast
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check ownership
    const isOwner = await checkPodcastOwnership(req.userId!, id);
    if (!isOwner) {
      throw new ForbiddenError('Only the podcast owner can update it');
    }

    const validationResult = updatePodcastSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Invalid input', details: validationResult.error });
    }

    const podcast = await prisma.podcast.update({
      where: { id },
      data: validationResult.data,
    });

    logger.info('Podcast updated', { podcastId: id, userId: req.userId });
    res.json(podcast);
  } catch (error) {
    const { statusCode, body } = handleError(error);
    res.status(statusCode).json(body);
  }
});

// Delete a podcast
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check ownership
    const isOwner = await checkPodcastOwnership(req.userId!, id);
    if (!isOwner) {
      throw new ForbiddenError('Only the podcast owner can delete it');
    }

    await prisma.podcast.delete({ where: { id } });

    logger.info('Podcast deleted', { podcastId: id, userId: req.userId });
    res.status(204).send();
  } catch (error) {
    const { statusCode, body } = handleError(error);
    res.status(statusCode).json(body);
  }
});

// Get podcast feed URL
router.get('/:id/feed-url', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check access
    const hasAccess = await requirePodcastAccess()(req.userId!, id);
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this podcast');
    }

    const podcast = await prisma.podcast.findUnique({
      where: { id },
      select: { feedUrl: true },
    });

    if (!podcast) {
      throw new NotFoundError('Podcast');
    }

    const feedUrl = `${process.env.API_HOST || 'http://localhost:3001'}/feeds/shows/${podcast.feedUrl}/rss.xml`;

    res.json({ feedUrl });
  } catch (error) {
    const { statusCode, body } = handleError(error);
    res.status(statusCode).json(body);
  }
});

export default router;
