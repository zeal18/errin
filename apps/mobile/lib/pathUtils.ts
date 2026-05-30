// Extract language pair string from a file path by getting the filename and removing .sqlite3 extension
export function getLangPairFromPath(filePath: string): string {
  // Extract filename from path
  const filename = filePath.split('/').pop() || '';
  // Remove .sqlite3 extension
  const baseName = filename.replace(/\.sqlite3$/, '');
  return baseName;
}
