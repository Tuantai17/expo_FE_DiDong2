/**
 * useImagePicker Hook
 * Hook xử lý việc chọn ảnh và upload
 */

import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert } from 'react-native';

export interface ImagePickerResult {
  uri: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export function useImagePicker() {
  const [isPickingImage, setIsPickingImage] = useState(false);

  /**
   * Request permissions
   */
  const requestPermissions = async (type: 'camera' | 'gallery'): Promise<boolean> => {
    try {
      if (type === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Quyền truy cập',
            'Vui lòng cấp quyền truy cập camera để tiếp tục'
          );
          return false;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Quyền truy cập',
            'Vui lòng cấp quyền truy cập thư viện ảnh để tiếp tục'
          );
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('[ImagePicker] Permission error:', error);
      return false;
    }
  };

  /**
   * Pick image from gallery
   */
  const pickFromGallery = async (): Promise<ImagePickerResult | null> => {
    try {
      setIsPickingImage(true);

      // Check permission
      const hasPermission = await requestPermissions('gallery');
      if (!hasPermission) {
        return null;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8, // Compress to reduce file size
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      const uri = asset.uri;
      const fileName = uri.split('/').pop() || 'image.jpg';
      const fileSize = asset.fileSize || 0;
      
      // Detect MIME type from file extension
      const extension = fileName.split('.').pop()?.toLowerCase();
      let mimeType = 'image/jpeg';
      if (extension === 'png') mimeType = 'image/png';
      else if (extension === 'webp') mimeType = 'image/webp';

      // Validate file size (max 5MB)
      if (fileSize > 5 * 1024 * 1024) {
        Alert.alert(
          'Ảnh quá lớn',
          'Vui lòng chọn ảnh có kích thước nhỏ hơn 5MB'
        );
        return null;
      }

      console.log('[ImagePicker] Selected from gallery:', {
        uri,
        fileName,
        fileSize: `${(fileSize / 1024).toFixed(2)} KB`,
        mimeType,
      });

      return { uri, fileName, fileSize, mimeType };
    } catch (error) {
      console.error('[ImagePicker] Gallery error:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
      return null;
    } finally {
      setIsPickingImage(false);
    }
  };

  /**
   * Take photo from camera
   */
  const takePhoto = async (): Promise<ImagePickerResult | null> => {
    try {
      setIsPickingImage(true);

      // Check permission
      const hasPermission = await requestPermissions('camera');
      if (!hasPermission) {
        return null;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      const uri = asset.uri;
      const fileName = uri.split('/').pop() || 'photo.jpg';
      const fileSize = asset.fileSize || 0;
      const mimeType = 'image/jpeg'; // Camera always returns JPEG

      if (fileSize > 5 * 1024 * 1024) {
        Alert.alert(
          'Ảnh quá lớn',
          'Vui lòng chụp lại với chất lượng thấp hơn'
        );
        return null;
      }

      console.log('[ImagePicker] Taken from camera:', {
        uri,
        fileName,
        fileSize: `${(fileSize / 1024).toFixed(2)} KB`,
        mimeType,
      });

      return { uri, fileName, fileSize, mimeType };
    } catch (error) {
      console.error('[ImagePicker] Camera error:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
      return null;
    } finally {
      setIsPickingImage(false);
    }
  };

  /**
   * Show option to pick from gallery or take photo
   */
  const showImageOptions = (): Promise<ImagePickerResult | null> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Chọn ảnh',
        'Bạn muốn lấy ảnh từ đâu?',
        [
          {
            text: 'Thư viện',
            onPress: async () => {
              const result = await pickFromGallery();
              resolve(result);
            },
          },
          {
            text: 'Chụp ảnh',
            onPress: async () => {
              const result = await takePhoto();
              resolve(result);
            },
          },
          {
            text: 'Hủy',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ],
        { cancelable: true, onDismiss: () => resolve(null) }
      );
    });
  };

  return {
    isPickingImage,
    pickFromGallery,
    takePhoto,
    showImageOptions,
  };
}
