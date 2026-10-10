import { useCallback } from 'react';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * `useActionSheet` ile aynı arayüz. Android'de menü gezinme çubuğunun (alt sistem çubuğu) ALTINDA
 * kalıyordu: seçenekler çubukla üst üste biniyordu. Menü kabına alt güvenli alan kadar boşluk eklenir
 * (iOS yerel menüyü kullandığı için `containerStyle` yok sayılır).
 */
export function useSafeActionSheet() {
  const { showActionSheetWithOptions, ...rest } = useActionSheet();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 16) + 8;

  const showSafe = useCallback(
    (options, callback) =>
      showActionSheetWithOptions(
        { ...options, containerStyle: { paddingBottom: bottom, ...(options && options.containerStyle) } },
        callback
      ),
    [showActionSheetWithOptions, bottom]
  );

  return { ...rest, showActionSheetWithOptions: showSafe };
}
