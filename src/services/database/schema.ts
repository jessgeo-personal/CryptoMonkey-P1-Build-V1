// ============================================
// DATABASE SCHEMA - CryptoMonkey Phase 1
// SQLite Schema with Migrations Support
// ============================================

export const SCHEMA_VERSION = 2;

export const CREATE_TABLES_SQL = `
-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  base_currency TEXT NOT NULL DEFAULT 'USD',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  settings TEXT NOT NULL,
  CONSTRAINT valid_currency CHECK (base_currency IN ('USD', 'GBP', 'EUR', 'INR', 'AED', 'SGD', 'HKD', 'CNY'))
);

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  
  -- Source tracking
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  
  -- Classification
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  
  -- Asset flow
  from_asset TEXT,
  from_quantity REAL,
  from_location TEXT,
  to_asset TEXT,
  to_quantity REAL,
  to_location TEXT,
  
  -- Multi-currency tracking
  original_fiat_currency TEXT NOT NULL,
  original_fiat_value REAL,
  
  -- Fees (stored as JSON)
  fees TEXT NOT NULL,
  
  -- Source data
  raw_data TEXT,
  parsing_notes TEXT,
  
  -- Metadata
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT valid_source CHECK (source IN ('CEX', 'WALLET', 'DEX', 'DEFI')),
  CONSTRAINT valid_type CHECK (type IN ('buy', 'sell', 'swap', 'transfer', 'deposit', 'withdrawal', 'liquidity_add', 'liquidity_remove', 'stake', 'unstake'))
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_timestamp ON transactions(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_source ON transactions(user_id, source, source_id);
CREATE INDEX IF NOT EXISTS idx_transactions_asset ON transactions(user_id, from_asset);
CREATE INDEX IF NOT EXISTS idx_transactions_asset_to ON transactions(user_id, to_asset);

-- ============================================
-- HOLDINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS holdings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  
  -- Asset identification
  asset TEXT NOT NULL,
  quantity REAL NOT NULL,
  
  -- Location
  location TEXT NOT NULL,
  location_id TEXT NOT NULL,
  network TEXT,
  
  -- Cost basis (stored as JSON - multi-currency)
  cost_basis_data TEXT NOT NULL,
  
  -- Metadata
  last_updated INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_holding UNIQUE (user_id, asset, location_id, network)
);

CREATE INDEX IF NOT EXISTS idx_holdings_user_asset ON holdings(user_id, asset);
CREATE INDEX IF NOT EXISTS idx_holdings_location ON holdings(user_id, location, location_id);

-- ============================================
-- LIQUIDITY POOL POSITIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS liquidity_pool_positions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  
  -- Pool identification
  protocol TEXT NOT NULL,
  pool_address TEXT NOT NULL,
  network TEXT NOT NULL,
  token_pair TEXT NOT NULL,
  
  -- Position details
  position_nft TEXT,
  liquidity_amount REAL NOT NULL,
  price_range TEXT NOT NULL,
  
  -- Asset composition
  deposited_assets TEXT NOT NULL,
  current_assets TEXT NOT NULL,
  
  -- Earnings
  fees_earned TEXT NOT NULL,
  
  -- Cost basis
  cost_basis TEXT NOT NULL,
  
  -- Performance
  performance_metrics TEXT NOT NULL,
  
  -- Range history
  range_history TEXT NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active',
  
  -- Metadata
  last_synced INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT valid_status CHECK (status IN ('active', 'closed'))
);

CREATE INDEX IF NOT EXISTS idx_lp_positions_user_status ON liquidity_pool_positions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_lp_positions_protocol ON liquidity_pool_positions(user_id, protocol, network);

-- ============================================
-- NFT HOLDINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS nft_holdings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  
  -- NFT identification
  contract_address TEXT NOT NULL,
  token_id TEXT NOT NULL,
  network TEXT NOT NULL,
  
  -- Metadata
  collection_name TEXT,
  token_name TEXT,
  image_url TEXT,
  
  -- Valuation
  last_sale_price REAL,
  last_sale_currency TEXT,
  last_sale_date INTEGER,
  
  -- Location
  wallet_address TEXT NOT NULL,
  
  -- Metadata
  acquired_at INTEGER,
  last_updated INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_nft UNIQUE (contract_address, token_id, wallet_address)
);

CREATE INDEX IF NOT EXISTS idx_nft_holdings_user ON nft_holdings(user_id, network);

-- ============================================
-- EXCHANGE RATES CACHE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS exchange_rates (
  id TEXT PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate REAL NOT NULL,
  date INTEGER NOT NULL,
  source TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  
  CONSTRAINT unique_rate UNIQUE (from_currency, to_currency, date)
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(from_currency, to_currency, date DESC);

-- ============================================
-- TOKENS REGISTRY TABLE (NEW - Phase 4B)
-- ============================================
CREATE TABLE IF NOT EXISTS tokens (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  network TEXT NOT NULL,
  contract_address TEXT,
  decimals INTEGER NOT NULL DEFAULT 18,
  category TEXT NOT NULL DEFAULT 'cryptocurrency',
  is_stablecoin INTEGER NOT NULL DEFAULT 0,
  is_primary INTEGER NOT NULL DEFAULT 0,
  logo_url TEXT,
  color TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_custom INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  
  CONSTRAINT valid_category CHECK (
    category IN ('cryptocurrency', 'stablecoin', 'nft', 'defi', 'utility', 'custom')
  ),
  CONSTRAINT unique_token UNIQUE (symbol, network, contract_address)
);

CREATE INDEX IF NOT EXISTS idx_tokens_symbol ON tokens(symbol);
CREATE INDEX IF NOT EXISTS idx_tokens_network ON tokens(network);
CREATE INDEX IF NOT EXISTS idx_tokens_active ON tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_tokens_symbol_network ON tokens(symbol, network);

-- ============================================
-- ACCOUNT TOKENS TABLE (NEW - Phase 4B)
-- Links tokens to accounts for tracking
-- ============================================
CREATE TABLE IF NOT EXISTS account_tokens (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  token_id TEXT NOT NULL,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  custom_label TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE,
  CONSTRAINT unique_account_token UNIQUE (account_id, token_id)
);

CREATE INDEX IF NOT EXISTS idx_account_tokens_account ON account_tokens(account_id);
CREATE INDEX IF NOT EXISTS idx_account_tokens_token ON account_tokens(token_id);
CREATE INDEX IF NOT EXISTS idx_account_tokens_enabled ON account_tokens(account_id, is_enabled);

-- ============================================
-- SCHEMA VERSION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS schema_version (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  version INTEGER NOT NULL,
  applied_at INTEGER NOT NULL
);

INSERT OR IGNORE INTO schema_version (id, version, applied_at) VALUES (1, ${SCHEMA_VERSION}, ${Date.now()});
`;

export const DROP_TABLES_SQL = `
DROP TABLE IF EXISTS account_tokens;
DROP TABLE IF EXISTS tokens;
DROP TABLE IF EXISTS exchange_rates;
DROP TABLE IF EXISTS nft_holdings;
DROP TABLE IF EXISTS liquidity_pool_positions;
DROP TABLE IF EXISTS holdings;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS schema_version;
`;
