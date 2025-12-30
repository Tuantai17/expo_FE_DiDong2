// app/index.tsx
/**
 * Entry Point - Root Index Screen
 * ================================
 * Checks authentication status and redirects accordingly:
 * - If authenticated: Go to main home screen
 * - If not authenticated: Go to onboarding
 */

import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5B9EE1" />
      </View>
    );
  }

  // If authenticated, go directly to main home
  if (isAuthenticated) {
    return <Redirect href="/(main)" />;
  }

  // If not authenticated, go to onboarding
  return <Redirect href="/onboarding/onboarding1" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});
