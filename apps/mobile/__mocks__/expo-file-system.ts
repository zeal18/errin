interface FileInfo {
  exists: boolean;
  size?: number;
  isDirectory?: boolean;
  modificationTime?: number;
}

interface MockFSEntry {
  content?: string;
  exists: boolean;
  isDirectory: boolean;
}

const mockFileSystem: Map<string, MockFSEntry> = new Map();

// Real expo-file-system's documentDirectory is itself a file:// URI (e.g.
// 'file:///data/user/0/<pkg>/files/') — mirror that here so URI-vs-plain-path bugs
// in call sites surface in tests instead of being masked by a bare path.
export const documentDirectory: string = 'file:///mock/documentDirectory/';

function uriToPath(uri: string): string {
  return uri.startsWith('file://') ? uri.slice('file://'.length) : uri;
}

export const getInfoAsync = jest.fn().mockImplementation(async (path: string): Promise<FileInfo> => {
  const normalized = uriToPath(path);
  const entry = mockFileSystem.get(normalized);
  if (entry) {
    return { exists: true, isDirectory: entry.isDirectory };
  }
  return { exists: false };
});

export const readDirectoryAsync = jest.fn().mockImplementation(async (path: string): Promise<string[]> => {
  const normalized = uriToPath(path);
  if (normalized === uriToPath(documentDirectory) + 'dictionaries/') {
    return Array.from(mockFileSystem.keys())
      .filter((k) => !mockFileSystem.get(k)!.isDirectory)
      .map((k) => {
        // Return just the filename, not the full path
        const parts = k.split('/');
        return parts[parts.length - 1];
      });
  }
  return [];
});

export const deleteAsync = jest.fn().mockImplementation(async (path: string, options?: { idempotent?: boolean }): Promise<void> => {
  const normalized = uriToPath(path);
  const entry = mockFileSystem.get(normalized);
  if (entry && !entry.isDirectory) {
    mockFileSystem.delete(normalized);
  } else if (!entry && !options?.idempotent) {
    throw new Error('File not found: ' + path);
  }
});

export const resetMockFileSystem = (): void => {
  mockFileSystem.clear();
  getInfoAsync.mockClear();
  readDirectoryAsync.mockClear();
  deleteAsync.mockClear();
};

export const seedFile = (path: string, isDirectory: boolean = false): void => {
  mockFileSystem.set(uriToPath(path), { exists: true, isDirectory, content: '' });
};
