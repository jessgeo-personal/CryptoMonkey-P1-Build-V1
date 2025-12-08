// FILE: src/services/HoldingService.ts
// ADD this method to the HoldingService class (if not exists)

/**
 * Get holdings for a specific account
 */
static async getHoldingsByAccount(
  userId: string,
  accountId: string
): Promise<Holding[]> {
  try {
    const allHoldings = await this.getAllHoldings(userId);
    return allHoldings.filter(h => h.accountId === accountId);
  } catch (error) {
    console.error('Error getting holdings by account:', error);
    return [];
  }
}
