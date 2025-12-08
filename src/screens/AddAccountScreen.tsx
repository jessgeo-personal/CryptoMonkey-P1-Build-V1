// src/screens/AddAccountScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import type { MainTabScreenProps } from '../types/navigation';
import { Button, Input, Card } from '../components/common';
import { PlatformSelector } from '../components/common/PlatformSelector';
import { Spacing, BorderRadius } from '../constants/spacing';
import { Typography } from '../constants/typography';
import {
  CEX_PLATFORMS,
  WALLET_TYPES,
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_VALIDATION,
  CREDENTIAL_REQUIREMENTS,
} from '../constants/accountConstants';
import { AccountService } from '../services/accountService';
import { getUserRepository } from '../services/database/repositories/UserRepository';
import type {
  AccountType,
  CexPlatform,
  WalletType,
} from '../types/account.types';

// ============================================
// ADD ACCOUNT SCREEN
// ============================================

type Props = MainTabScreenProps<'AddAccount'>;
type Step = 'type' | 'platform' | 'details' | 'credentials';

export function AddAccountScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Props['navigation']>();

  // Form state
  const [step, setStep] = useState<Step>('type');
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [platform, setPlatform] = useState<CexPlatform | WalletType | null>(null);
  const [accountName, setAccountName] = useState('');
  const [description, setDescription] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPlatformSelector, setShowPlatformSelector] = useState(false);

  // Step 1: Select Account Type
  const accountTypes: { key: AccountType; label: string; icon: string }[] = [
    { key: 'cex', label: ACCOUNT_TYPE_LABELS.cex, icon: '📊' },
    { key: 'wallet', label: ACCOUNT_TYPE_LABELS.wallet, icon: '📱' },
    { key: 'hardware_wallet', label: ACCOUNT_TYPE_LABELS.hardware_wallet, icon: '🔐' },
    { key: 'defi_protocol', label: ACCOUNT_TYPE_LABELS.defi_protocol, icon: '🌐' },
  ];

  const handleSelectAccountType = (type: AccountType) => {
    setAccountType(type);
    setStep('platform');
  };

  // Step 2: Select Platform
  const handleSelectPlatform = (selectedPlatform: CexPlatform | WalletType) => {
    setPlatform(selectedPlatform);
    
    // Auto-fill account name suggestion
    const platformInfo =
      accountType === 'cex'
        ? CEX_PLATFORMS[selectedPlatform as CexPlatform]
        : WALLET_TYPES[selectedPlatform as WalletType];
    
    if (!accountName) {
      setAccountName(`My ${platformInfo.name} Account`);
    }
    
    setStep('details');
  };

  // Step 3: Validate details form
  const validateDetailsForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!accountName || accountName.length < ACCOUNT_VALIDATION.nameMinLength) {
      newErrors.accountName = 'Account name is required';
    }
    if (accountName.length > ACCOUNT_VALIDATION.nameMaxLength) {
      newErrors.accountName = `Name must be ${ACCOUNT_VALIDATION.nameMaxLength} characters or less`;
    }

    if (accountType === 'wallet' || accountType === 'hardware_wallet') {
      if (!walletAddress || walletAddress.length < ACCOUNT_VALIDATION.addressMinLength) {
        newErrors.walletAddress = 'Valid wallet address required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDetailsNext = () => {
    if (!validateDetailsForm()) return;
    
    // If wallet, we can skip credentials and save
    if (accountType === 'wallet' || accountType === 'hardware_wallet') {
      handleSaveAccount();
    } else {
      setStep('credentials');
    }
  };

  // Step 4: Save account
  const handleSaveAccount = async () => {
    setLoading(true);
    try {
      const userRepo = getUserRepository();
      const user = await userRepo.getOrCreateDefaultUser();

      // Create account
      const newAccount = await AccountService.createAccount(user.id, {
        accountType: accountType!,
        accountName,
        description: description || undefined,
        platform: platform!,
        primaryAddress: walletAddress || undefined,
        baseCurrency: user.baseCurrency,
        autoSyncEnabled: false,
      });

      // Add credentials if CEX
      if (accountType === 'cex' && apiKey) {
        await AccountService.addCredential(
          newAccount.id,
          user.id,
          'api_key',
          apiKey
        );

        if (apiSecret) {
          await AccountService.addCredential(
            newAccount.id,
            user.id,
            'private_key',
            apiSecret
          );
        }
      }

      Alert.alert(
        'Success',
        `${accountName} has been added successfully!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating account:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create account'
      );
    } finally {
      setLoading(false);
    }
  };

  // Render Step 1: Account Type Selection
  const renderTypeSelection = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Select Account Type
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Choose the type of account you want to add
      </Text>

      <View style={styles.optionsGrid}>
        {accountTypes.map((type) => (
          <Card
            key={type.key}
            noPadding
            style={{ marginBottom: Spacing.md }}
          >
            <Button
              title={`${type.icon}  ${type.label}`}
              onPress={() => handleSelectAccountType(type.key)}
              variant="ghost"
              style={{
                padding: Spacing.lg,
                alignItems: 'flex-start',
              }}
            />
          </Card>
        ))}
      </View>
    </View>
  );

  // Render Step 2: Platform Selection
  const renderPlatformSelection = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Select {accountType === 'cex' ? 'Exchange' : 'Wallet'}
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Choose your {accountType === 'cex' ? 'exchange platform' : 'wallet type'}
      </Text>

      <Button
        title={
          platform
            ? `${
                accountType === 'cex'
                  ? CEX_PLATFORMS[platform as CexPlatform].logo
                  : WALLET_TYPES[platform as WalletType].logo
              }  ${
                accountType === 'cex'
                  ? CEX_PLATFORMS[platform as CexPlatform].name
                  : WALLET_TYPES[platform as WalletType].name
              }`
            : 'Choose Platform'
        }
        onPress={() => setShowPlatformSelector(true)}
        variant="outline"
        fullWidth
      />

      {platform && (
        <View style={{ marginTop: Spacing.xl }}>
          <Button
            title="Next"
            onPress={() => setStep('details')}
            fullWidth
          />
        </View>
      )}

      <PlatformSelector
        visible={showPlatformSelector}
        onClose={() => setShowPlatformSelector(false)}
        onSelect={handleSelectPlatform}
        type={accountType === 'cex' ? 'cex' : 'wallet'}
        selectedPlatform={platform || undefined}
      />
    </View>
  );

  // Render Step 3: Account Details
  const renderDetailsForm = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Account Details
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Provide information about your account
      </Text>

      <Input
        label="Account Name *"
        placeholder="e.g., My Binance Account"
        value={accountName}
        onChangeText={setAccountName}
        error={errors.accountName}
        containerStyle={{ marginBottom: Spacing.lg }}
      />

      <Input
        label="Description (Optional)"
        placeholder="Add notes..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        containerStyle={{ marginBottom: Spacing.lg }}
      />

      {(accountType === 'wallet' || accountType === 'hardware_wallet') && (
        <Input
          label="Wallet Address *"
          placeholder="0x..."
          value={walletAddress}
          onChangeText={setWalletAddress}
          error={errors.walletAddress}
          containerStyle={{ marginBottom: Spacing.xl }}
        />
      )}

      <Button
        title={accountType === 'cex' ? 'Next' : 'Save Account'}
        onPress={handleDetailsNext}
        loading={loading}
        disabled={loading}
        fullWidth
      />
    </View>
  );

  // Render Step 4: Credentials (CEX only)
  const renderCredentialsForm = () => {
    const requirements = platform
      ? CREDENTIAL_REQUIREMENTS[platform as keyof typeof CREDENTIAL_REQUIREMENTS] || []
      : [];

    return (
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>
          API Credentials
        </Text>
        <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
          Connect your exchange account securely (Optional - can be added later)
        </Text>

        {requirements.length > 0 && (
          <Card style={{ marginBottom: Spacing.lg }}>
            <Text style={[styles.requirementsTitle, { color: colors.text }]}>
              Required:
            </Text>
            {requirements.map((req, idx) => (
              <Text
                key={idx}
                style={[styles.requirementItem, { color: colors.textSecondary }]}
              >
                • {req}
              </Text>
            ))}
          </Card>
        )}

        <Input
          label={requirements[0] || 'API Key'}
          placeholder="Enter API key..."
          value={apiKey}
          onChangeText={setApiKey}
          containerStyle={{ marginBottom: Spacing.lg }}
          secureTextEntry
        />

        <Input
          label={requirements[1] || 'API Secret'}
          placeholder="Enter API secret..."
          value={apiSecret}
          onChangeText={setApiSecret}
          containerStyle={{ marginBottom: Spacing.xl }}
          secureTextEntry
        />

        <Button
          title="Save Account"
          onPress={handleSaveAccount}
          loading={loading}
          disabled={loading}
          fullWidth
        />

        <Button
          title="Skip for Now"
          onPress={handleSaveAccount}
          variant="ghost"
          fullWidth
          style={{ marginTop: Spacing.md }}
        />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Progress Indicator */}
        <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
          {['type', 'platform', 'details', 'credentials'].map((s, idx) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                {
                  backgroundColor:
                    ['type', 'platform', 'details', 'credentials'].indexOf(step) >= idx
                      ? colors.primary
                      : colors.border,
                },
              ]}
            />
          ))}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'type' && renderTypeSelection()}
          {step === 'platform' && renderPlatformSelection()}
          {step === 'details' && renderDetailsForm()}
          {step === 'credentials' && renderCredentialsForm()}
        </ScrollView>

        {/* Back Button */}
        {step !== 'type' && (
          <View style={[styles.footer, { backgroundColor: colors.surface }]}>
            <Button
              title="← Back"
              onPress={() => {
                if (step === 'platform') setStep('type');
                else if (step === 'details') setStep('platform');
                else if (step === 'credentials') setStep('details');
              }}
              variant="ghost"
              fullWidth
            />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
  },
  stepContent: {
    paddingVertical: Spacing.lg,
  },
  stepTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
  },
  stepDescription: {
    fontSize: Typography.fontSize.base,
    marginBottom: Spacing.xl,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  optionsGrid: {
    gap: Spacing.md,
  },
  requirementsTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  requirementItem: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  footer: {
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.1)',
  },
});
