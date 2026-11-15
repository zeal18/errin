import { cacheDirectory, writeAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { wordsToCsv, type Word } from '@errin/core';

/**
 * Generate the export filename with the current date.
 * Format: errin-words-YYYY-MM-DD.csv
 */
export function exportFileName(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `errin-words-${year}-${month}-${day}.csv`;
}

/**
 * Export all words to a CSV file and open the share sheet.
 * 
 * - Writes the CSV to the app cache directory using expo-file-system
 * - Opens the system share sheet with expo-sharing using mimeType text/csv
 * - Returns the file URI on success
 * - Throws an error if cacheDirectory is unavailable, writing fails, or sharing is unavailable
 */
export async function exportWordsCsv(words: Word[], now: Date = new Date()): Promise<string> {
  if (!cacheDirectory) {
    throw new Error('Cache directory is unavailable');
  }

  const uri = `${cacheDirectory}${exportFileName(now)}`;
  
  // Write CSV content to file
  await writeAsStringAsync(uri, wordsToCsv(words));

  // Check if sharing is available
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device');
  }

  // Open share sheet
  await Sharing.shareAsync(uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export words',
    UTI: 'public.comma-separated-values-text',
  });

  return uri;
}
