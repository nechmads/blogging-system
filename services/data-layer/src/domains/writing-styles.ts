import type { WritingStyle, CreateWritingStyleInput, UpdateWritingStyleInput } from '../types'

interface WritingStyleRow {
	id: string
	user_id: string | null
	name: string
	description: string | null
	system_prompt: string
	tone_guide: string | null
	source_url: string | null
	sample_text: string | null
	is_prebuilt: number
	created_at: number
	updated_at: number
}

function mapRow(row: WritingStyleRow): WritingStyle {
	return {
		id: row.id,
		userId: row.user_id,
		name: row.name,
		description: row.description,
		systemPrompt: row.system_prompt,
		toneGuide: row.tone_guide,
		sourceUrl: row.source_url,
		sampleText: row.sample_text,
		isPrebuilt: row.is_prebuilt === 1,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	}
}

export async function createWritingStyle(
	db: D1Database,
	data: CreateWritingStyleInput
): Promise<WritingStyle> {
	const now = Math.floor(Date.now() / 1000)

	await db
		.prepare(
			`INSERT INTO writing_styles (id, user_id, name, description, system_prompt, tone_guide, source_url, sample_text, is_prebuilt, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
		)
		.bind(
			data.id,
			data.userId,
			data.name,
			data.description ?? null,
			data.systemPrompt,
			data.toneGuide ?? null,
			data.sourceUrl ?? null,
			data.sampleText ?? null,
			now,
			now
		)
		.run()

	return {
		id: data.id,
		userId: data.userId,
		name: data.name,
		description: data.description ?? null,
		systemPrompt: data.systemPrompt,
		toneGuide: data.toneGuide ?? null,
		sourceUrl: data.sourceUrl ?? null,
		sampleText: data.sampleText ?? null,
		isPrebuilt: false,
		createdAt: now,
		updatedAt: now,
	}
}

export async function getWritingStyleById(db: D1Database, id: string): Promise<WritingStyle | null> {
	const row = await db
		.prepare('SELECT * FROM writing_styles WHERE id = ?')
		.bind(id)
		.first<WritingStyleRow>()
	return row ? mapRow(row) : null
}

export async function listWritingStylesByUser(db: D1Database, userId: string): Promise<WritingStyle[]> {
	const result = await db
		.prepare(
			'SELECT * FROM writing_styles WHERE user_id = ? OR is_prebuilt = 1 ORDER BY is_prebuilt DESC, created_at DESC'
		)
		.bind(userId)
		.all<WritingStyleRow>()
	return (result.results ?? []).map(mapRow)
}

export async function listPrebuiltStyles(db: D1Database): Promise<WritingStyle[]> {
	const result = await db
		.prepare('SELECT * FROM writing_styles WHERE is_prebuilt = 1 ORDER BY created_at ASC')
		.all<WritingStyleRow>()
	return (result.results ?? []).map(mapRow)
}

export async function updateWritingStyle(
	db: D1Database,
	id: string,
	data: UpdateWritingStyleInput
): Promise<WritingStyle | null> {
	const sets: string[] = []
	const bindings: (string | number | null)[] = []

	if (data.name !== undefined) {
		sets.push('name = ?')
		bindings.push(data.name)
	}
	if (data.description !== undefined) {
		sets.push('description = ?')
		bindings.push(data.description)
	}
	if (data.systemPrompt !== undefined) {
		sets.push('system_prompt = ?')
		bindings.push(data.systemPrompt)
	}
	if (data.toneGuide !== undefined) {
		sets.push('tone_guide = ?')
		bindings.push(data.toneGuide)
	}
	if (data.sourceUrl !== undefined) {
		sets.push('source_url = ?')
		bindings.push(data.sourceUrl)
	}
	if (data.sampleText !== undefined) {
		sets.push('sample_text = ?')
		bindings.push(data.sampleText)
	}

	if (sets.length === 0) return getWritingStyleById(db, id)

	const now = Math.floor(Date.now() / 1000)
	sets.push('updated_at = ?')
	bindings.push(now)
	bindings.push(id)

	await db
		.prepare(`UPDATE writing_styles SET ${sets.join(', ')} WHERE id = ? AND is_prebuilt = 0`)
		.bind(...bindings)
		.run()

	return getWritingStyleById(db, id)
}

export async function deleteWritingStyle(db: D1Database, id: string): Promise<void> {
	await db.batch([
		db.prepare('UPDATE publications SET style_id = NULL WHERE style_id = ?').bind(id),
		db.prepare('UPDATE sessions SET style_id = NULL WHERE style_id = ?').bind(id),
		db.prepare('DELETE FROM writing_styles WHERE id = ? AND is_prebuilt = 0').bind(id),
	])
}
