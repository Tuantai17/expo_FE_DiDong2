import { Image } from 'expo-image';
import React from 'react';
import { ImageSourcePropType, StyleSheet, View } from 'react-native';

type Props = {
  imgSource: ImageSourcePropType;
  selectedImage?: string;
  width?: number;
  height?: number;
};

// Default export size 320 × 440
const DEFAULT_W = 320;
const DEFAULT_H = 440;

export default function ImageViewer({
  imgSource,
  selectedImage,
  width = DEFAULT_W,
  height = DEFAULT_H,
}: Props) {
  const imageSource = selectedImage ? { uri: selectedImage } : imgSource;

  return (
    <View style={[styles.wrapper, { width, height }]}>
      <Image
        source={imageSource}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    borderRadius: 18,
    overflow: 'hidden',      // ⭐ Quan trọng để export không bị lệch góc
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});