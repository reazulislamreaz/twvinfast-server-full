export function cleanEmailText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // Remove reply headers
  text = text.split(/On .*wrote:/i)[0];

  // Remove quoted lines
  text = text
    .split('\n')
    .filter((line) => !line.trim().startsWith('>'))
    .join('\n');

  // Remove forwarded markers
  text = text.split(/-----Original Message-----/i)[0];
  text = text.split(/From:/i)[0];

  return text.trim();
}
