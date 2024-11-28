import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/utils/db';
import { authenticateUser } from '@/middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const user = await authenticateUser(req);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { content, blogPostId, parentId } = req.body;

  // Validate input
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ message: 'Content is required and must be a string' });
  }

  if (!blogPostId || typeof blogPostId !== 'number') {
    return res.status(400).json({ message: 'BlogPostId is required and must be a number' });
  }

  try {
    const newComment = await prisma.comment.create({
      data: {
        content,
        userId: user.id,
        blogPostId,
        parentId: parentId || null, // Optional for replies
      },
    });

    return res.status(201).json({ message: 'Comment created successfully', comment: newComment });
  } catch (error) {
    console.error('Error creating comment:', error);
    return res.status(500).json({ message: 'Failed to create comment' });
  }
}
