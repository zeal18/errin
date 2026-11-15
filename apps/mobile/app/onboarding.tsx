import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  CURRENT_DICTIONARY_VERSION,
  SUPPORTED_LANGUAGES,
  getLanguageName,
  getPairDownloadSize,
} from '@errin/core';
import {
  startPairDownload,
  type PairDownloadHandle,
  type PairDownloadProgress,
} from '../lib/dictionaryDownload';
import { useAppStore } from '../store';
import { formatBytes } from '../lib/formatUtils';
import { DownloadConfirmationDialog } from '../components/DownloadConfirmationDialog';
import { useThemeColors } from '../lib/theme';
import { useColorScheme } from 'nativewind';

type Role = 'native' | 'target';
type Step = 'select' | 'confirm' | 'download';
type DownloadState =
  | { kind: 'idle' }
  | { kind: 'downloading'; progress: PairDownloadProgress }
  | { kind: 'error'; message: string }
  | { kind: 'success' };

export default function OnboardingScreen() {
  const router = useRouter();
  const addDictionary = useAppStore((s) => s.addDictionary);
  const setActivePair = useAppStore((s) => s.setActivePair);

  const [step, setStep] = useState<Step>('select');
  const [nativeLang, setNativeLang] = useState<string | null>(null);
  const [studiedLang, setStudiedLang] = useState<string | null>(null);
  const [downloadState, setDownloadState] = useState<DownloadState>({ kind: 'idle' });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const handleRef = useRef<PairDownloadHandle | null>(null);

  const select = (role: Role, code: string) => {
    if (role === 'native') {
      setNativeLang(code);
      if (studiedLang === code) setStudiedLang(null);
    } else {
      setStudiedLang(code);
      if (nativeLang === code) setNativeLang(null);
    }
  };

  const canContinue =
    nativeLang !== null && studiedLang !== null && nativeLang !== studiedLang;

  const startDownload = (nativeLang: string, studiedLang: string) => {
    setDownloadState({
      kind: 'downloading',
      progress: { fraction: 0, totalBytesWritten: 0, totalBytesExpectedToWrite: 0 },
    });
    const handle = startPairDownload(nativeLang, studiedLang, (progress) => {
      setDownloadState({ kind: 'downloading', progress });
    });
    handleRef.current = handle;
    handle.promise
      .then(async (result) => {
        await addDictionary({
          sourceLang: nativeLang,
          targetLang: studiedLang,
          filePath: result.first.filePath,
          downloadedAt: result.first.downloadedAt,
          version: CURRENT_DICTIONARY_VERSION.id,
        });
        await addDictionary({
          sourceLang: studiedLang,
          targetLang: nativeLang,
          filePath: result.second.filePath,
          downloadedAt: result.second.downloadedAt,
          version: CURRENT_DICTIONARY_VERSION.id,
        });
        await setActivePair({ sourceLang: nativeLang, targetLang: studiedLang });
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
    if (!canContinue || !nativeLang || !studiedLang) return;
    setShowConfirmDialog(true);
  };

  const onConfirmAccept = () => {
    if (!nativeLang || !studiedLang) return;
    setShowConfirmDialog(false);
    setStep('download');
    startDownload(nativeLang, studiedLang);
  };

  const onConfirmCancel = () => {
    setShowConfirmDialog(false);
  };

  const onRetry = async () => {
    if (!nativeLang || !studiedLang) return;
    const oldHandle = handleRef.current;
    startDownload(nativeLang, studiedLang);
    try {
      await oldHandle?.cancel();
    } catch {}
  };

  useEffect(() => {
    return () => {
      if (downloadState.kind === 'downloading') {
        handleRef.current?.cancel().catch(() => {});
      }
    };
  }, [downloadState.kind]);

  const colors = useThemeColors();
  const { colorScheme } = useColorScheme();

  if (step === 'download') {
    return (
      <DownloadStep
        nativeLang={nativeLang}
        studiedLang={studiedLang}
        state={downloadState}
        onRetry={onRetry}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950 p-6" edges={['top']}>
      <View className="mt-12 mb-8">
        <Text className="text-2xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">Welcome to Errin</Text>
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">
          Choose your native language and the language you want to learn.
        </Text>
      </View>

      <LanguageGroup
        title="I speak"
        role="native"
        selected={nativeLang}
        disabledCode={studiedLang}
        onSelect={select}
      />

      <View className="h-6" />

      <LanguageGroup
        title="I want to learn"
        role="target"
        selected={studiedLang}
        disabledCode={nativeLang}
        onSelect={select}
      />

      <View className="flex-1" />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue"
        accessibilityState={{ disabled: !canContinue }}
        disabled={!canContinue}
        className={`rounded-lg py-4 items-center ${
          canContinue ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
        }`}
        onPress={onContinue}
      >
        <Text className="text-white dark:text-neutral-100 font-semibold text-base">Continue</Text>
      </Pressable>

      <DownloadConfirmationDialog
        visible={showConfirmDialog}
        sizeBytes={nativeLang && studiedLang ? getPairDownloadSize(nativeLang, studiedLang) : 0}
        onAccept={onConfirmAccept}
        onCancel={onConfirmCancel}
      />
    </SafeAreaView>
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
      <Text className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">{title}</Text>
      <View className="flex-row flex-wrap -m-1">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = selected === lang.code;
          const isDisabled = disabledCode === lang.code;
          return (
            <Pressable
              key={lang.code}
              accessibilityRole="button"
              accessibilityLabel={"Select " + lang.name}
              accessibilityState={{ selected: isSelected, disabled: isDisabled }}
              disabled={isDisabled}
              onPress={() => onSelect(role, lang.code)}
              className={`m-1 px-4 py-3 rounded-lg border ${
                isSelected
                  ? 'bg-blue-600 border-blue-600'
                  : isDisabled
                    ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                    : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700'
              }`}
            >
              <Text
                className={`text-base ${
                  isSelected
                    ? 'text-white font-semibold'
                    : isDisabled
                      ? 'text-neutral-400 dark:text-neutral-500'
                      : 'text-neutral-900 dark:text-neutral-100'
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
  nativeLang: string | null;
  studiedLang: string | null;
  state: DownloadState;
  onRetry: () => void;
}

function DownloadStep({ nativeLang, studiedLang, state, onRetry }: DownloadStepProps) {
  const pairLabel =
    nativeLang && studiedLang
      ? `${getLanguageName(nativeLang) ?? nativeLang} <-> ${getLanguageName(studiedLang) ?? studiedLang}`
      : '';
  const colors = useThemeColors();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950 p-6" edges={['top']}>
      <View className="mt-12 mb-8">
        <Text className="text-2xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">Downloading dictionaries</Text>
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">{pairLabel}</Text>
      </View>

      <View className="flex-1 items-center justify-center">
        {state.kind === 'downloading' ? (
          <DownloadProgressView progress={state.progress} />
        ) : null}
        {state.kind === 'success' ? <ActivityIndicator accessibilityLabel="Loading" color={colors.accent} /> : null}
        {state.kind === 'error' ? (
          <View className="items-center">
            <Text className="text-base text-red-600 dark:text-red-500 mb-4 text-center">{state.message}</Text>
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
          className="rounded-lg py-4 items-center bg-neutral-200 dark:bg-neutral-800"
        >
          <Text className="text-neutral-500 dark:text-neutral-400 font-semibold text-base">
            Please wait...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function DownloadProgressView({ progress }: { progress: PairDownloadProgress }) {
  const { totalBytesWritten, totalBytesExpectedToWrite, fraction } = progress;
  const knownTotal = totalBytesExpectedToWrite > 0;
  const percent = Math.round(fraction * 100);
  const colors = useThemeColors();

  return (
    <View className="w-full">
      <View className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
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
        <Text className="text-sm text-neutral-600 dark:text-neutral-400">
          {knownTotal ? `${percent}%` : 'Starting...'}
        </Text>
        <Text className="text-sm text-neutral-600 dark:text-neutral-400">
          {knownTotal
            ? `${formatBytes(totalBytesWritten)} / ${formatBytes(totalBytesExpectedToWrite)}`
            : formatBytes(totalBytesWritten)}
        </Text>
      </View>
      {!knownTotal ? (
        <View className="mt-4 items-center">
          <ActivityIndicator accessibilityLabel="Loading" color={colors.accent} />
        </View>
      ) : null}
    </View>
  );
}
