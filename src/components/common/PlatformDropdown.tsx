// FILE 2: src/components/common/PlatformDropdown.tsx
// CREATE NEW FILE

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { CEX_PLATFORMS, WALLET_TYPES } from '../../constants/accountConstants';
import type { CexPlatform, WalletType } from '../../types/account.types';

// ============================================
// PLATFORM DROPDOWN COMPONENT
// ============================================

type PlatformType = 'cex' | 'wallet';
type SelectedPlatform = CexPlatform | WalletType;

interface PlatformItem {
  key: CexPlatform | WalletType;
  name: string;
  logo?: string;
}

interface PlatformDropdownProps {
  type: PlatformType;
  value?: SelectedPlatform;
  onChange: (platform: SelectedPlatform) => void;
  label?: string;
  error?: string;
}

export const PlatformDropdown: React.FC<PlatformDropdownProps> = ({
  type,
  value,
  onChange,
  label = 'Platform',
  error,
}) => {
  const { colors } = useTheme();
  const [showOptions, setShowOptions] = useState(false);

  const platforms =
    type === 'cex'
      ? Object.entries(CEX_PLATFORMS).map(([key, data]) => ({
          key: key as CexPlatform,
          ...data,
        }))
      : Object.entries(WALLET_TYPES).map(([key, data]) => ({
          key: key as WalletType,
          ...data,
        }));

  const selectedPlatform = platforms.find(p => p.key === value);

  const handleSelect = (platform: SelectedPlatform) => {
    onChange(platform);
    setShowOptions(false);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
        </Text>
      )}

      {/* Dropdown Button */}
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
            borderWidth: error ? 2 : 1,
          },
        ]}
        onPress={() => setShowOptions(true)}
        activeOpacity={0.7}
      >
        <View style={styles.buttonContent}>
          {selectedPlatform ? (
            <>
              <Text style={styles.platformIcon}>{selectedPlatform.logo}</Text>
              <Text style={[styles.buttonText, { color: colors.text }]}>
                {selectedPlatform.name}
              </Text>
            </>
          ) : (
            <Text style={[styles.buttonPlaceholder, { color: colors.textSecondary }]}>
              Select {type === 'cex' ? 'Exchange' : 'Wallet'}
            </Text>
          )}
        </View>
        <Text style={[styles.arrow, { color: colors.textSecondary }]}>▼</Text>
      </TouchableOpacity>

      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}

      {/* Options Modal */}
      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View
            style={[
              styles.optionsContainer,
              { backgroundColor: colors.surface, ...Shadow.lg },
            ]}
          >
            <FlatList<PlatformItem>
              data={platforms}
              keyExtractor={item => item.key}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    {
                      backgroundColor:
                        value === item.key ? colors.bg1 : 'transparent',
                      borderBottomColor: colors.border,
                    },
                  ]}
                  onPress={() => handleSelect(item.key as SelectedPlatform)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.optionIcon}>{item.logo}</Text>
                  <Text style={[styles.optionName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  {value === item.key && (
                    <Text style={[styles.checkmark, { color: colors.primary }]}>
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              scrollEnabled={true}
              nestedScrollEnabled={true}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.base,
    minHeight: 48,
  },
  buttonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  platformIcon: {
    fontSize: 24,
  },
  buttonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  buttonPlaceholder: {
    fontSize: Typography.fontSize.base,
  },
  arrow: {
    fontSize: Typography.fontSize.base,
    marginLeft: Spacing.md,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  optionsContainer: {
    borderRadius: BorderRadius.lg,
    maxHeight: '60%',
    width: '100%',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  optionIcon: {
    fontSize: 24,
  },
  optionName: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  checkmark: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
});
