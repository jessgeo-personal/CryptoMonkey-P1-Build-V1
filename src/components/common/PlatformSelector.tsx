// src/components/common/PlatformSelector.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Button } from './Button';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { CEX_PLATFORMS, WALLET_TYPES } from '../../constants/accountConstants';
import type { CexPlatform, WalletType } from '../../types/account.types';

// ============================================
// PLATFORM SELECTOR COMPONENT
// ============================================

type PlatformType = 'cex' | 'wallet';
type SelectedPlatform = CexPlatform | WalletType;

interface PlatformItem {
  key: CexPlatform | WalletType;
  name: string;
  logo?: string;
  subtitle?: string;
}

interface PlatformSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (platform: SelectedPlatform) => void;
  type: PlatformType;
  selectedPlatform?: SelectedPlatform;
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  visible,
  onClose,
  onSelect,
  type,
  selectedPlatform,
}) => {
  const { colors } = useTheme();

  const platforms =
    type === 'cex'
      ? Object.entries(CEX_PLATFORMS).map(([key, value]) => ({
          key: key as CexPlatform,
          ...value,
        }))
      : Object.entries(WALLET_TYPES).map(([key, value]) => ({
          key: key as WalletType,
          ...value,
          subtitle: value.isHardware ? 'Hardware Wallet' : 'Software Wallet',
        }));

console.log('🔍 PlatformSelector platforms:', platforms, 'type:', type);

  const handleSelect = (platformKey: SelectedPlatform) => {
    onSelect(platformKey);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select {type === 'cex' ? 'Exchange' : 'Wallet Type'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {/* Platform List */}
          <FlatList<PlatformItem>
            data={platforms}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.platformItem,
                  { borderBottomColor: colors.border },
                  selectedPlatform === item.key && {
                    backgroundColor: colors.bg1,
                  },
                ]}
                onPress={() => handleSelect(item.key as SelectedPlatform)}
              >
                <Text style={styles.platformLogo}>{item.logo}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.platformName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  {item.subtitle && (
                    <Text
                      style={[styles.platformSubtitle, { color: colors.textSecondary }]}
                    >
                      {item.subtitle}
                    </Text>
                  )}
                </View>
                {selectedPlatform === item.key && (
                  <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            style={styles.platformList}
            scrollEnabled={true}
            nestedScrollEnabled={true}
          />

          {/* Footer */}
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <Button
              title="Cancel"
              onPress={onClose}
              variant="secondary"
              fullWidth
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
    ...Shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  closeButtonText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.normal,
  },
  platformList: {
    flex: 1,
    minHeight: 200, 
  },
  platformItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  platformLogo: {
    fontSize: 28,
  },
  platformName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
  },
  platformSubtitle: {
    fontSize: Typography.fontSize.sm,
  },
  checkmark: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  modalFooter: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
});
