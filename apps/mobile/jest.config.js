/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/db', '<rootDir>/lib'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  moduleNameMapper: {
    '^expo-sqlite$': '<rootDir>/__mocks__/expo-sqlite.ts',
    '^expo-file-system$': '<rootDir>/__mocks__/expo-file-system.ts',
    '^expo-file-system/legacy$': '<rootDir>/__mocks__/expo-file-system.ts'
  }
};
