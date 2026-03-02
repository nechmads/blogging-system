/**
 * Simple word-list content filter for comment moderation.
 * Zero dependencies, server-side only.
 */

export interface ContentFilterResult {
	passed: boolean
	reason?: string
}

const BLOCKED_WORDS = [
	// Profanity
	'ass', 'asshole', 'bastard', 'bitch', 'bullshit', 'cock', 'crap', 'cunt',
	'damn', 'dick', 'douchebag', 'fag', 'faggot', 'fuck', 'fucker', 'fucking',
	'goddamn', 'horseshit', 'jackass', 'motherfucker', 'nigger', 'nigga',
	'piss', 'prick', 'pussy', 'shit', 'shitty', 'slut', 'twat', 'whore',
	// Slurs
	'chink', 'coon', 'dyke', 'gook', 'kike', 'retard', 'retarded', 'spic',
	'tranny', 'wetback',
	// Spam phrases
	'buy now', 'click here', 'free money', 'earn money fast',
	'make money online', 'work from home', 'act now', 'limited time offer',
	'congratulations you won', 'you have been selected', 'nigerian prince',
	'casino online', 'online pharmacy', 'viagra', 'cialis',
	'lose weight fast', 'miracle cure',
]

/** Leet-speak substitution map */
const LEET_MAP: Record<string, string> = {
	'@': 'a',
	'4': 'a',
	'8': 'b',
	'3': 'e',
	'1': 'i',
	'!': 'i',
	'0': 'o',
	'5': 's',
	'$': 's',
	'7': 't',
}

function normalize(text: string): string {
	let result = text.toLowerCase()
	// Apply leet-speak substitution only to characters adjacent to letters,
	// preserving pure numeric sequences (e.g. "455" stays "455", not "ass")
	result = result.replace(/./g, (ch, i) => {
		const mapped = LEET_MAP[ch]
		if (!mapped) return ch
		const prev = i > 0 ? result[i - 1] : ''
		const next = i < result.length - 1 ? result[i + 1] : ''
		const prevIsLetter = /[a-z]/.test(prev) || (prev in LEET_MAP && !/\d/.test(prev))
		const nextIsLetter = /[a-z]/.test(next) || (next in LEET_MAP && !/\d/.test(next))
		return prevIsLetter || nextIsLetter ? mapped : ch
	})
	// Strip non-alphanumeric except spaces
	result = result.replace(/[^a-z0-9 ]/g, '')
	return result
}

/**
 * Check text against the blocked word list.
 * Uses word-boundary matching on normalized text.
 */
export function checkContent(text: string): ContentFilterResult {
	const normalized = normalize(text)

	for (const word of BLOCKED_WORDS) {
		const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`)
		if (pattern.test(normalized)) {
			return { passed: false, reason: 'Comment contains inappropriate language' }
		}
	}

	return { passed: true }
}
