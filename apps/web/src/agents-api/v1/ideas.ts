import { Hono } from 'hono'
import type { AppEnv } from '../../server'
import { NotFoundError, ValidationError } from '../../actions/errors'
import { IDEA_STATUSES, type IdeaStatus } from '@hotmetal/content-core'

const ideas = new Hono<AppEnv>()

/** GET /publications/:pubId/ideas — List ideas for a publication (filterable by ?status=). */
ideas.get('/publications/:pubId/ideas', async (c) => {
	const pubId = c.req.param('pubId')
	const pub = await c.env.DAL.getPublicationById(pubId)
	if (!pub || pub.userId !== c.get('userId')) {
		throw new NotFoundError('Publication not found')
	}

	const statusParam = c.req.query('status')
	if (statusParam && !IDEA_STATUSES.includes(statusParam as IdeaStatus)) {
		throw new ValidationError(
			`Invalid status. Must be one of: ${IDEA_STATUSES.join(', ')}`,
		)
	}

	const result = await c.env.DAL.listIdeasByPublication(pub.id, {
		status: statusParam as IdeaStatus | undefined,
	})

	return c.json({ data: result })
})

/** GET /ideas/:id — Get a single idea by ID (verify ownership via publication). */
ideas.get('/ideas/:id', async (c) => {
	const idea = await c.env.DAL.getIdeaById(c.req.param('id'))
	if (!idea) {
		throw new NotFoundError('Idea not found')
	}

	const pub = await c.env.DAL.getPublicationById(idea.publicationId)
	if (!pub || pub.userId !== c.get('userId')) {
		throw new NotFoundError('Idea not found')
	}

	return c.json({ data: idea })
})

export default ideas
