import prisma from '@/utils/db';
import { authenticateUser } from '@/middleware/auth';

export default async function handler(req : any, res : any) {
  const user = await authenticateUser(req);

  // if (!user) {
  //  return res.status(401).json({ message: 'Unauthorized' });
  //}

  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      return handleGetBlogPostById(res, id);
    case 'PUT':
      return handleUpdateBlogPost(req, res, id, user);
    case 'DELETE':
      return handleDeleteBlogPost(res, id, user);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

// Fetch a single blog post by ID
async function handleGetBlogPostById(res : any, id: any) {
  try {
    const blogPost = await prisma.blogPost.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        tags: true,
        templates: true,
        comments: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          },
        },
      },
    });

    if (!blogPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    res.status(200).json(blogPost);
  } catch (error) {
    console.error("Error retrieving blog post:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Update a blog post by ID
async function handleUpdateBlogPost(req : any, res : any, id : any, user : any) {
  const { title, description, tags, templateIds } = req.body;
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Verify ownership
    const blogPost = await prisma.blogPost.findUnique({ where: { id: parseInt(id) } });
    if (!blogPost || blogPost.userId !== user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this post' });
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        tags: {
          set: [], // Clear existing tags
          connectOrCreate: tags.map((tag : any) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
        templates: {
          set: templateIds.map((id : any) => ({ id })), // Update associated templates
        },
      },
    });

    res.status(200).json({ message: 'Blog post updated successfully', blogPost: updatedPost });
  } catch (error) {
    console.error("Error updating blog post:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Delete a blog post by ID
async function handleDeleteBlogPost(res : any, id : any, user : any) {
  try {
    const blogPost = await prisma.blogPost.findUnique({ where: { id: parseInt(id) } });
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user is the owner
    if (!blogPost || blogPost.userId !== user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await prisma.blogPost.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
