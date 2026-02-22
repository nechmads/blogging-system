import sanitizeHtml from 'sanitize-html';

/**
 * Strip leading H1 from content — the title is rendered separately by
 * the template, so an H1 at the start of the body would be a duplicate.
 */
function stripLeadingH1(html: string): string {
  return html.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/i, '');
}

export function sanitizeCmsContent(html: string): string {
  const sanitized = sanitizeHtml(html, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      'img',
      'h1',
      'h2',
      'h3',
      'figure',
      'figcaption',
    ],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'loading', 'width', 'height', 'class'],
      a: ['href', 'target', 'rel', 'class'],
      '*': ['class', 'id'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  });

  return stripLeadingH1(sanitized);
}
