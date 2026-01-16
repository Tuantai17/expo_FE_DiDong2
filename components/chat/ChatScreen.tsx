/**
 * Chat Screen
 * ============
 * Màn hình chat với Admin hoặc AI
 * - Hiển thị tin nhắn realtime
 * - Phân biệt tin nhắn User, Admin, AI
 * - Hiển thị product cards với hình ảnh từ AI responses
 * - Auto-refresh messages
 * - Add to cart from product suggestions
 */


import { API_BASE_URL } from '@/config/api.config';
import { useCart } from '@/context/CartContext';
import chatService, { ChatMessage, ChatSession, ProductSuggestion } from '@/services/chatService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// ========== IMAGE UPLOAD IMPORTS ==========
import { useImagePicker } from '../../hooks/useImagePicker';
import type { ImageSearchResultMessage } from '../../types/chatImage';
import ImageSearchResultBubble from './ImageSearchResultBubble';

// Product Card Component for AI suggestions
interface ProductCardProps {
  product: ProductSuggestion;
  onPress: (productId: number) => void;
  onAddToCart: (product: ProductSuggestion) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, onAddToCart }) => {
  const [isAdding, setIsAdding] = useState(false);
  
  const formatPrice = (price: number) => {
    if (!price || price === 0) return '0 ₫';
    return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
  };

  // Validate and check discount
  const hasDiscount = product.priceRoot && product.priceRoot > 0 && product.priceRoot > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.priceRoot! - product.price) / product.priceRoot!) * 100)
    : 0;

  // Create full image URL
  const getImageUrl = () => {
    if (!product.photo) return null;
    // If already a full URL, return as is
    if (product.photo.startsWith('http')) return product.photo;
    // Ensure proper slash between base URL and path
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const photoPath = product.photo.startsWith('/') ? product.photo : '/' + product.photo;
    return `${baseUrl}${photoPath}`;
  };

  const imageUrl = getImageUrl();
  
  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await onAddToCart(product);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <View style={styles.productCard}>
      <TouchableOpacity 
        onPress={() => onPress(product.id)}
        activeOpacity={0.8}
      >
        <View style={styles.productImageContainer}>
          {imageUrl ? (
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.productImage}
              resizeMode="cover"
              onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons name="image-outline" size={24} color="#ccc" />
            </View>
          )}
          {hasDiscount && discountPercent > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discountPercent}%</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
          {product.brand && product.brand.length > 0 && (
            <Text style={styles.productBrand}>{product.brand}</Text>
          )}
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
            {hasDiscount && (
              <Text style={styles.productPriceOriginal}>{formatPrice(product.priceRoot!)}</Text>
            )}
          </View>
          {product.avgRating !== undefined && product.avgRating > 0 && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FFB800" />
              <Text style={styles.ratingText}>{product.avgRating.toFixed(1)}</Text>
              {product.reviewCount !== undefined && product.reviewCount > 0 && (
                <Text style={styles.reviewCount}>({product.reviewCount})</Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
      
      {/* Add to Cart Button */}
      <TouchableOpacity 
        style={styles.addToCartButton}
        onPress={handleAddToCart}
        disabled={isAdding}
        activeOpacity={0.7}
      >
        {isAdding ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="cart-outline" size={14} color="#fff" />
            <Text style={styles.addToCartText}>Thêm</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

// Product Suggestions List Component
interface ProductSuggestionsProps {
  products: ProductSuggestion[];
  onProductPress: (productId: number) => void;
  onAddToCart: (product: ProductSuggestion) => void;
}

const ProductSuggestions: React.FC<ProductSuggestionsProps> = ({ products, onProductPress, onAddToCart }) => {
  if (!products || products.length === 0) return null;

  return (
    <View style={styles.suggestionsContainer}>
      <Text style={styles.suggestionsTitle}>📦 Sản phẩm gợi ý:</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.suggestionsScroll}
      >
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onPress={onProductPress}
            onAddToCart={onAddToCart}
          />
        ))}
      </ScrollView>
    </View>
  );
};

// Message Bubble Component
interface ChatBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  onProductPress: (productId: number) => void;
  onAddToCart: (product: ProductSuggestion) => void;
  onViewCart: () => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isOwn, onProductPress, onAddToCart, onViewCart }) => {
  const isAI = message.senderType === 'AI';
  const isAdmin = message.senderType === 'ADMIN';
  const hasProducts = isAI && message.products && message.products.length > 0;
  const hasAddToCartAction = isAI && message.action?.type === 'ADD_TO_CART';

  const getBubbleStyle = () => {
    if (isOwn) return styles.ownBubble;
    if (isAI) {
      // Special style for successful add-to-cart messages
      if (hasAddToCartAction) return styles.successBubble;
      return styles.aiBubble;
    }
    return styles.adminBubble;
  };

  const getTextStyle = () => {
    if (isOwn) return styles.ownText;
    return styles.otherText;
  };

  return (
    <View style={[styles.bubbleContainer, isOwn ? styles.ownContainer : styles.otherContainer]}>
      {!isOwn && (
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, isAI ? (hasAddToCartAction ? styles.successAvatar : styles.aiAvatar) : styles.adminAvatar]}>
            <Ionicons
              name={isAI ? (hasAddToCartAction ? 'checkmark-circle' : 'sparkles') : 'person'}
              size={16}
              color="#fff"
            />
          </View>
        </View>
      )}
      
      <View style={styles.bubbleContent}>
        {!isOwn && (
          <Text style={styles.senderName}>
            {isAI ? (hasAddToCartAction ? '✅ Thành công' : '🤖 AI Assistant') : message.senderName || 'Admin'}
          </Text>
        )}
        
        <View style={getBubbleStyle()}>
          <Text style={getTextStyle()}>{message.content}</Text>
          <Text style={[styles.timeText, isOwn && styles.ownTimeText]}>
            {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Quick Actions for ADD_TO_CART success */}
        {hasAddToCartAction && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.viewCartButton}
              onPress={onViewCart}
              activeOpacity={0.8}
            >
              <Ionicons name="cart" size={16} color="#fff" />
              <Text style={styles.viewCartButtonText}>Xem giỏ hàng</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Product Suggestions with Images */}
        {hasProducts && (
          <ProductSuggestions 
            products={message.products!} 
            onProductPress={onProductPress}
            onAddToCart={onAddToCart}
          />
        )}
      </View>
    </View>
  );
};

// Typing Indicator Component
const TypingIndicator: React.FC = () => (
  <View style={styles.typingContainer}>
    <View style={styles.typingDots}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.typingDot, { animationDelay: `${i * 0.2}s` }]} />
      ))}
    </View>
    <Text style={styles.typingText}>AI đang soạn tin...</Text>
  </View>
);

// Main Chat Screen
const ChatScreen: React.FC = () => {
  const router = useRouter();
  const { addToCart, refreshCart } = useCart();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isWaitingAI, setIsWaitingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const refreshInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ========== IMAGE UPLOAD STATES ==========
  const { showImageOptions } = useImagePicker();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageResults, setImageResults] = useState<ImageSearchResultMessage[]>([]);
  
  // ========== IMAGE WITH TEXT STATES (ChatGPT-style) ==========
  const [selectedImage, setSelectedImage] = useState<{
    uri: string;
    file?: File;
    mimeType: string;
  } | null>(null);

  // Initialize chat
  useEffect(() => {
    initializeChat();
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, []);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check login
      const isLoggedIn = await chatService.isLoggedIn();
      if (!isLoggedIn) {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để sử dụng chat', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        return;
      }

      // Get or create session
      const chatSession = await chatService.createOrGetSession();
      setSession(chatSession);

      // Load messages
      await loadMessages(chatSession.id);

      // Mark as read
      chatService.markAsRead(chatSession.id);

      // Start auto-refresh
      startAutoRefresh(chatSession.id);

    } catch (err: any) {
      console.error('Failed to initialize chat:', err);
      setError(err.message || 'Không thể kết nối chat. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (sessionId: number) => {
    try {
      const msgs = await chatService.getMessages(sessionId);
      
      // Check for ADD_TO_CART actions and refresh cart if found
      const hasAddToCartAction = msgs.some(m => 
        m.senderType === 'AI' && m.action?.type === 'ADD_TO_CART'
      );
      if (hasAddToCartAction) {
        console.log('[Chat] Detected ADD_TO_CART action, refreshing cart...');
        refreshCart();
      }
      
      setMessages(msgs);
      
      // Check if waiting for AI response
      if (msgs.length > 0) {
        const lastMsg = msgs[msgs.length - 1];
        // Only show waiting if last message was from USER and we're expecting AI
        if (lastMsg.senderType === 'USER') {
          // Check if AI has already responded after this message
          const userMsgTime = new Date(lastMsg.createdAt).getTime();
          const hasAIResponse = msgs.some(m => 
            (m.senderType === 'AI' || m.senderName?.includes('AI')) && 
            new Date(m.createdAt).getTime() > userMsgTime
          );
          
          if (!hasAIResponse) {
            setIsWaitingAI(true);
          } else {
            setIsWaitingAI(false);
          }
        } else {
          setIsWaitingAI(false);
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const startAutoRefresh = (sessionId: number) => {
    // Refresh every 2 seconds
    refreshInterval.current = setInterval(() => {
      loadMessages(sessionId);
    }, 2000);
  };

  const onRefresh = useCallback(async () => {
    if (!session) return;
    setRefreshing(true);
    await loadMessages(session.id);
    setRefreshing(false);
  }, [session]);

  const sendMessage = async () => {
    if (!inputText.trim() || !session || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);
    setIsWaitingAI(true);

    // Optimistic update - add message locally first
    const tempMessage: ChatMessage = {
      id: Date.now(),
      sessionId: session.id,
      senderType: 'USER',
      senderId: null,
      senderName: 'Bạn',
      content: text,
      createdAt: new Date().toISOString(),
      metadata: null,
      isRead: true,
    };
    setMessages(prev => [...prev, tempMessage]);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      await chatService.sendMessage(session.id, text);
      // Refresh to get actual message with AI response
      await loadMessages(session.id);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại.');
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleProductPress = (productId: number) => {
    // Navigate to product detail
    router.push(`/product/productDetail?id=${productId}` as any);
  };
  
  const handleAddToCart = async (product: ProductSuggestion) => {
    try {
      // Create image URL
      let imageUrl = '';
      if (product.photo) {
        if (product.photo.startsWith('http')) {
          imageUrl = product.photo;
        } else {
          const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
          const photoPath = product.photo.startsWith('/') ? product.photo : '/' + product.photo;
          imageUrl = `${baseUrl}${photoPath}`;
        }
      }
      
      await addToCart({
        id: String(product.id),
        productId: product.id,
        name: product.name,
        price: product.price,
        image: imageUrl,
        size: '40', // Default size
      });
      
      Alert.alert(
        '✅ Thành công',
        `Đã thêm "${product.name}" vào giỏ hàng!`,
        [
          { text: 'Tiếp tục chat', style: 'cancel' },
          { text: 'Xem giỏ hàng', onPress: () => router.push('/(main)/cart') }
        ]
      );
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể thêm vào giỏ hàng. Vui lòng thử lại.');
      console.error('Add to cart error:', error);
    }
  };

  const handleViewCart = () => {
    router.push('/(main)/cart');
  };

  // ========== IMAGE SELECTION HANDLER (ChatGPT-style: select first, ask later) ==========
  const handleSelectImage = async () => {
    if (!session || uploadingImage) return;

    try {
      console.log('[Chat] User selecting image...');
      
      // WEB PLATFORM: Use HTML input file
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/webp';
        
        input.onchange = async (e: any) => {
          const file = e.target.files?.[0];
          if (!file) {
            console.log('[Chat] No file selected');
            return;
          }

          // Validate file size (5MB)
          if (file.size > 5 * 1024 * 1024) {
            Alert.alert('Ảnh quá lớn', 'Vui lòng chọn ảnh nhỏ hơn 5MB');
            return;
          }

          // Validate file type
          if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            Alert.alert('Định dạng không hợp lệ', 'Chỉ chấp nhận JPEG, PNG, WEBP');
            return;
          }

          // Create preview URL for web
          const previewUrl = URL.createObjectURL(file);
          console.log('[Chat] Image selected:', file.name);
          
          // Store selected image for preview (will upload when user sends)
          setSelectedImage({
            uri: previewUrl,
            file: file,
            mimeType: file.type,
          });
        };

        input.click();
        return;
      }

      // MOBILE PLATFORM: Use expo-image-picker
      const imageResult = await showImageOptions();
      if (!imageResult) {
        console.log('[Chat] User cancelled image selection');
        return;
      }

      console.log('[Chat] Image selected:', imageResult.uri);
      
      // Store selected image for preview
      setSelectedImage({
        uri: imageResult.uri,
        mimeType: 'image/jpeg',
      });

    } catch (error: any) {
      console.error('[Chat] Image selection error:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  // Clear selected image
  const clearSelectedImage = () => {
    if (selectedImage?.uri && Platform.OS === 'web') {
      URL.revokeObjectURL(selectedImage.uri);
    }
    setSelectedImage(null);
  };

  // ========== SEND MESSAGE WITH IMAGE ==========
  const sendMessageWithImage = async () => {
    if (!session || isSending) return;
    
    // Must have image or text
    if (!selectedImage && !inputText.trim()) return;

    const text = inputText.trim();
    const imageToUpload = selectedImage;
    
    // Clear input immediately
    setInputText('');
    clearSelectedImage();
    setIsSending(true);
    setIsWaitingAI(true);

    try {
      // If we have an image, upload it with the question
      if (imageToUpload) {
        console.log('[Chat] Sending image with message:', text);
        setUploadingImage(true);
        
        const formData = new FormData();
        formData.append('sessionId', session.id.toString());
        formData.append('senderType', 'USER');
        
        // Add the question/message if provided
        if (text) {
          formData.append('message', text);
        }
        
        // Add the image
        if (Platform.OS === 'web' && imageToUpload.file) {
          formData.append('image', imageToUpload.file);
        } else {
          // Mobile: need to create blob from URI
          const response = await fetch(imageToUpload.uri);
          const blob = await response.blob();
          formData.append('image', blob, 'image.jpg');
        }

        // Upload image with question
        const uploadResponse = await fetch('http://localhost:8080/api/chat-images/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Upload failed: ' + uploadResponse.statusText);
        }

        const result = await uploadResponse.json();
        console.log('[Chat] Upload successful, got', result.suggestedProducts?.length || 0, 'products');

        // Add result to imageResults  
        const resultMessage: ImageSearchResultMessage = {
          id: `img_${Date.now()}`,
          type: 'IMAGE_SEARCH_RESULT',
          timestamp: Date.now(),
          sender: 'ASSISTANT',
          result: result,
        };

        setImageResults(prev => [...prev, resultMessage]);
        setUploadingImage(false);
        
      } else {
        // Text only - use normal message sending
        await chatService.sendMessage(session.id, text);
      }
      
      // Refresh messages
      await loadMessages(session.id);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 300);

    } catch (error: any) {
      console.error('[Chat] Send error:', error);
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại.');
      // Restore input on error
      setInputText(text);
      if (imageToUpload) {
        setSelectedImage(imageToUpload);
      }
    } finally {
      setIsSending(false);
      setUploadingImage(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    // Check if this is an image result message
    const imageResult = imageResults.find(ir => ir.timestamp === item.id);
    
    if (imageResult && imageResult.type === 'IMAGE_SEARCH_RESULT') {
      return (
        <ImageSearchResultBubble
          result={imageResult.result}
          userId={session?.userId || 0}
          onCartUpdate={() => refreshCart()}
        />
      );
    }
    
    // Regular chat message
    const isOwn = item.senderType === 'USER';
    return (
      <ChatBubble 
        message={item} 
        isOwn={isOwn} 
        onProductPress={handleProductPress}
        onAddToCart={handleAddToCart}
        onViewCart={handleViewCart}
      />
    );
  };

  const getStatusText = () => {
    if (!session) return '';
    if (session.status === 'ASSIGNED' && session.assignedAdminName) {
      return `Đang chat với ${session.assignedAdminName}`;
    }
    return 'Trợ lý AI sẵn sàng hỗ trợ bạn';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Đang kết nối...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={initializeChat}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#FF6B00', '#FF8534']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Hỗ trợ trực tuyến</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Welcome message */}
      {messages.length === 0 && (
        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeIcon}>
            <Ionicons name="chatbubbles" size={48} color="#FF6B00" />
          </View>
          <Text style={styles.welcomeTitle}>Xin chào! 👋</Text>
          <Text style={styles.welcomeText}>
            Tôi là trợ lý AI của Shop Giày. Hãy hỏi tôi bất cứ điều gì về sản phẩm, 
            đơn hàng hoặc chính sách của chúng tôi nhé!
          </Text>
          
          {/* Quick suggestions */}
          <View style={styles.quickSuggestions}>
            <Text style={styles.quickSuggestionsTitle}>Gợi ý câu hỏi:</Text>
            {[
              'Có giày Nike nào đang giảm giá?',
              'Chính sách đổi trả như thế nào?',
              'Giày nào phù hợp cho chạy bộ?',
            ].map((suggestion, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.suggestionChip}
                onPress={() => {
                  setInputText(suggestion);
                }}
              >
                <Text style={styles.suggestionChipText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B00']} />
        }
        ListFooterComponent={
          <>
            {/* Image Search Results */}
            {imageResults.length > 0 && imageResults.map((imgResult) => (
              <ImageSearchResultBubble
                key={imgResult.id}
                result={imgResult.result}
                userId={session?.userId || 0}
                onCartUpdate={() => refreshCart()}
              />
            ))}
            {/* Typing Indicator */}
            {isWaitingAI && <TypingIndicator />}
          </>
        }
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Selected Image Preview (ChatGPT-style) */}
        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <View style={styles.imagePreviewWrapper}>
              <Image 
                source={{ uri: selectedImage.uri }} 
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={clearSelectedImage}
              >
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <View style={styles.inputContainer}>
          {/* Image Select Button */}
          <TouchableOpacity
            style={styles.imageButton}
            onPress={handleSelectImage}
            disabled={uploadingImage || isSending}
          >
            {uploadingImage ? (
              <ActivityIndicator size="small" color="#5B9EE1" />
            ) : (
              <Ionicons name="attach" size={24} color="#5B9EE1" />
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={selectedImage ? "Hỏi về ảnh này..." : "Nhập tin nhắn hoặc gửi ảnh..."}
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() && !selectedImage || isSending) && styles.sendButtonDisabled]}
            onPress={sendMessageWithImage}
            disabled={(!inputText.trim() && !selectedImage) || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#FF6B00',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? 40 : 12,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  refreshButton: {
    padding: 8,
  },
  welcomeContainer: {
    alignItems: 'center',
    padding: 32,
    marginTop: 16,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  quickSuggestions: {
    marginTop: 24,
    width: '100%',
  },
  quickSuggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  suggestionChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF6B00',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 8,
  },
  suggestionChipText: {
    color: '#FF6B00',
    fontSize: 14,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  bubbleContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '90%',
  },
  ownContainer: {
    alignSelf: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiAvatar: {
    backgroundColor: '#2196F3',
  },
  adminAvatar: {
    backgroundColor: '#4CAF50',
  },
  bubbleContent: {
    flex: 1,
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  ownBubble: {
    backgroundColor: '#FF6B00',
    borderRadius: 20,
    borderBottomRightRadius: 4,
    padding: 12,
    paddingBottom: 8,
  },
  adminBubble: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    padding: 12,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  aiBubble: {
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    padding: 12,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  ownText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 21,
  },
  otherText: {
    color: '#333',
    fontSize: 15,
    lineHeight: 21,
  },
  timeText: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  ownTimeText: {
    color: 'rgba(255,255,255,0.7)',
  },
  // Product Suggestions Styles
  suggestionsContainer: {
    marginTop: 12,
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  suggestionsScroll: {
    paddingRight: 8,
  },
  productCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  productImageContainer: {
    width: '100%',
    height: 100,
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    lineHeight: 17,
  },
  productBrand: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF6B00',
  },
  productPriceOriginal: {
    fontSize: 11,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 3,
    fontWeight: '500',
  },
  reviewCount: {
    fontSize: 10,
    color: '#999',
    marginLeft: 2,
  },
  // Typing Indicator
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 40,
    marginBottom: 12,
  },
  typingDots: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    marginRight: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
    marginHorizontal: 2,
    opacity: 0.6,
  },
  typingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  imageButton: {
    padding: 10,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: '#F5F5F5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B00',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 4,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Success styles for ADD_TO_CART action
  successBubble: {
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    padding: 12,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: '#81C784',
  },
  successAvatar: {
    backgroundColor: '#4CAF50',
  },
  actionButtons: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  viewCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  viewCartButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Image Preview Styles (ChatGPT-style)
  imagePreviewContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: '#fff',
  },
  imagePreviewWrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;
