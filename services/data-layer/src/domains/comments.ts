import type { Comment, CommentStatus, CreateCommentInput, ListCommentsFilters } from '../types'

interface CommentRow {
	id: string
	publication_id: string
	post_slug: string
	parent_id: string | null
	author_name: string
	author_email: string | null
	content: string
	status: string
	created_at: number
	updated_at: number
}

function mapRow(row: CommentRow): Comment {
	return {
		id: row.id,
		publicationId: row.publication_id,
		postSlug: row.post_slug,
		parentId: row.parent_id,
		authorName: row.author_name,
		authorEmail: row.author_email,
		content: row.content,
		status: row.status as CommentStatus,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	}
}

export async function createComment(
	db: D1Database,
	data: CreateCommentInput,
): Promise<Comment> {
	const now = Math.floor(Date.now() / 1000)
	const status = data.status ?? 'approved'

	await db
		.prepare(
			`INSERT INTO comments (id, publication_id, post_slug, parent_id, author_name, author_email, content, status, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		)
		.bind(
			data.id,
			data.publicationId,
			data.postSlug,
			data.parentId ?? null,
			data.authorName,
			data.authorEmail ?? null,
			data.content,
			status,
			now,
			now,
		)
		.run()

	return {
		id: data.id,
		publicationId: data.publicationId,
		postSlug: data.postSlug,
		parentId: data.parentId ?? null,
		authorName: data.authorName,
		authorEmail: data.authorEmail ?? null,
		content: data.content,
		status,
		createdAt: now,
		updatedAt: now,
	}
}

export async function getCommentById(
	db: D1Database,
	id: string,
): Promise<Comment | null> {
	const row = await db
		.prepare('SELECT * FROM comments WHERE id = ?')
		.bind(id)
		.first<CommentRow>()
	return row ? mapRow(row) : null
}

/**
 * List approved comments for a post (public display).
 * Ordered by created_at ASC so oldest appear first.
 */
export async function listCommentsByPost(
	db: D1Database,
	publicationId: string,
	postSlug: string,
	filters?: ListCommentsFilters,
): Promise<Comment[]> {
	const status = filters?.status ?? 'approved'
	const result = await db
		.prepare(
			`SELECT * FROM comments
			 WHERE publication_id = ? AND post_slug = ? AND status = ?
			 ORDER BY created_at ASC`,
		)
		.bind(publicationId, postSlug, status)
		.all<CommentRow>()
	return (result.results ?? []).map(mapRow)
}

/**
 * List all comments for a publication (admin view).
 * Ordered by created_at DESC so newest appear first.
 * Optionally filter by status.
 */
export async function listCommentsByPublication(
	db: D1Database,
	publicationId: string,
	filters?: ListCommentsFilters,
): Promise<Comment[]> {
	if (filters?.status) {
		const result = await db
			.prepare(
				`SELECT * FROM comments
				 WHERE publication_id = ? AND status = ?
				 ORDER BY created_at DESC`,
			)
			.bind(publicationId, filters.status)
			.all<CommentRow>()
		return (result.results ?? []).map(mapRow)
	}

	const result = await db
		.prepare(
			`SELECT * FROM comments
			 WHERE publication_id = ? AND status != 'deleted'
			 ORDER BY created_at DESC`,
		)
		.bind(publicationId)
		.all<CommentRow>()
	return (result.results ?? []).map(mapRow)
}

export async function updateCommentStatus(
	db: D1Database,
	id: string,
	status: CommentStatus,
): Promise<Comment | null> {
	const now = Math.floor(Date.now() / 1000)
	await db
		.prepare('UPDATE comments SET status = ?, updated_at = ? WHERE id = ?')
		.bind(status, now, id)
		.run()
	return getCommentById(db, id)
}

