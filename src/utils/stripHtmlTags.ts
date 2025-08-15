/**
 * Utility function to strip HTML tags from a string and return plain text
 * @param html - The HTML string to strip tags from
 * @returns Plain text without HTML tags
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  
  // Create a temporary DOM element to parse HTML
  if (typeof window !== 'undefined') {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  }
  
  // Server-side fallback: use regex to remove HTML tags
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with regular space
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#39;/g, "'") // Replace &#39; with '
    .trim(); // Remove leading/trailing whitespace
}
