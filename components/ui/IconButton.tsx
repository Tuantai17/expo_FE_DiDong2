import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: (event: GestureResponderEvent) => void;
};

export default function IconButton({ icon, label, onPress }: Props) {
  return (
    <View style={styles.iconButton}>
      <Pressable style={styles.iconButtonPressable} onPress={onPress} android_ripple={{ color: '#333' }}>
        <MaterialIcons name={icon} size={24} color="#fff" />
        <Text style={styles.iconButtonLabel}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 24,
  },
  iconButtonPressable: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonLabel: {
    color: '#fff',
    marginTop: 12,
    fontSize: 12,
  },
});
