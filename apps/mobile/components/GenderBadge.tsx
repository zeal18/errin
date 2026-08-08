import { Text, View } from 'react-native';
import { getGender, type Gender } from '@errin/core';

const LABEL: Record<string, Record<Gender, string>> = {
  de: { masculine: 'der', feminine: 'die', neuter: 'das' },
  es: { masculine: 'el', feminine: 'la', neuter: 'lo' },
  ru: { masculine: 'м', feminine: 'ж', neuter: 'ср' },
};

const STYLE: Record<Gender, { bg: string; text: string; border: string }> = {
  masculine: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  feminine: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  neuter: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
};

interface GenderBadgeProps {
  lang: string;
  word: string;
}

export function GenderBadge({ lang, word }: GenderBadgeProps) {
  const genders = getGender(lang, word);
  if (!genders) return null;

  return (
    <View
      className="flex-row gap-1"
      accessible
      accessibilityRole="text"
      accessibilityLabel={genders.join(', ')}
    >
      {genders.map((g) => {
        const s = STYLE[g];
        return (
          <View key={g} className={`px-1.5 py-0.5 rounded border ${s.bg} ${s.border}`}>
            <Text className={`text-[10px] font-semibold ${s.text}`}>
              {LABEL[lang]?.[g] ?? g[0].toUpperCase()}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
