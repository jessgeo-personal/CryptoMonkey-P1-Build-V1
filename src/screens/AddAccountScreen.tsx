// FILE 3: src/screens/AddAccountScreen.tsx
// COMPLETE REPLACEMENT

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import type { MainTabScreenProps } from '../types/navigation';
import { Button, Input, Card } from '../components/common';
import { PlatformDropdown } from '../components/common/PlatformDropdown';
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
  Account,
} from '../types/account.types';

// ============================================
// ADD ACCOUNT SCREEN - COMPLETE FLOW
// ============================================

type Props = MainTabScreenProps<'AddAccount'>;
type Step = 'typeSelect' | 'platformSelect' | 'details' | 'credentials' | 'confirmation';

interface DraftList {
  cex: Account[];
  wallet: Account[];
}

export function AddAccountScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Props['navigation']>();

  // Flow state
  const [step, setStep] = useState<Step>('typeSelect');
  const [accountType, setAccountType] = useState<AccountType | undefined>(undefined);
  const [draftList, setDraftList] = useState<DraftList>({ cex: [], wallet: [] });
  const [userId, setUserId] = useState('');

  // Account state
  const [draftId, setDraftId] = useState<string | undefined>(undefined);
  const [platform, setPlatform] = useState<CexPlatform | WalletType | undefined>(undefined);
  const [accountName, setAccountName] = useState('');
  const [description, setDescription] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Initialize user
  useEffect(() => {
    const initUser = async () => {
      try {
        const userRepo = getUserRepository();
        const user = await userRepo.getOrCreateDefaultUser();
        setUserId(user.id);
      } catch (error) {
        console.error('Error initializing user:', error);
      }
    };
    initUser();
  }, []);

  // Load drafts when account type changes
  useEffect(() => {
    if (accountType && userId) {
      loadDrafts();
    }
  }, [accountType, userId]);

  // Load draft accounts
  const loadDrafts = async () => {
    if (!userId || !accountType) return;
    try {
      const cexDrafts = await AccountService.getDraftsByType(userId, 'cex');
      const walletDrafts = await AccountService.getDraftsByType(
        userId,
        accountType === 'wallet' ? 'wallet' : 'hardware_wallet'
      );
      setDraftList({
        cex: accountType === 'cex' ? cexDrafts : [],
        wallet: accountType === 'wallet' || accountType === 'hardware_wallet' ? walletDrafts : [],
      });
    } catch (error) {
      console.error('Error loading drafts:', error);
    }
  };

  // Step 1: Select Account Type
  const handleSelectAccountType = (type: AccountType) => {
    setAccountType(type);
    setStep('platformSelect');
  };

  // Step 2: Select Platform or Resume Draft
  const handleSelectPlatform = (selectedPlatform: CexPlatform | WalletType) => {
    setPlatform(selectedPlatform);
    setAccountName(''); // ✅ Clear the account name when platform is selected
    setStep('details');

    // Auto-fill if this is the first time selecting this platform
    if (!accountName) {
      const platformInfo =
        accountType === 'cex'
          ? CEX_PLATFORMS[selectedPlatform as CexPlatform]
          : WALLET_TYPES[selectedPlatform as WalletType];
      setAccountName(`My ${platformInfo.name} Account`);
    }

    setStep('details');
  };

  const handleResumeDraft = (draft: Account) => {
    setDraftId(draft.id);
    setPlatform(draft.platform as CexPlatform | WalletType);
    setAccountName(draft.accountName);
    setDescription(draft.description || '');
    setWalletAddress(draft.primaryAddress || '');
    setStep('details');
  };

  const handleDeleteDraft = async (draft: Account) => {
    Alert.alert(
      'Delete Draft',
      `Delete "${draft.accountName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await AccountService.deleteDraft(draft.id, userId);
              loadDrafts();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete draft');
            }
          },
        },
      ]
    );
  };

  // Step 3: Validate & Save Details
  const validateDetailsForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!accountName || accountName.length < ACCOUNT_VALIDATION.nameMinLength) {
      newErrors.accountName = 'Account name is required';
    }
    if (accountName.length > ACCOUNT_VALIDATION.nameMaxLength) {
      newErrors.accountName = `Name must be ${ACCOUNT_VALIDATION.nameMaxLength} characters or less`;
    }

    if (!platform) {
      newErrors.platform = 'Platform must be selected';
    }

    if (accountType === 'wallet' || accountType === 'hardware_wallet') {
      if (!walletAddress || walletAddress.length < ACCOUNT_VALIDATION.addressMinLength) {
        newErrors.walletAddress = 'Valid wallet address required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDetailsNext = async () => {
    if (!validateDetailsForm()) return;

    try {
      // Save or update draft
      if (draftId) {
        await AccountService.updateDraft(draftId, userId, {
          accountName,
          description: description || undefined,
          primaryAddress: walletAddress || undefined,
          platform,
        });
      } else {
        const draft = await AccountService.saveDraftAccount(userId, {
          accountType: accountType!,
          accountName,
          description: description || undefined,
          platform,
          primaryAddress: walletAddress || undefined,
          baseCurrency: 'USD',
        });
        setDraftId(draft.id);
      }

      // Skip credentials for wallet types
      if (accountType === 'wallet' || accountType === 'hardware_wallet') {
        await handleSaveAccount();
      } else {
        setStep('credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save account details');
      console.error('Error:', error);
    }
  };

  // Step 4: Add CEX Credentials
  const handleCredentialsNext = async () => {
    if (accountType === 'cex' && !apiKey) {
      setErrors({ apiKey: 'API Key is required for CEX accounts' });
      return;
    }
    setErrors({});
    setStep('confirmation');
  };

  // Step 5: Finalize Account
  const handleSaveAccount = async () => {
    setLoading(true);
    try {
      if (!draftId) throw new Error('No draft found');

      // Finalize draft to actual account
      const newAccount = await AccountService.finalizeDraft(draftId, userId);

      // Add credentials if CEX with API key
      if (accountType === 'cex' && apiKey) {
        await AccountService.addCredential(newAccount.id, userId, 'api_key', apiKey);
        if (apiSecret) {
          await AccountService.addCredential(
            newAccount.id,
            userId,
            'private_key',
            apiSecret
          );
        }
      }

      // Update connection status to connected if credentials added
      if (apiKey || walletAddress) {
        await AccountService.updateSyncStatus(
          newAccount.id,
          userId,
          'connected'
        );
      }

      Alert.alert(
        'Success',
        `${accountName} has been added successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset state
              setStep('typeSelect');
              setAccountType(undefined);      // ✅ Change from null
              setDraftId(undefined);           // ✅ Change from null
              setPlatform(undefined);          // ✅ Change from null
              setAccountName('');
              setDescription('');
              setWalletAddress('');
              setApiKey('');
              setApiSecret('');
              setErrors({});
              navigation.goBack();
            },
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

  // RENDER FUNCTIONS
  const renderTypeSelection = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Select Account Type
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Choose what you want to track
      </Text>

      <View style={styles.optionsGrid}>
        {[
          { key: 'cex' as AccountType, label: ACCOUNT_TYPE_LABELS.cex, icon: '📊' },
          { key: 'wallet' as AccountType, label: ACCOUNT_TYPE_LABELS.wallet, icon: '📱' },
          { key: 'hardware_wallet' as AccountType, label: ACCOUNT_TYPE_LABELS.hardware_wallet, icon: '🔐' },
        ].map((type) => (
          <Card key={type.key} noPadding style={{ marginBottom: Spacing.md }}>
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

  const getDraftsForCurrentType = (): Account[] => {
    if (!accountType) return [];
    return accountType === 'cex' ? draftList.cex : draftList.wallet;
  };

  const currentDrafts = getDraftsForCurrentType();

  const renderPlatformSelection = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Select {accountType === 'cex' ? 'Exchange' : 'Wallet'}
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Choose your {accountType === 'cex' ? 'exchange' : 'wallet'} platform
      </Text>

      {/* Previous/Draft Accounts */}
      {currentDrafts.length > 0 && (
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            In Progress
          </Text>
          {currentDrafts.map((draft) => (
            <Card key={draft.id} style={{ marginBottom: Spacing.md }}>
              <View style={styles.draftItem}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.draftName, { color: colors.text }]}>
                    {draft.accountName}
                  </Text>
                  {draft.platform && (
                    <Text style={[styles.draftPlatform, { color: colors.textSecondary }]}>
                      {accountType === 'cex'
                        ? CEX_PLATFORMS[draft.platform as CexPlatform]?.name
                        : WALLET_TYPES[draft.platform as WalletType]?.name}
                    </Text>
                  )}
                </View>
                <View style={styles.draftActions}>
                  <Button
                    title="Resume"
                    onPress={() => handleResumeDraft(draft)}
                    variant="secondary"
                    size="sm"
                    style={{ marginRight: Spacing.sm }}
                  />
                  <Button
                    title="Delete"
                    onPress={() => handleDeleteDraft(draft)}
                    variant="outline"
                    size="sm"
                  />
                </View>
              </View>
            </Card>
          ))}
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
            or start new
          </Text>
        </View>
      )}

      {/* Platform Selection Dropdown */}
      <PlatformDropdown
        type={accountType === 'cex' ? 'cex' : 'wallet'}
        value={platform}
        onChange={handleSelectPlatform}
        label="Select Platform"
      />

      {/* Back Button */}
      <Button
        title="← Back"
        onPress={() => {
          setAccountType(undefined);
          setStep('typeSelect');
        }}
        variant="ghost"
        fullWidth
        style={{ marginTop: Spacing.lg }}
      />
    </View>
  );

  const renderDetailsForm = () => {
  // Get platform info for display
  const getPlatformInfo = () => {
    if (!platform) return null;
    if (accountType === 'cex') {
      return CEX_PLATFORMS[platform as CexPlatform];
    }
    return WALLET_TYPES[platform as WalletType];
  };

  const platformInfo = getPlatformInfo();

  return (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Account Details
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Fill in your account information
      </Text>

      {/* ✅ NEW: Platform Display Card */}
      {platformInfo && (
        <Card style={{ marginBottom: Spacing.lg }}>
          <View style={styles.platformDisplay}>
            <Text style={styles.platformIcon}>{platformInfo.logo}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.platformLabel, { color: colors.textSecondary }]}>
                Selected Platform
              </Text>
              <Text style={[styles.platformName, { color: colors.text }]}>
                {platformInfo.name}
              </Text>
            </View>
            <Button
              title="Change"
              onPress={() => {
                setPlatform(undefined);
                setStep('platformSelect');
              }}
              variant="outline"
              size="sm"
            />
          </View>
        </Card>
      )}

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
        title={accountType === 'cex' ? 'Next' : 'Confirm & Save'}
        onPress={handleDetailsNext}
        loading={loading}
        disabled={loading}
        fullWidth
      />

      <Button
        title="← Back"
        onPress={() => {
          setPlatform(undefined);
          setStep('platformSelect');
        }}
        variant="ghost"
        fullWidth
        style={{ marginTop: Spacing.md }}
      />
    </View>
  );
};

  const renderCredentialsForm = () => {
    const requirements = platform
      ? CREDENTIAL_REQUIREMENTS[platform as keyof typeof CREDENTIAL_REQUIREMENTS] || []
      : [];

    return (
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>
          API Credentials (Optional)
        </Text>
        <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
          Add API credentials for automatic balance syncing
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
          title="Confirm & Save Account"
          onPress={handleCredentialsNext}
          loading={loading}
          disabled={loading}
          fullWidth
        />

        <Button
          title="← Back"
          onPress={() => setStep('details')}
          variant="ghost"
          fullWidth
          style={{ marginTop: Spacing.md }}
        />
      </View>
    );
  };

  const renderConfirmation = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Review & Save
      </Text>

      <Card style={{ marginBottom: Spacing.lg }}>
        <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>
          Account Type
        </Text>
        <Text style={[styles.reviewValue, { color: colors.text }]}>
          {accountType ? ACCOUNT_TYPE_LABELS[accountType] : 'N/A'}
        </Text>

        <Text style={[styles.reviewLabel, { color: colors.textSecondary, marginTop: Spacing.md }]}>
          Platform
        </Text>
        <Text style={[styles.reviewValue, { color: colors.text }]}>
          {platform || 'N/A'}
        </Text>

        <Text style={[styles.reviewLabel, { color: colors.textSecondary, marginTop: Spacing.md }]}>
          Account Name
        </Text>
        <Text style={[styles.reviewValue, { color: colors.text }]}>
          {accountName}
        </Text>
      </Card>

      <Button
        title="Save Account"
        onPress={handleSaveAccount}
        loading={loading}
        disabled={loading}
        fullWidth
      />

      <Button
        title="← Back"
        onPress={() => setStep(accountType === 'cex' ? 'credentials' : 'details')}
        variant="ghost"
        fullWidth
        style={{ marginTop: Spacing.md }}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Progress Indicator */}
        <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
          {(['typeSelect', 'platformSelect', 'details', 'credentials', 'confirmation'] as Step[]).map(
            (s, idx) => (
              <View
                key={s}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor:
                      ['typeSelect', 'platformSelect', 'details', 'credentials', 'confirmation'].indexOf(
                        step
                      ) >= idx
                        ? colors.primary
                        : colors.border,
                  },
                ]}
              />
            )
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'typeSelect' && renderTypeSelection()}
          {step === 'platformSelect' && renderPlatformSelection()}
          {step === 'details' && renderDetailsForm()}
          {step === 'credentials' && renderCredentialsForm()}
          {step === 'confirmation' && renderConfirmation()}
        </ScrollView>
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
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  optionsGrid: {
    gap: Spacing.md,
  },
  draftItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  draftName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  draftPlatform: {
    fontSize: Typography.fontSize.sm,
  },
  draftActions: {
    flexDirection: 'row',
  },
  dividerText: {
    textAlign: 'center',
    fontSize: Typography.fontSize.sm,
    marginVertical: Spacing.lg,
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
  reviewLabel: {
    fontSize: Typography.fontSize.sm,
  },
  reviewValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginTop: Spacing.xs,
  },
  platformDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  platformIcon: {
    fontSize: 32,
  },
  platformLabel: {
    fontSize: Typography.fontSize.xs,
    marginBottom: Spacing.xs,
  },
  platformName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
});
