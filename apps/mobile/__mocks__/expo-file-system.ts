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

// Real expo-file-system's native module branches on URI scheme: a proper file://
// URI is checked for on-disk existence, but a schemeless (stripped) plain path
// falls into the content/asset/null-scheme branch instead — getInfoAsync silently
// reports exists:false, and deleteAsync throws "Unsupported scheme". Mirror that
// here (rather than normalizing both forms to the same lookup key) so a call site
// that accidentally strips a file_path before calling one of these functions fails
// its tests instead of appearing to work.
const hasFileScheme = (path: string): boolean => path.startsWith('file://');

export const getInfoAsync = jest.fn().mockImplementation(async (path: string): Promise<FileInfo> => {
  if (!hasFileScheme(path)) {
    return { exists: false };
  }
  const entry = mockFileSystem.get(path);
  if (entry) {
    return { exists: true, isDirectory: entry.isDirectory };
  }
  return { exists: false };
});

export const readDirectoryAsync = jest.fn().mockImplementation(async (path: string): Promise<string[]> => {
  if (path === documentDirectory + 'dictionaries/') {
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
  if (!hasFileScheme(path)) {
    throw new Error(`Unsupported scheme for location '${path}'.`);
  }
  const entry = mockFileSystem.get(path);
  if (entry && !entry.isDirectory) {
    mockFileSystem.delete(path);
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
  mockFileSystem.set(path, { exists: true, isDirectory, content: '' });
};
