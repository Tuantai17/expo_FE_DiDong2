// components/SearchBar.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface SearchBarProps {
  initialValue?: string;
  onSearch?: (keyword: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function SearchBar({
  initialValue = "",
  onSearch,
  placeholder = "Looking for shoes",
  autoFocus = false,
}: SearchBarProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(initialValue);

  const handleSearch = () => {
    const trimmedKeyword = keyword.trim();
    if (onSearch) {
      onSearch(trimmedKeyword);
    } else if (trimmedKeyword) {
      // Mặc định điều hướng đến trang products với keyword search
      router.push({
        pathname: "/(main)/products",
        params: { search: trimmedKeyword },
      });
    }
  };

  const handleClear = () => {
    setKeyword("");
    if (onSearch) {
      onSearch("");
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Icon */}
      <TouchableOpacity onPress={handleSearch} style={styles.searchIconBtn}>
        <Ionicons name="search" size={20} color="#5B9EE1" />
      </TouchableOpacity>

      {/* Input */}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={keyword}
        onChangeText={setKeyword}
        onSubmitEditing={handleSearch}
        returnKeyType="search"
        autoFocus={autoFocus}
      />

      {/* Clear Button */}
      {keyword.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
          <Ionicons name="close-circle" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      )}

      {/* Search Button */}
      <TouchableOpacity onPress={handleSearch} style={styles.searchBtn}>
        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#5B9EE1",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchIconBtn: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    paddingVertical: 2,
  },
  clearBtn: {
    marginRight: 8,
    padding: 4,
  },
  searchBtn: {
    backgroundColor: "#5B9EE1",
    borderRadius: 10,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
