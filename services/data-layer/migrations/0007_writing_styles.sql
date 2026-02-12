-- Writing styles: reusable writing style profiles for AI-assisted writing.
-- Pre-built styles have user_id NULL and is_prebuilt = 1.
-- User-created styles have user_id set and is_prebuilt = 0.

CREATE TABLE IF NOT EXISTS writing_styles (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  tone_guide TEXT,
  source_url TEXT,
  sample_text TEXT,
  is_prebuilt INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_writing_styles_user ON writing_styles(user_id);
CREATE INDEX IF NOT EXISTS idx_writing_styles_prebuilt ON writing_styles(is_prebuilt);

-- Link writing styles to publications and sessions
ALTER TABLE publications ADD COLUMN style_id TEXT REFERENCES writing_styles(id);
ALTER TABLE sessions ADD COLUMN style_id TEXT REFERENCES writing_styles(id);

-- Seed pre-built styles
INSERT INTO writing_styles (id, user_id, name, description, system_prompt, sample_text, is_prebuilt) VALUES
(
  'prebuilt-conversational-expert',
  NULL,
  'Conversational Expert',
  'Approachable and knowledgeable. Explains complex topics like a smart friend over coffee.',
  'Write in a conversational, approachable tone while maintaining deep expertise on the subject matter. Use first person occasionally. Break down complex concepts into digestible explanations with real-world analogies. Vary sentence length — mix short punchy sentences with longer explanatory ones. Use rhetorical questions to engage the reader. Avoid jargon unless you immediately explain it. Include personal observations and ''here''s what I''ve learned'' moments. Structure with clear headings but keep the flow natural, like a conversation. End sections with a takeaway or transition that pulls the reader forward.',
  'Here''s the thing about microservices that nobody tells you upfront: they''re not actually about the technology. They''re about team boundaries. I spent two years building a monolith before I understood this, and the rewrite taught me more about organizational design than any architecture book.',
  1
),
(
  'prebuilt-professional-analyst',
  NULL,
  'Professional Analyst',
  'Data-driven and authoritative. Presents findings with structured analysis and clear evidence.',
  'Write in a professional, analytical tone. Present information with clear evidence and logical structure. Use third person primarily. Support claims with data, examples, and citations. Organize content with a clear thesis, supporting arguments, and conclusion. Use precise language — avoid hedging words like ''maybe'' or ''sort of'' unless expressing genuine uncertainty. Include comparisons and frameworks to help readers evaluate options. Present multiple perspectives on contentious topics before offering your analysis. Use bullet points and numbered lists for key takeaways. Keep paragraphs focused on a single point.',
  'The shift toward edge computing represents a fundamental change in application architecture. Analysis of deployment patterns across 500 enterprises reveals three distinct adoption strategies, each with measurably different outcomes in latency reduction and operational cost.',
  1
);
