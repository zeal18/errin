import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SUPPORTED_LANGUAGES } from '@errin/core';

type Role = 'native' | 'target';

export default function OnboardingScreen() {
  const [nativeLang, setNativeLang] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState<string | null>(null);

  const select = (role: Role, code: string) => {
    if (role === 'native') {
      setNativeLang(code);
      if (targetLang === code) setTargetLang(null);
    } else {
      setTargetLang(code);
      if (nativeLang === code) setNativeLang(null);
    }
  };

  const canContinue = nativeLang !== null && targetLang !== null && nativeLang !== targetLang;

  return (
    <View className="flex-1 bg-white p-6">
      <View className="mt-12 mb-8">
        <Text className="text-2xl font-bold mb-2">Welcome to Errin</Text>
        <Text className="text-sm text-neutral-500">
          Choose your native language and the language you want to learn.
        </Text>
      </View>

      <LanguageGroup
        title="I speak"
        role="native"
        selected={nativeLang}
        disabledCode={targetLang}
        onSelect={select}
      />

      <View className="h-6" />

      <LanguageGroup
        title="I want to learn"
        role="target"
        selected={targetLang}
        disabledCode={nativeLang}
        onSelect={select}
      />

      <View className="flex-1" />

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !canContinue }}
        disabled={!canContinue}
        className={`rounded-lg py-4 items-center ${
          canContinue ? 'bg-blue-600' : 'bg-neutral-300'
        }`}
        onPress={() => {
          // Download step (T3.3) wires up here.
        }}
      >
        <Text className="text-white font-semibold text-base">Continue</Text>
      </Pressable>

      <StatusBar style="auto" />
    </View>
  );
}

interface LanguageGroupProps {
  title: string;
  role: Role;
  selected: string | null;
  disabledCode: string | null;
  onSelect: (role: Role, code: string) => void;
}

function LanguageGroup({ title, role, selected, disabledCode, onSelect }: LanguageGroupProps) {
  return (
    <View>
      <Text className="text-xs uppercase tracking-wide text-neutral-500 mb-2">{title}</Text>
      <View className="flex-row flex-wrap -m-1">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = selected === lang.code;
          const isDisabled = disabledCode === lang.code;
          return (
            <Pressable
              key={lang.code}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: isDisabled }}
              disabled={isDisabled}
              onPress={() => onSelect(role, lang.code)}
              className={`m-1 px-4 py-3 rounded-lg border ${
                isSelected
                  ? 'bg-blue-600 border-blue-600'
                  : isDisabled
                    ? 'bg-neutral-100 border-neutral-200'
                    : 'bg-white border-neutral-300'
              }`}
            >
              <Text
                className={`text-base ${
                  isSelected
                    ? 'text-white font-semibold'
                    : isDisabled
                      ? 'text-neutral-400'
                      : 'text-neutral-900'
                }`}
              >
                {lang.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
