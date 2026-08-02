import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
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
import { DownloadConfirmationDialog } from './DownloadConfirmationDialog';

type Step = 'select' | 'confirm' | 'download';

interface DownloadItem {
  sourceLang: string;
  targetLang: string;
  progress: PairDownloadProgress;
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
  const [nativeLang, setNativeLang] = useState<string | null>(null);
  const [studiedLang, setStudiedLang] = useState<string | null>(null);
  const [downloadItems, setDownloadItems] = useState<DownloadItem[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const downloadHandlesRef = useRef<Map<string, PairDownloadHandle>>(new Map());

  const installedPairKeys = new Set(
    dictionaries.map((d) => `${d.sourceLang}-${d.targetLang}`)
  );

  const canAdd =
    nativeLang !== null &&
    studiedLang !== null &&
    nativeLang !== studiedLang &&
    !installedPairKeys.has(`${nativeLang}-${studiedLang}`) &&
    !installedPairKeys.has(`${studiedLang}-${nativeLang}`);

  const onAdd = async () => {
    if (!canAdd) return;
    setShowConfirmDialog(true);
  };

  const onConfirmAccept = () => {
    if (!nativeLang || !studiedLang) return;
    setShowConfirmDialog(false);
    setStep('download');
    setDownloadItems([{
      sourceLang: nativeLang,
      targetLang: studiedLang,
      progress: { fraction: 0, totalBytesWritten: 0, totalBytesExpectedToWrite: 0 },
      status: 'downloading',
    }]);

    const pairKey = `${nativeLang}-${studiedLang}`;
    const handle = startPairDownload(nativeLang, studiedLang, (progress) => {
      setDownloadItems((prev) =>
        prev.map((item) =>
          item.sourceLang === nativeLang && item.targetLang === studiedLang
            ? { ...item, progress, status: 'downloading' }
            : item
        )
      );
    });

    downloadHandlesRef.current.set(pairKey, handle);

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
        setDownloadItems((prev) =>
          prev.map((item) =>
            item.sourceLang === nativeLang && item.targetLang === studiedLang
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
            item.sourceLang === nativeLang && item.targetLang === studiedLang
              ? { ...item, status: 'error', errorMessage: message }
              : item
          )
        );
        if (downloadHandlesRef.current.get(pairKey) === handle) {
          downloadHandlesRef.current.delete(pairKey);
        }
      });
  };

  const onConfirmCancel = () => {
    setShowConfirmDialog(false);
  };

  const onRetry = async () => {
    if (!nativeLang || !studiedLang) return;

    const pairKey = `${nativeLang}-${studiedLang}`;
    setDownloadItems((prev) =>
      prev.map((item) =>
        item.sourceLang === nativeLang && item.targetLang === studiedLang
          ? { ...item, status: 'downloading' }
          : item
      )
    );
    const existingHandle = downloadHandlesRef.current.get(pairKey);
    await existingHandle?.cancel().catch(() => {});

    const handle = startPairDownload(nativeLang, studiedLang, (progress) => {
      setDownloadItems((prev) =>
        prev.map((item) =>
          item.sourceLang === nativeLang && item.targetLang === studiedLang
            ? { ...item, progress, status: 'downloading' }
            : item
        )
      );
    });

    downloadHandlesRef.current.set(pairKey, handle);

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
        setDownloadItems((prev) =>
          prev.map((item) =>
            item.sourceLang === nativeLang && item.targetLang === studiedLang
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
            item.sourceLang === nativeLang && item.targetLang === studiedLang
              ? { ...item, status: 'error', errorMessage: message }
              : item
          )
        );
        if (downloadHandlesRef.current.get(pairKey) === handle) {
          downloadHandlesRef.current.delete(pairKey);
        }
      });
  };

  useEffect(() => {
    if (visible) {
      setStep('select');
      setNativeLang(null);
      setStudiedLang(null);
      setDownloadItems([]);
      downloadHandlesRef.current.clear();
    }
  }, [visible]);

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
    await Promise.all(
      Array.from(downloadHandlesRef.current.values()).map((handle) =>
        handle.cancel().catch(() => {})
      )
    );
    downloadHandlesRef.current.clear();
    setNativeLang(null);
    setStudiedLang(null);
    setStep('select');
    setDownloadItems([]);
    onClose();
  };

  const allDownloadsComplete = downloadItems.every(
    (item) => item.status === 'success' || item.status === 'error'
  );

  const hasErrors = downloadItems.some((item) => item.status === 'error');

  return (
    <>
      <DownloadConfirmationDialog
        visible={showConfirmDialog}
        sizeBytes={nativeLang && studiedLang ? getPairDownloadSize(nativeLang, studiedLang) : 0}
        onAccept={onConfirmAccept}
        onCancel={onConfirmCancel}
      />
      {step === 'select' && (
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
                Pick native and studied languages to download both dictionary directions.
              </Text>
              <View className="mb-4">
                <Text className="text-sm font-medium text-neutral-900 mb-2">
                  Native Language
                </Text>
                <View className="flex-row flex-wrap -m-1">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = nativeLang === lang.code;
                    return (
                      <Pressable
                        key={lang.code}
                        accessibilityRole="button"
                        accessibilityLabel={lang.name}
                        accessibilityState={{ selected: isSelected }}
                        onPress={() => setNativeLang(lang.code)}
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
                  Studied Language
                </Text>
                <View className="flex-row flex-wrap -m-1">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = studiedLang === lang.code;
                    const isNative = nativeLang === lang.code;
                    const isDisabled = isNative || (nativeLang !== null && installedPairKeys.has(`${nativeLang}-${lang.code}`)) || (nativeLang !== null && installedPairKeys.has(`${lang.code}-${nativeLang}`));
                    return (
                      <Pressable
                        key={lang.code}
                        accessibilityRole="button"
                        accessibilityLabel={lang.name}
                        accessibilityState={{ selected: isSelected, disabled: isDisabled }}
                        disabled={isDisabled}
                        onPress={() => setStudiedLang(lang.code)}
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
      )}
      {step === 'download' && (
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
                  Downloading Dictionaries
                </Text>
              </View>
              <View className="p-4">
                <Text className="text-sm text-neutral-600 mb-4">
                  Downloading both directions for {getLanguageName(nativeLang ?? '') ?? nativeLang}{' ↔ '}{getLanguageName(studiedLang ?? '') ?? studiedLang}
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
                          {sourceName}{' → '}{targetName}
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
      )}
    </>
  );
}
