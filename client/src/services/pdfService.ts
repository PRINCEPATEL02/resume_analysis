/**
 * pdfService.ts
 * Extracts readable text from a PDF File object using the browser's FileReader API.
 * Works well for text-based PDFs (not scanned image PDFs).
 * No external dependencies required.
 */

/**
 * Reads a PDF file and attempts to extract plain text from it.
 * Falls back to returning just the filename if extraction fails.
 */
export async function extractPdfText(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(buffer);
        const decoder = new TextDecoder('latin1');
        const raw = decoder.decode(bytes);

        const chunks: string[] = [];

        // Method 1: Extract text inside parentheses — the most common PDF text encoding
        // e.g. (John Smith) → "John Smith"
        const parenMatches = raw.matchAll(/\(([^)]{1,200})\)/g);
        for (const m of parenMatches) {
          const txt = m[1]
            .replace(/\\n/g, ' ')
            .replace(/\\r/g, ' ')
            .replace(/\\\\/g, '\\')
            .replace(/\\([()\\])/g, '$1')
            .trim();
          if (txt.length > 1 && /[a-zA-Z]/.test(txt)) {
            chunks.push(txt);
          }
        }

        // Method 2: Extract readable ASCII runs from stream content
        const streamMatches = raw.matchAll(/stream[\r\n]+([\s\S]{1,5000})[\r\n]+endstream/g);
        for (const m of streamMatches) {
          const printable = m[1]
            .replace(/[^\x20-\x7E\n]/g, ' ')
            .replace(/\s{3,}/g, '  ')
            .trim();
          if (printable.length > 20) {
            chunks.push(printable);
          }
        }

        const combined = chunks.join(' ').replace(/\s+/g, ' ').trim();

        // Return up to 4000 chars — enough context for question generation
        resolve(combined.slice(0, 4000) || file.name);
      } catch {
        resolve(file.name);
      }
    };

    reader.onerror = () => resolve(file.name);
    reader.readAsArrayBuffer(file);
  });
}
