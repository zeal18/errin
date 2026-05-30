import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { SUPPORTED_LANGUAGES, getLanguageName } from '@errin/core';
import {
  startDictionaryDownload,
  type DownloadHandle,
  type DownloadProgress,
} from '../lib/dictionaryDownload';
import { useAppStore } from '../store';

type Step = 'select' | 'download';

interface DownloadItem {
  sourceLang: string;
  targetLang: string;
  progress: DownloadProgress;
  status: 'pending' | 'downloading' | 'success' | 'error';
  errorMessage?: string;
}

export function AddLanguagePairModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const dictionaries = useAppStore((s) => s.dictionaries);
  const addDictionary = useAppStore((s) => s.addDictionary);

  const [step, setStep] = useState<Step>('select');
  const [sourceLang, setSourceLang] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState<string | null>(null);
  const [downloadItems, setDownloadItems] = useState<DownloadItem[]>([]);
  const downloadHandlesRef = useRef<Map<string, DownloadHandle>>(new Map());

  // Compute installed pair keys as Set of "sourceLang-targetLang"
  const installedPairKeys = new Set(
    dictionaries.map((d) => `${d.sourceLang}-${d.targetLang}`)
  );

  const canAdd =
    sourceLang !== null &&
    targetLang !== null &&
    sourceLang !== targetLang &&
    !installedPairKeys.has(`${sourceLang}-${targetLang}`);

  const onAdd = async () => {
    if (!canAdd) return;

    const pairKey = `${sourceLang}-${targetLang}`;
    setStep('download');
    setDownloadItems([{
      sourceLang: sourceLang!,
      targetLang: targetLang!,
      progress: { totalBytesWritten: 0, totalBytesExpectedToWrite: 0, fraction: 0 },
      status: 'pending',
    }]);

    const handle = startDictionaryDownload(sourceLang!, targetLang!, (progress) => {
      setDownloadItems((prev) =>
        prev.map((item) =>
          item.sourceLang === sourceLang && item.targetLang === targetLang
            ? { ...item, progress, status: 'downloading' }
            : item
        )
      );
    });

    downloadHandlesRef.current.set(pairKey, handle);

    handle.promise
      .then(async (result) => {
        await addDictionary({
          sourceLang: sourceLang!,
          targetLang: targetLang!,
          filePath: result.filePath,
          downloadedAt: result.downloadedAt,
        });
        setDownloadItems((prev) =>
          prev.map((item) =>
            item.sourceLang === sourceLang && item.targetLang === targetLang
              ? { ...item, status: 'success' }
              : item
          )
        );
        if (downloadHandlesRef.current.get(pairKey) === handle) {
          downloadHandlesRef.current.delete(pairKey);
        }
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Download failed. Please try again.';
        setDownloadItems((prev) =>
          prev.map((item) =>
            item.sourceLang === sourceLang && item.targetLang === targetLang
              ? { ...item, status: 'error', errorMessage: message }
              : item
          )
        );
        if (downloadHandlesRef.current.get(pairKey) === handle) {
          downloadHandlesRef.current.delete(pairKey);
        }
      });
  };

  const onRetry = async () => {
    if (!sourceLang || !targetLang) return;

    const pairKey = `${sourceLang}-${targetLang}`;
    setDownloadItems((prev) =>
      prev.map((item) =>
        item.sourceLang === sourceLang && item.targetLang === targetLang
          ? { ...item, status: 'downloading' }
          : item
      )
    );
    const existingHandle = downloadHandlesRef.current.get(pairKey);
    await existingHandle?.cancel().catch(() => {});

    const handle = startDictionaryDownload(sourceLang, targetLang, (progress) => {
      setDownloadItems((prev) =>
        prev.map((item) =>
          item.sourceLang === sourceLang && item.targetLang === targetLang
            ? { ...item, progress, status: 'downloading' }
            : item
        )
      );
    });

    downloadHandlesRef.current.set(pairKey, handle);

    handle.promise
      .then(async (result) => {
        await addDictionary({
          sourceLang: sourceLang,
          targetLang: targetLang,
          filePath: result.filePath,
          downloadedAt: result.downloadedAt,
        });
        setDownloadItems((prev) =>
          prev.map((item) =>
            item.sourceLang === sourceLang && item.targetLang === targetLang
              ? { ...item, status: 'success' }
              : item
          )
        );
        if (downloadHandlesRef.current.get(pairKey) === handle) {
          downloadHandlesRef.current.delete(pairKey);
        }
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Download failed. Please try again.';
        setDownloadItems((prev) =>
          prev.map((item) =>
            item.sourceLang === sourceLang && item.targetLang === targetLang
              ? { ...item, status: 'error', errorMessage: message }
              : item
          )
        );
        if (downloadHandlesRef.current.get(pairKey) === handle) {
          downloadHandlesRef.current.delete(pairKey);
        }
      });
  };

  // Reset state when modal becomes visible
  useEffect(() => {
    if (visible) {
      setStep('select');
      setSourceLang(null);
      setTargetLang(null);
      setDownloadItems([]);
      downloadHandlesRef.current.clear();
    }
  }, [visible]);

  // Clean up download handles on unmount
  useEffect(() => {
    return () => {
      const cancelPromises = Array.from(downloadHandlesRef.current.values()).map(
        (handle) => handle.cancel().catch(() => {})
      );
      Promise.all(cancelPromises).then(() => {
        downloadHandlesRef.current.clear();
      });
    };
  }, []);

  const closeAndReset = async () => {
    // Cancel all in-progress downloads
    await Promise.all(
      Array.from(downloadHandlesRef.current.values()).map((handle) =>
        handle.cancel().catch(() => {})
      )
    );
    downloadHandlesRef.current.clear();
    setSourceLang(null);
    setTargetLang(null);
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
        accessible={true}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-center items-center"
          onPress={closeAndReset}
          accessibilityRole="button"
          accessibilityLabel="Close add language pair modal"
        >
          <Pressable
            className="bg-white rounded-xl w-80 overflow-hidden"
            onPress={(e) => e.stopPropagation()}
            accessibilityRole="button"
            accessibilityLabel="Add language pair modal content"
            accessibilityViewIsModal={true}
          >
            <View className="px-4 py-3 border-b border-neutral-200">
              <Text className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
                Add Language Pair
              </Text>
            </View>
            <View className="p-4">
              <Text className="text-sm text-neutral-600 mb-4">
                Pick source and target languages to download a dictionary pair.
              </Text>
              <View className="mb-4">
                <Text className="text-sm font-medium text-neutral-900 mb-2">
                  Source Language
                </Text>
                <View className="flex-row flex-wrap -m-1">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = sourceLang === lang.code;
                    return (
                      <Pressable
                        key={lang.code}
                        accessibilityRole="button"
                        accessibilityLabel={lang.name}
                        accessibilityState={{ selected: isSelected }}
                        onPress={() => setSourceLang(lang.code)}
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
              </View>
              <View className="mb-6">
                <Text className="text-sm font-medium text-neutral-900 mb-2">
                  Target Language
                </Text>
                <View className="flex-row flex-wrap -m-1">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = targetLang === lang.code;
                    const isSource = sourceLang === lang.code;
                    const isDisabled = isSource || (sourceLang !== null && installedPairKeys.has(`${sourceLang}-${lang.code}`));
                    return (
                      <Pressable
                        key={lang.code}
                        accessibilityRole="button"
                        accessibilityLabel={lang.name}
                        accessibilityState={{ selected: isSelected, disabled: isDisabled }}
                        disabled={isDisabled}
                        onPress={() => setTargetLang(lang.code)}
                        className={`m-1 px-4 py-3 rounded-lg border ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : isDisabled
                              ? 'bg-neutral-100 border-neutral-300'
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
              <View className="flex-row justify-end gap-3">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                  className="rounded-lg py-3 px-6 items-center bg-neutral-200"
                  onPress={closeAndReset}
                >
                  <Text className="text-neutral-700 font-semibold text-base">Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add"
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

  // Download step
  if (step === 'download') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={allDownloadsComplete ? closeAndReset : undefined}
        accessible={true}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-center items-center"
          onPress={allDownloadsComplete ? closeAndReset : undefined}
          accessibilityRole="button"
          accessibilityLabel="Close add language pair modal"
          accessibilityState={{ disabled: !allDownloadsComplete }}
        >
          <Pressable
            className="bg-white rounded-xl w-80 overflow-hidden"
            onPress={(e) => e.stopPropagation()}
            accessibilityRole="button"
            accessibilityLabel="Add language pair modal content"
            accessibilityViewIsModal={true}
          >
            <View className="px-4 py-3 border-b border-neutral-200">
              <Text className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
                Downloading Dictionary
              </Text>
            </View>
            <View className="p-4">
              <Text className="text-sm text-neutral-600 mb-4">
                Downloading dictionary for {getLanguageName(sourceLang ?? '') ?? sourceLang} -> {getLanguageName(targetLang ?? '') ?? targetLang}
              </Text>
              <View className="gap-3 mb-4">
                {downloadItems.map((item) => {
                  const sourceName = getLanguageName(item.sourceLang) ?? item.sourceLang;
                  const targetName = getLanguageName(item.targetLang) ?? item.targetLang;
                  const progressPercent = Math.round(item.progress.fraction * 100);
                  const knownTotal = item.progress.totalBytesExpectedToWrite > 0;

                  return (
                    <View
                      key={`${item.sourceLang}-${item.targetLang}`}
                      className="border border-neutral-200 rounded-lg p-3"
                    >
                      <Text className="text-sm font-medium text-neutral-900">
                        {sourceName} -> {targetName}
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
                            onPress={onRetry}
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
                    accessibilityLabel={hasErrors ? 'Close' : 'Done'}
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
                  <ActivityIndicator accessibilityLabel="Downloading" />
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
