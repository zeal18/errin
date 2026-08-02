import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { isOnWifi } from '../lib/networkStatus';
import { formatBytes } from '../lib/formatUtils';

export function DownloadConfirmationDialog({
  visible,
  sizeBytes,
  onAccept,
  onCancel,
}: {
  visible: boolean;
  sizeBytes: number;
  onAccept: () => void;
  onCancel: () => void;
}) {
  const [isOnWifiState, setIsOnWifiState] = useState<boolean | null>(null);

  useEffect(() => {
    if (visible) {
      isOnWifi().then(setIsOnWifiState);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
      accessible={true}
    >
      <Pressable
        className="flex-1 bg-black/40 justify-center items-center"
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Close download confirmation dialog"
      >
        <Pressable
          className="bg-white rounded-xl w-80 overflow-hidden"
          onPress={(e) => e.stopPropagation()}
          accessibilityRole="button"
          accessibilityLabel="Download confirmation dialog"
          accessibilityViewIsModal={true}
        >
          <View className="px-4 py-3 border-b border-neutral-200">
            <Text className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
              Confirm Download
            </Text>
          </View>
          <View className="p-4">
            <Text className="text-base text-neutral-600 mb-4">
              Download size: {formatBytes(sizeBytes)}
            </Text>
            {isOnWifiState === false && (
              <View className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                <Text className="text-sm text-amber-800">
                  Not connected to Wi-Fi — this will use mobile data
                </Text>
              </View>
            )}
            <View className="flex-row justify-end gap-3">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel download"
                className="rounded-lg py-3 px-6 items-center bg-neutral-200"
                onPress={onCancel}
              >
                <Text className="text-neutral-700 font-semibold text-base">Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Accept download"
                className="rounded-lg py-3 px-6 items-center bg-blue-600"
                onPress={onAccept}
              >
                <Text className="text-white font-semibold text-base">Accept</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default DownloadConfirmationDialog;
