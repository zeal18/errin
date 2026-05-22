import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SUPPORTED_LANGUAGES, getLanguageName } from '@errin/core';
import {
  startDictionaryDownload,
  type DownloadHandle,
  type DownloadProgress,
} from '../lib/dictionaryDownload';
import { useAppStore } from '../store';

type Role = 'native' | 'target';
type Step = 'select' | 'download';
type DownloadState =
  | { kind: 'idle' }
  | { kind: 'downloading'; progress: DownloadProgress }
  | { kind: 'error'; message: string }
  | { kind: 'success' };

export default function OnboardingScreen() {
  const router = useRouter();
  const addDictionary = useAppStore((s) => s.addDictionary);
  const setActivePair = useAppStore((s) => s.setActivePair);

  const [step, setStep] = useState<Step>('select');
  const [nativeLang, setNativeLang] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState<string | null>(null);
  const [downloadState, setDownloadState] = useState<DownloadState>({ kind: 'idle' });
  const handleRef = useRef<DownloadHandle | null>(null);

  const select = (role: Role, code: string) => {
    if (role === 'native') {
      setNativeLang(code);
      if (targetLang === code) setTargetLang(null);
    } else {
      setTargetLang(code);
      if (nativeLang === code) setNativeLang(null);
    }
  };

  const canContinue =
    nativeLang !== null && targetLang !== null && nativeLang !== targetLang;

  const startDownload = (sourceLang: string, targetLangCode: string) => {
    setDownloadState({
      kind: 'downloading',
      progress: { totalBytesWritten: 0, totalBytesExpectedToWrite: 0, fraction: 0 },
    });
    const handle = startDictionaryDownload(sourceLang, targetLangCode, (progress) => {
      setDownloadState({ kind: 'downloading', progress });
    });
    handleRef.current = handle;
    handle.promise
      .then(async (result) => {
        await addDictionary({
          sourceLang,
          targetLang: targetLangCode,
          filePath: result.filePath,
          downloadedAt: result.downloadedAt,
        });
        await setActivePair({ sourceLang, targetLang: targetLangCode });
        setDownloadState({ kind: 'success' });
        router.replace('/(tabs)/');
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Download failed. Please try again.';
        setDownloadState({ kind: 'error', message });
      });
  };

  const onContinue = () => {
    if (!canContinue || !nativeLang || !targetLang) return;
    setStep('download');
    startDownload(nativeLang, targetLang);
  };

  const onRetry = () => {
    if (!nativeLang || !targetLang) return;
    handleRef.current?.cancel().catch(() => {});
    startDownload(nativeLang, targetLang);
  };

  // Cancel any in-flight download if the screen unmounts.
  useEffect(() => {
    return () => {
      handleRef.current?.cancel().catch(() => {});
    };
  }, []);

  if (step === 'download') {
    return (
      <DownloadStep
        sourceLang={nativeLang}
        targetLang={targetLang}
        state={downloadState}
        onRetry={onRetry}
      />
    );
  }

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
        onPress={onContinue}
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

interface DownloadStepProps {
  sourceLang: string | null;
  targetLang: string | null;
  state: DownloadState;
  onRetry: () => void;
}

function DownloadStep({ sourceLang, targetLang, state, onRetry }: DownloadStepProps) {
  const pairLabel =
    sourceLang && targetLang
      ? `${getLanguageName(sourceLang) ?? sourceLang} → ${getLanguageName(targetLang) ?? targetLang}`
      : '';

  return (
    <View className="flex-1 bg-white p-6">
      <View className="mt-12 mb-8">
        <Text className="text-2xl font-bold mb-2">Downloading dictionary</Text>
        <Text className="text-sm text-neutral-500">{pairLabel}</Text>
      </View>

      <View className="flex-1 items-center justify-center">
        {state.kind === 'downloading' ? (
          <DownloadProgressView progress={state.progress} />
        ) : null}
        {state.kind === 'success' ? <ActivityIndicator /> : null}
        {state.kind === 'error' ? (
          <View className="items-center">
            <Text className="text-base text-red-600 mb-4 text-center">{state.message}</Text>
          </View>
        ) : null}
      </View>

      {state.kind === 'error' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={"Retry downloading " + pairLabel}
          className="rounded-lg py-4 items-center bg-blue-600"
          onPress={onRetry}
        >
          <Text className="text-white font-semibold text-base">Retry</Text>
        </Pressable>
      ) : (
        <View
          accessibilityRole="text"
          className="rounded-lg py-4 items-center bg-neutral-200"
        >
          <Text className="text-neutral-500 font-semibold text-base">
            Please wait…
          </Text>
        </View>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

function DownloadProgressView({ progress }: { progress: DownloadProgress }) {
  const { totalBytesWritten, totalBytesExpectedToWrite, fraction } = progress;
  const knownTotal = totalBytesExpectedToWrite > 0;
  const percent = Math.round(fraction * 100);

  return (
    <View className="w-full">
      <View className="h-2 rounded-full bg-neutral-200 overflow-hidden">
        {knownTotal ? (
          <View
            className="h-full bg-blue-600"
            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          />
        ) : (
          <View className="h-full" />
        )}
      </View>
      <View className="mt-3 flex-row justify-between">
        <Text className="text-sm text-neutral-600">
          {knownTotal ? `${percent}%` : 'Starting…'}
        </Text>
        <Text className="text-sm text-neutral-600">
          {knownTotal
            ? `${formatBytes(totalBytesWritten)} / ${formatBytes(totalBytesExpectedToWrite)}`
            : formatBytes(totalBytesWritten)}
        </Text>
      </View>
      {!knownTotal ? (
        <View className="mt-4 items-center">
          <ActivityIndicator />
        </View>
      ) : null}
    </View>
  );
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const formatted = value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1);
  return `${formatted} ${units[unitIndex]}`;
}
