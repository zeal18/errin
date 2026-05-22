import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { SUPPORTED_LANGUAGES, getLanguageName } from '@errin/core';
import {
  startDictionaryDownload,
  type DownloadHandle,
  type DownloadProgress,
} from '../lib/dictionaryDownload';
import { useAppStore } from '../store';

type Step = 'select' | 'download' | 'empty';

interface DownloadItem {
  sourceLang: string;
  targetLang: string;
  progress: DownloadProgress;
  status: 'pending' | 'downloading' | 'success' | 'error';
  errorMessage?: string;
}

export function AddTargetLanguageModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const dictionaries = useAppStore((s) => s.dictionaries);
  const addDictionary = useAppStore((s) => s.addDictionary);
  
  const [step, setStep] = useState<Step>('select');
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [downloadItems, setDownloadItems] = useState<DownloadItem[]>([]);
  const downloadHandlesRef = useRef<Map<string, DownloadHandle>>(new Map());

  // Get unique installed source languages
  const installedSourceLangs = Array.from(
    new Set(dictionaries.map((d) => d.sourceLang))
  );

  // Get already installed target languages
  const installedTargetLangs = Array.from(
    new Set(dictionaries.map((d) => d.targetLang))
  );

  // Available languages are those not already installed as target
  const availableLanguages = SUPPORTED_LANGUAGES.filter(
    (l) => !installedTargetLangs.includes(l.code)
  );

  const canAdd = selectedLang !== null;

  const startDownloads = async () => {
    if (!selectedLang) return;
    
    const validSourceLangs = installedSourceLangs.filter((s) => s !== selectedLang);
    if (validSourceLangs.length === 0) {
      setStep('empty');
      return;
    }
    
    setStep('download');
    const items: DownloadItem[] = validSourceLangs.map((sourceLang) => ({
      sourceLang,
      targetLang: selectedLang,
      progress: { totalBytesWritten: 0, totalBytesExpectedToWrite: 0, fraction: 0 },
      status: 'pending',
    }));
    setDownloadItems(items);

    // Start all downloads concurrently
    const handles: Map<string, DownloadHandle> = new Map();
    
    for (const sourceLang of validSourceLangs) {
      const pairKey = `${sourceLang}-${selectedLang}`;
      const handle = startDictionaryDownload(sourceLang, selectedLang, (progress) => {
        setDownloadItems((prev) =>
          prev.map((item) =>
            item.sourceLang === sourceLang && item.targetLang === selectedLang
              ? { ...item, progress, status: 'downloading' }
              : item
          )
        );
      });
      handles.set(pairKey, handle);

      handle.promise
        .then(async (result) => {
          await addDictionary({
            sourceLang,
            targetLang: selectedLang,
            filePath: result.filePath,
            downloadedAt: result.downloadedAt,
          });
          setDownloadItems((prev) =>
            prev.map((item) =>
              item.sourceLang === sourceLang && item.targetLang === selectedLang
                ? { ...item, status: 'success' }
                : item
            )
          );
        })
        .catch((err: unknown) => {
          const message =
            err instanceof Error ? err.message : 'Download failed. Please try again.';
          setDownloadItems((prev) =>
            prev.map((item) =>
              item.sourceLang === sourceLang && item.targetLang === selectedLang
                ? { ...item, status: 'error', errorMessage: message }
                : item
            )
          );
        });
    }

    downloadHandlesRef.current = handles;
  };

  const onAdd = () => {
    if (!canAdd) return;
    startDownloads();
  };

  const onRetry = async (sourceLang: string) => {
    if (!selectedLang) return;
    
    const pairKey = `${sourceLang}-${selectedLang}`;
    const existingHandle = downloadHandlesRef.current.get(pairKey);
    if (existingHandle) {
      await existingHandle.cancel().catch(() => {});
    }
    const handle = startDictionaryDownload(sourceLang, selectedLang, (progress) => {
      setDownloadItems((prev) =>
        prev.map((item) =>
          item.sourceLang === sourceLang && item.targetLang === selectedLang
            ? { ...item, progress, status: 'downloading' }
            : item
        )
      );
    });
    
    downloadHandlesRef.current.set(pairKey, handle);

    handle.promise
      .then(async (result) => {
        await addDictionary({
          sourceLang,
          targetLang: selectedLang,
          filePath: result.filePath,
          downloadedAt: result.downloadedAt,
        });
        setDownloadItems((prev) =>
          prev.map((item) =>
            item.sourceLang === sourceLang && item.targetLang === selectedLang
              ? { ...item, status: 'success' }
              : item
          )
        );
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Download failed. Please try again.';
        setDownloadItems((prev) =>
          prev.map((item) =>
            item.sourceLang === sourceLang && item.targetLang === selectedLang
              ? { ...item, status: 'error', errorMessage: message }
              : item
          )
        );
      });
  };

  // Clean up download handles on unmount or close
  useEffect(() => {
    return () => {
      downloadHandlesRef.current.forEach(async (handle) => {
        await handle.cancel().catch(() => {});
      });
      downloadHandlesRef.current.clear();
    };
  }, []);

  const closeAndReset = () => {
    // Cancel all in-progress downloads
    downloadHandlesRef.current.forEach(async (handle) => {
      await handle.cancel().catch(() => {});
    });
    downloadHandlesRef.current.clear();
    setSelectedLang(null);
    setStep('select');
    setDownloadItems([]);
    onClose();
  };

  const allDownloadsComplete = downloadItems.every(
    (item) => item.status === 'success' || item.status === 'error'
  );

  const hasErrors = downloadItems.some((item) => item.status === 'error');

  if (step === 'select') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={closeAndReset}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-center items-center"
          onPress={closeAndReset}
          accessibilityRole="button"
          accessibilityLabel="Close add target language modal"
        >
          <Pressable
            className="bg-white rounded-xl w-80 overflow-hidden"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="px-4 py-3 border-b border-neutral-200">
              <Text className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
                Add Target Language
              </Text>
            </View>
            <View className="p-4">
              <Text className="text-sm text-neutral-600 mb-4">
                Pick a language to learn. Dictionaries will be downloaded for all
                installed source languages.
              </Text>
              <View className="flex-row flex-wrap -m-1 mb-6">
                {availableLanguages.map((lang) => {
                  const isSelected = selectedLang === lang.code;
                  return (
                    <Pressable
                      key={lang.code}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => setSelectedLang(lang.code)}
                      className={`m-1 px-4 py-3 rounded-lg border ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-white border-neutral-300'
                      }`}
                    >
                      <Text
                        className={`text-base ${
                          isSelected
                            ? 'text-white font-semibold'
                            : 'text-neutral-900'
                        }`}
                      >
                        {lang.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View className="flex-row justify-end gap-3">
                <Pressable
                  accessibilityRole="button"
                  className="rounded-lg py-3 px-6 items-center bg-neutral-200"
                  onPress={closeAndReset}
                >
                  <Text className="text-neutral-700 font-semibold text-base">Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={!canAdd}
                  accessibilityState={{ disabled: !canAdd }}
                  className={`rounded-lg py-3 px-6 items-center ${
                    canAdd ? 'bg-blue-600' : 'bg-neutral-300'
                  }`}
                  onPress={onAdd}
                >
                  <Text className="text-white font-semibold text-base">Add</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  if (step === 'empty') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={closeAndReset}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-center items-center"
          onPress={closeAndReset}
          accessibilityRole="button"
          accessibilityLabel="Close add target language modal"
        >
          <Pressable
            className="bg-white rounded-xl w-80 overflow-hidden"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="px-4 py-3 border-b border-neutral-200">
              <Text className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
                Add Target Language
              </Text>
            </View>
            <View className="p-4">
              <Text className="text-sm text-neutral-600 mb-4">
                No source languages installed. Please add a source language first, then try adding a target language again.
              </Text>
              <View className="flex-row justify-end gap-3">
                <Pressable
                  accessibilityRole="button"
                  className="rounded-lg py-3 px-6 items-center bg-blue-600"
                  onPress={closeAndReset}
                >
                  <Text className="text-white font-semibold text-base">Back</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  // Download step
  if (step === 'download') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={allDownloadsComplete ? closeAndReset : undefined}
      >
      <Pressable
        className="flex-1 bg-black/40 justify-center items-center"
        onPress={allDownloadsComplete ? closeAndReset : undefined}
        accessibilityRole="button"
        accessibilityLabel="Close add target language modal"
      >
        <Pressable
          className="bg-white rounded-xl w-80 overflow-hidden"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="px-4 py-3 border-b border-neutral-200">
            <Text className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
              Downloading Dictionaries
            </Text>
          </View>
          <View className="p-4">
            <Text className="text-sm text-neutral-600 mb-4">
              Downloading {downloadItems.length} dictionary pair{
                downloadItems.length !== 1 ? 's' : ''
              } for all installed sources → {getLanguageName(selectedLang ?? '') ?? selectedLang}
            </Text>
            <View className="gap-3 mb-4">
              {downloadItems.map((item) => {
                const sourceName = getLanguageName(item.sourceLang) ?? item.sourceLang;
                const progressPercent = Math.round(item.progress.fraction * 100);
                const knownTotal = item.progress.totalBytesExpectedToWrite > 0;

                return (
                  <View
                    key={`${item.sourceLang}-${item.targetLang}`}
                    className="border border-neutral-200 rounded-lg p-3"
                  >
                    <Text className="text-sm font-medium text-neutral-900">
                      {sourceName} → {getLanguageName(item.targetLang) ?? item.targetLang}
                    </Text>
                    {item.status === 'pending' && (
                      <View className="mt-2">
                        <Text className="text-xs text-neutral-500">Waiting...</Text>
                      </View>
                    )}
                    {item.status === 'downloading' && (
                      <>
                        <View className="mt-2 h-2 rounded-full bg-neutral-200 overflow-hidden">
                          {knownTotal ? (
                            <View
                              className="h-full bg-blue-600"
                              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                            />
                          ) : (
                            <View className="h-full" />
                          )}
                        </View>
                        <View className="mt-1 flex-row justify-between">
                          <Text className="text-xs text-neutral-600">
                            {knownTotal ? `${progressPercent}%` : 'Starting...'}
                          </Text>
                        </View>
                      </>
                    )}
                    {item.status === 'success' && (
                      <View className="mt-2 flex-row items-center gap-2">
                        <View className="w-4 h-4 rounded-full bg-green-500" />
                        <Text className="text-xs text-green-600">Complete</Text>
                      </View>
                    )}
                    {item.status === 'error' && (
                      <View className="mt-2">
                        <Text className="text-xs text-red-600">{item.errorMessage}</Text>
                        <Pressable
                          className="mt-1"
                          onPress={() => onRetry(item.sourceLang)}
                          accessibilityRole="button"
                          accessibilityLabel={`Retry downloading ${item.sourceLang}-${item.targetLang}`}
                        >
                          <Text className="text-xs text-blue-600 font-medium">Retry</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
            {allDownloadsComplete && (
              <View className="flex-row justify-end gap-3">
                <Pressable
                  accessibilityRole="button"
                  className="rounded-lg py-3 px-6 items-center bg-blue-600"
                  onPress={closeAndReset}
                >
                  <Text className="text-white font-semibold text-base">
                    {hasErrors ? 'Close' : 'Done'}
                  </Text>
                </Pressable>
              </View>
            )}
            {!allDownloadsComplete && (
              <View className="items-center py-2">
                <ActivityIndicator />
                <Text className="text-sm text-neutral-500 mt-2">Downloading...</Text>
              </View>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
  }
}
