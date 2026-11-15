/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/db', '<rootDir>/lib', '<rootDir>/__tests__'],
      testMatch: ['**/*.test.ts'],
      moduleFileExtensions: ['ts', 'js', 'json', 'node'],
      moduleNameMapper: {
        '^expo-sqlite$': '<rootDir>/__mocks__/expo-sqlite.ts',
        '^expo-file-system$': '<rootDir>/__mocks__/expo-file-system.ts',
        '^expo-file-system/legacy$': '<rootDir>/__mocks__/expo-file-system.ts'
      }
    },
    {
      displayName: 'ui',
      preset: 'jest-expo',
      testEnvironment: 'node',
      roots: ['<rootDir>/__tests__'],
      testMatch: ['**/*.test.tsx'],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      moduleNameMapper: {
        '^expo-sqlite$': '<rootDir>/__mocks__/expo-sqlite.ts',
        '^expo-file-system$': '<rootDir>/__mocks__/expo-file-system.ts',
        '^expo-file-system/legacy$': '<rootDir>/__mocks__/expo-file-system.ts'
      },
      transformIgnorePatterns: [
        'node_modules/(?!(@react-native|react-native|react-native-css-interop|nativewind|@react-navigation/.*|expo-router|@expo/vector-icons)/)'
      ]
    }
  ]
};
