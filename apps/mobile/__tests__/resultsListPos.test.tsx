import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('../db/words', () => ({ getWordsBySource: jest.fn().mockResolvedValue(new Map()) }));
jest.mock('../store', () => ({
  useAppStore: (selector: (s: unknown) => unknown) =>
    selector({ activePair: { studiedLang: 'de', lookupDirection: 'studied_to_native' } }),
}));
jest.mock('@errin/core', () => ({
  ...jest.requireActual('@errin/core'),
  getGender: (_lang: string, word: string) => (word === 'Arm' ? ['masculine'] : null),
}));

import { ResultsList } from '../components/ResultsList';

describe('ResultsList part of speech', () => {
  it('renders separate cards with POS labels; only the noun shows the article', async () => {
    const results = [
      { writtenRep: 'Arm', partOfSpeech: 'noun' as const, score: 1, variants: [{ transList: ['limb'], sense: 'limb', importance: 1 }] },
      { writtenRep: 'arm', partOfSpeech: 'adjective' as const, score: 1, variants: [{ transList: ['poor'], sense: 'poor', importance: 1 }] },
    ];
    const r = render(
      <ResultsList results={results} onPress={jest.fn()} onReplace={jest.fn()} onReset={jest.fn()} />
    );
    const { getAllByTestId, getByText, findAllByTestId } = r;
    await findAllByTestId('pos-label');
    expect(getByText('Arm')).toBeTruthy();
    expect(getByText('arm', { exact: true })).toBeTruthy();
    const labels = getAllByTestId('pos-label').map((n) => n.props.children);
    expect(labels).toEqual(['noun', 'adjective']);
    expect(getAllByTestId('gender-badge')).toHaveLength(1);
  });
});
