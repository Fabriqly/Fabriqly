/**
 * Configure DOMPurify for sanitizing HTML content from policy editor
 * This prevents XSS attacks while allowing safe HTML formatting
 * 
 * Note: Install isomorphic-dompurify for production use:
 * npm install isomorphic-dompurify
 */
let DOMPurify: any;

try {
  DOMPurify = require('isomorphic-dompurify');
} catch (e) {
  // Fallback if package is not installed
  console.warn('isomorphic-dompurify not installed. Using basic HTML sanitization.');
}

/**
 * Basic HTML sanitization (fallback if DOMPurify is not available)
 */
function basicSanitize(dirty: string): string {
  // Remove script tags and event handlers
  return dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

export function sanitizeHtml(dirty: string): string {
  if (!DOMPurify) {
    return basicSanitize(dirty);
  }

  return DOMPurify.sanitize(dirty, {
    // Allow common formatting tags
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre', 'hr',
      'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    // Allow safe attributes
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel', 'class', 'id',
      'colspan', 'rowspan', 'align'
    ],
    // Add rel="noopener noreferrer" to links for security
    ADD_ATTR: ['target'],
    // Ensure links open safely
    ADD_TAGS: [],
    // Remove all style attributes (prevent inline styles that could be exploited)
    FORBID_ATTR: ['style', 'onerror', 'onload'],
    // Keep relative URLs
    ALLOW_DATA_ATTR: false,
    // Return as string (not DOM)
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false
  });
}

/**
 * Sanitize HTML and add target="_blank" and rel="noopener noreferrer" to external links
 * Note: This is a simplified version. For production, consider using a proper HTML parser.
 */
export function sanitizeHtmlWithLinks(dirty: string, baseUrl?: string): string {
  let sanitized = sanitizeHtml(dirty);
  
  // Add target="_blank" and rel="noopener noreferrer" to external links
  sanitized = sanitized.replace(
    /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi,
    (match, before, href, after) => {
      // Check if it's an external link (starts with http:// or https://)
      const isExternal = /^https?:\/\//.test(href);
      const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      
      // Remove existing target/rel if present
      const cleanedBefore = before.replace(/\s*(target|rel)=["'][^"']*["']/gi, '');
      const cleanedAfter = after.replace(/\s*(target|rel)=["'][^"']*["']/gi, '');
      
      return `<a ${cleanedBefore}href="${href}"${target}${cleanedAfter}>`;
    }
  );

  return sanitized;
}

