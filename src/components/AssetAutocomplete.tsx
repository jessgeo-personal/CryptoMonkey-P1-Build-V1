import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

interface AssetOption {
  symbol: string;
  name: string;
  id: string;
}

interface AssetAutocompleteProps {
  value: string;
  onSelect: (asset: string) => void;
  label: string;
  required?: boolean;
  placeholder?: string;
}

export const AssetAutocomplete: React.FC<AssetAutocompleteProps> = ({
  value,
  onSelect,
  label,
  required = false,
  placeholder = 'Search asset...',
}) => {
  const [searchText, setSearchText] = useState(value);
  const [options, setOptions] = useState<AssetOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText.length > 0) {
        searchAssets(searchText);
      } else {
        setOptions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  const searchAssets = async (query: string) => {
    setLoading(true);
    try {
      // Search CoinGecko API
      const response = await fetch(
        `https://api.coingecko.com/api/v3/search?query=${query}`
      );

      if (!response.ok) {
        throw new Error('Failed to search assets');
      }

      const data = await response.json();

      // Map results to our format
      const results: AssetOption[] = data.coins
        .slice(0, 10)
        .map((coin: any) => ({
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          id: coin.id,
        }));

      setOptions(results);
      setShowDropdown(true);
    } catch (error) {
      console.error('Asset search error:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAsset = (symbol: string) => {
    setSearchText(symbol);
    onSelect(symbol);
    setShowDropdown(false);
    setOptions([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
          onFocus={() => {
            if (searchText.length > 0) {
              setShowDropdown(true);
            }
          }}
        />
        {loading && <ActivityIndicator color="#2196F3" size="small" />}
      </View>

      {showDropdown && options.length > 0 && (
        <ScrollView
          style={styles.dropdown}
          nestedScrollEnabled={true}
          scrollEnabled={options.length > 5}
        >
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.dropdownItem}
              onPress={() => handleSelectAsset(option.symbol)}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionSymbol}>{option.symbol}</Text>
                <Text style={styles.optionName}>{option.name}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {showDropdown && options.length === 0 && searchText.length > 0 && !loading && (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>No assets found</Text>
          <Text style={styles.noResultsHint}>
            Or press Enter to use "{searchText.toUpperCase()}"
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  dropdown: {
    position: 'absolute',
    top: 65,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionSymbol: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  optionName: {
    fontSize: 12,
    color: '#666',
  },
  noResults: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  noResultsHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
});
