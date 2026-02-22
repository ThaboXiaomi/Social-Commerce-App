/**
 * Social Media App - WhatsApp, Instagram, Threads, Snapchat, Telegram, VK, Financial Trading
 * Premium version with Authentication, Glassmorphism, Animations
 *
 * @format
 */

import React, {useState, useEffect, useRef} from 'react';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  Text,
  Alert,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Animated,
} from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

const API_BASE = 'http://localhost:8000';

// Types
interface User {
  id: number;
  username: string;
  name: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
}

interface Post {
  id: number;
  user_id: number;
  username: string;
  avatar: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timestamp: string;
}

interface Conversation {
  user_id: number;
  user: User;
  last_message: string;
  timestamp: string;
  unread: boolean;
}

interface Story {
  id: number;
  user_id: number;
  username: string;
  avatar: string;
  image: string;
  expires_in: number;
}

interface Product {
  id: number;
  seller_id: number;
  seller_name: string;
  seller_avatar: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  sold: number;
  stock: number;
  shipping_cost: number;
  estimated_delivery: string;
}

interface CartItem {
  product_id: number;
  seller_id: number;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  user_id: number;
  items: CartItem[];
  total_price: number;
  shipping_address: string;
  status: string;
  created_at: string;
  estimated_delivery: string;
}

interface Stock {
  id: number;
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_amount: number;
  market_cap: string;
  volume: string;
  rating: number;
  reviews: number;
  high_52w: number;
  low_52w: number;
  pe_ratio: number;
  dividend_yield: number;
  description: string;
  chart_data: number[];
}

interface ForexPair {
  id: number;
  symbol: string;
  name: string;
  rate: number;
  bid: number;
  ask: number;
  change: number;
  change_percent: number;
  high: number;
  low: number;
  description: string;
  chart_data: number[];
}

interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

// @ts-ignore - Used for type checking API responses
interface Wishlist {
  id: number;
  user_id: number;
  product_id: number;
  added_at: string;
  product?: Product;
}

interface Wallet {
  id: number;
  user_id: number;
  balance: number;
  total_spent: number;
  total_earned: number;
  created_at: string;
}

interface Cryptocurrency {
  id: number;
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  market_cap: string;
  volume: string;
}

interface CopyTrader {
  id: number;
  trader_id: number;
  trader_name: string;
  followers: number;
  win_rate: number;
  roi: number;
  total_trades: number;
  created_at: string;
}

interface LoyaltyPoints {
  id: number;
  user_id: number;
  points: number;
  tier: string;
  created_at: string;
}

type Screen = 'feed' | 'chat' | 'stories' | 'profile' | 'shop' | 'cart' | 'orders' | 'stocks' | 'forex' | 'notifications' | 'search' | 'wishlist' | 'wallet' | 'crypto' | 'copy-trading' | 'loyalty' | 'settings' | 'followers' | 'analytics';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Simulate splash screen with 2 second delay
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AuthenticationScreen onLoginSuccess={() => setIsLoggedIn(true)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent onLogout={() => {setIsLoggedIn(false); setIsLoading(true);}} />
    </SafeAreaProvider>
  );
}

// Splash Screen with Animated Logo
function SplashScreen() {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  return (
    <View style={styles.splashContainer}>
      <Animated.View style={[styles.logoContainer, {transform: [{scale: scaleAnim}], opacity: opacityAnim}]}>
        <Text style={styles.appLogo}>✨</Text>
        <Text style={styles.appName}>UniHub</Text>
        <Text style={styles.appTagline}>Social • Commerce • Trading</Text>
      </Animated.View>
    </View>
  );
}

// Authentication Screen
function AuthenticationScreen({onLoginSuccess}: {onLoginSuccess: () => void}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hasAccount, setHasAccount] = useState(true);
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const handleLogin = () => {
    if (email && password) {
      Alert.alert('Welcome!', `Logged in as ${email}`);
      onLoginSuccess();
    } else {
      Alert.alert('Error', 'Please fill in all fields');
    }
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert('Logging in...', `Connecting with ${provider}`);
    setTimeout(onLoginSuccess, 1500);
  };

  return (
    <ScrollView style={styles.authContainer}>
      <Animated.View style={[styles.authContent, {transform: [{translateY: slideAnim}]}]}>
        {/* Header */}
        <View style={styles.authHeader}>
          <Text style={styles.authTitle}>✨ UniHub</Text>
          <Text style={styles.authSubtitle}>{hasAccount ? 'Welcome Back' : 'Join Us'}</Text>
        </View>

        {/* Glassmorphism Form */}
        <View style={styles.glassForm}>
          <TextInput
            style={styles.glassInput}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.glassInput}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.glassButton} onPress={handleLogin}>
            <Text style={styles.glassButtonText}>{hasAccount ? 'Sign In' : 'Sign Up'}</Text>
          </TouchableOpacity>
        </View>

        {/* Social Login */}
        <View style={styles.socialLoginContainer}>
          <Text style={styles.dividerText}>Or continue with</Text>
          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={[styles.socialButton, styles.googleButton]}
              onPress={() => handleSocialLogin('Google')}>
              <Text style={styles.socialIcon}>🔵</Text>
              <Text style={styles.socialLabel}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialButton, styles.facebookButton]}
              onPress={() => handleSocialLogin('Facebook')}>
              <Text style={styles.socialIcon}>📘</Text>
              <Text style={styles.socialLabel}>Facebook</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialButton, styles.telegramButton]}
              onPress={() => handleSocialLogin('Telegram')}>
              <Text style={styles.socialIcon}>✈️</Text>
              <Text style={styles.socialLabel}>Telegram</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialButton, styles.vkButton]}
              onPress={() => handleSocialLogin('VK')}>
              <Text style={styles.socialIcon}>🔷</Text>
              <Text style={styles.socialLabel}>VK</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialButton, styles.appleButton]}
              onPress={() => handleSocialLogin('Apple')}>
              <Text style={styles.socialIcon}>🍎</Text>
              <Text style={styles.socialLabel}>Apple</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Toggle Sign In/Up */}
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleText}>{hasAccount ? "Don't have an account? " : 'Already have an account? '}</Text>
          <TouchableOpacity onPress={() => setHasAccount(!hasAccount)}>
            <Text style={styles.toggleLink}>{hasAccount ? 'Sign Up' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

function AppContent({onLogout}: {onLogout: () => void}) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('feed');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [currentUser] = useState<User>({
    id: 1,
    username: 'john_doe',
    name: 'John Doe',
    avatar: 'https://via.placeholder.com/50',
    bio: 'Travel enthusiast 🌍',
    followers: 1250,
    following: 340,
  });

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [currentScreen, slideAnim]);

  return (
    <View style={styles.container}>
      {/* Content */}
      {currentScreen === 'feed' && <FeedScreen />}
      {currentScreen === 'chat' && <ChatScreen />}
      {currentScreen === 'stories' && <StoriesScreen />}
      {currentScreen === 'profile' && <ProfileScreen user={currentUser} onLogout={onLogout} />}
      {currentScreen === 'shop' && <ShoppingScreen />}
      {currentScreen === 'cart' && <CartScreen />}
      {currentScreen === 'orders' && <OrdersScreen />}
      {currentScreen === 'stocks' && <StocksScreen />}
      {currentScreen === 'forex' && <ForexScreen />}
      {currentScreen === 'notifications' && <NotificationsScreen />}
      {currentScreen === 'search' && <SearchScreen />}
      {currentScreen === 'wishlist' && <WishlistScreen />}
      {currentScreen === 'wallet' && <WalletScreen />}
      {currentScreen === 'crypto' && <CryptoScreen />}
      {currentScreen === 'copy-trading' && <CopyTradingScreen />}
      {currentScreen === 'loyalty' && <LoyaltyScreen />}
      {currentScreen === 'settings' && <SettingsScreen onScreenChange={setCurrentScreen} />}
      {currentScreen === 'followers' && <FollowersScreen />}
      {currentScreen === 'analytics' && <AnalyticsScreen />}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navButton, currentScreen === 'feed' && styles.navActive]}
          onPress={() => setCurrentScreen('feed')}>
          <Text style={currentScreen === 'feed' ? styles.navTextActive : styles.navText}>🏠</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, currentScreen === 'stocks' && styles.navActive]}
          onPress={() => setCurrentScreen('stocks')}>
          <Text style={currentScreen === 'stocks' ? styles.navTextActive : styles.navText}>📈</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, currentScreen === 'shop' && styles.navActive]}
          onPress={() => setCurrentScreen('shop')}>
          <Text style={currentScreen === 'shop' ? styles.navTextActive : styles.navText}>🛍️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, currentScreen === 'chat' && styles.navActive]}
          onPress={() => setCurrentScreen('chat')}>
          <Text style={currentScreen === 'chat' ? styles.navTextActive : styles.navText}>💬</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, currentScreen === 'profile' && styles.navActive]}
          onPress={() => setCurrentScreen('profile')}>
          <Text style={currentScreen === 'profile' ? styles.navTextActive : styles.navText}>👤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Feed Screen (Instagram/Threads style)
function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const response = await fetch(`${API_BASE}/feed`);
      const data = await response.json();
      setPosts(data);
    } catch {
      Alert.alert('Error', 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const likePost = async (postId: number) => {
    try {
      const response = await fetch(`${API_BASE}/posts/${postId}/like`, {method: 'POST'});
      const data = await response.json();
      setPosts(posts.map(p => p.id === postId ? {...p, likes: data.likes} : p));
    } catch {
      Alert.alert('Error', 'Failed to like post');
    }
  };

  return (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Loading posts...</Text>
      ) : (
        posts.map(post => (
          <View key={post.id} style={styles.postCard}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <Image source={{uri: post.avatar}} style={styles.postAvatar} />
              <View>
                <Text style={styles.postUsername}>{post.username}</Text>
                <Text style={styles.postTime}>{post.timestamp}</Text>
              </View>
            </View>

            {/* Post Content */}
            <Text style={styles.postContent}>{post.content}</Text>
            {post.image && (
              <Image source={{uri: post.image}} style={styles.postImage} />
            )}

            {/* Post Actions */}
            <View style={styles.postActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => likePost(post.id)}>
                <Text style={styles.actionText}>❤️ {post.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionText}>💬 {post.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionText}>↗️ Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// Chat Screen (WhatsApp style)
function ChatScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${API_BASE}/conversations`);
      const data = await response.json();
      setConversations(data);
    } catch {
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Loading messages...</Text>
      ) : (
        conversations.map(conv => (
          <TouchableOpacity key={conv.user_id} style={styles.chatItem}>
            <Image source={{uri: conv.user.avatar}} style={styles.chatAvatar} />
            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>{conv.user.name}</Text>
              <Text style={styles.chatPreview}>{conv.last_message}</Text>
            </View>
            <View style={styles.chatMeta}>
              <Text style={styles.chatTime}>{conv.timestamp}</Text>
              {conv.unread && <View style={styles.unreadBadge} />}
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

// Stories Screen (Snapchat style)
function StoriesScreen() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await fetch(`${API_BASE}/stories`);
      const data = await response.json();
      setStories(data);
    } catch {
      Alert.alert('Error', 'Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stories</Text>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Loading stories...</Text>
      ) : (
        <View style={styles.storiesGrid}>
          {stories.map(story => (
            <TouchableOpacity key={story.id} style={styles.storyTile}>
              <Image source={{uri: story.image}} style={styles.storyImage} />
              <View style={styles.storyOverlay}>
                <Image source={{uri: story.avatar}} style={styles.storyAvatar} />
                <Text style={styles.storyUsername}>{story.username}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.addStoryButton} onPress={() => Alert.alert('Add Story', 'Camera feature coming soon!')}>
        <Text style={styles.addStoryText}>+ Add Your Story</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Stocks & Forex Screen
function StocksScreen() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'market' | 'portfolio'>('market');

  useEffect(() => {
    fetchStocks();
    fetchPortfolio();
  }, []);

  const fetchStocks = async () => {
    try {
      const response = await fetch(`${API_BASE}/stocks`);
      const data = await response.json();
      setStocks(data);
    } catch {
      Alert.alert('Error', 'Failed to load stocks');
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const response = await fetch(`${API_BASE}/portfolio/1`);
      const data = await response.json();
      setPortfolio(data);
    } catch {
      console.log('Portfolio not available');
    }
  };

  const buyStock = (stock: Stock) => {
    Alert.prompt('Buy Stock', `How many shares of ${stock.symbol}?`, [
      {text: 'Cancel', onPress: () => {}},
      {
        text: 'Buy',
        onPress: async (quantity: string | undefined) => {
          if (!quantity) return;
          try {
            const response = await fetch(`${API_BASE}/trade/buy`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                user_id: 1,
                symbol: stock.symbol,
                quantity: parseFloat(quantity),
                price: stock.price,
                asset_type: 'stock',
              }),
            });
            const data = await response.json();
            if (data.success) {
              Alert.alert('Success', `Bought ${quantity} shares of ${stock.symbol}!`);
              fetchPortfolio();
            }
          } catch {
            Alert.alert('Error', 'Trade failed');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stocks 📈</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'market' && styles.tabActive]}
          onPress={() => setActiveTab('market')}>
          <Text style={activeTab === 'market' ? styles.tabTextActive : styles.tabText}>Market</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'portfolio' && styles.tabActive]}
          onPress={() => setActiveTab('portfolio')}>
          <Text style={activeTab === 'portfolio' ? styles.tabTextActive : styles.tabText}>Portfolio</Text>
        </TouchableOpacity>
      </View>

      {/* Portfolio Summary */}
      {activeTab === 'portfolio' && portfolio && (
        <View style={styles.portfolioSummary}>
          <View style={styles.portfolioCard}>
            <Text style={styles.portfolioLabel}>Total Value</Text>
            <Text style={styles.portfolioValue}>${portfolio.total_value?.toFixed(2)}</Text>
          </View>
          <View style={styles.portfolioCard}>
            <Text style={styles.portfolioLabel}>Profit/Loss</Text>
            <Text style={[styles.portfolioValue, {color: portfolio.profit_loss > 0 ? '#25D366' : '#FF3B30'} as any]}>
              {portfolio.profit_loss > 0 ? '+' : ''}{portfolio.profit_loss?.toFixed(2)} ({portfolio.profit_loss_percent?.toFixed(2)}%)
            </Text>
          </View>
        </View>
      )}

      {/* Market View */}
      {activeTab === 'market' && (
        <>
          {loading ? (
            <Text style={styles.loadingText}>Loading stocks...</Text>
          ) : (
            stocks.map(stock => (
              <TouchableOpacity key={stock.id} style={styles.stockCard} onPress={() => buyStock(stock)}>
                <View style={styles.stockHeader}>
                  <View>
                    <Text style={styles.stockSymbol}>{stock.symbol}</Text>
                    <Text style={styles.stockName}>{stock.name}</Text>
                  </View>
                  <View style={styles.stockPriceContainer}>
                    <Text style={styles.stockPrice}>${stock.price.toFixed(2)}</Text>
                    <Text style={[styles.stockChange, {color: stock.change > 0 ? '#25D366' : '#FF3B30'} as any]}>
                      {stock.change > 0 ? '▲' : '▼'} {Math.abs(stock.change)}%
                    </Text>
                  </View>
                </View>
                <Text style={styles.stockDesc}>{stock.description}</Text>
                <View style={styles.stockStats}>
                  <View style={styles.statSmall}>
                    <Text style={styles.statLabel}>Market Cap</Text>
                    <Text style={styles.statValue}>{stock.market_cap}</Text>
                  </View>
                  <View style={styles.statSmall}>
                    <Text style={styles.statLabel}>P/E Ratio</Text>
                    <Text style={styles.statValue}>{stock.pe_ratio}</Text>
                  </View>
                  <View style={styles.statSmall}>
                    <Text style={styles.statLabel}>Dividend</Text>
                    <Text style={styles.statValue}>{stock.dividend_yield}%</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

// Forex Screen
function ForexScreen() {
  const [forexPairs, setForexPairs] = useState<ForexPair[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForexPairs();
  }, []);

  const fetchForexPairs = async () => {
    try {
      const response = await fetch(`${API_BASE}/forex`);
      const data = await response.json();
      setForexPairs(data);
    } catch {
      Alert.alert('Error', 'Failed to load forex pairs');
    } finally {
      setLoading(false);
    }
  };

  const tradeForex = (pair: ForexPair) => {
    Alert.alert('Trade Forex', `${pair.symbol} - ${pair.rate.toFixed(4)}`, [
      {text: 'Cancel', onPress: () => {}},
      {text: 'Buy', onPress: () => Alert.alert('Trade Placed', `Buy order for ${pair.symbol} placed!`)},
      {text: 'Sell', onPress: () => Alert.alert('Trade Placed', `Sell order for ${pair.symbol} placed!`)},
    ]);
  };

  return (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Forex 💱</Text>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Loading forex pairs...</Text>
      ) : (
        forexPairs.map(pair => (
          <TouchableOpacity key={pair.id} style={styles.forexCard} onPress={() => tradeForex(pair)}>
            <View style={styles.forexHeader}>
              <View>
                <Text style={styles.forexSymbol}>{pair.symbol}</Text>
                <Text style={styles.forexName}>{pair.name}</Text>
              </View>
              <View style={styles.forexRateContainer}>
                <Text style={styles.forexRate}>{pair.rate.toFixed(4)}</Text>
                <Text style={[styles.forexChange, {color: pair.change > 0 ? '#25D366' : '#FF3B30'} as any]}>
                  {pair.change > 0 ? '▲' : '▼'} {Math.abs(pair.change_percent).toFixed(2)}%
                </Text>
              </View>
            </View>
            <Text style={styles.forexDesc}>{pair.description}</Text>
            <View style={styles.forexStats}>
              <View style={styles.forexStat}>
                <Text style={styles.statLabel}>Bid</Text>
                <Text style={styles.statValue}>{pair.bid.toFixed(4)}</Text>
              </View>
              <View style={styles.forexStat}>
                <Text style={styles.statLabel}>Ask</Text>
                <Text style={styles.statValue}>{pair.ask.toFixed(4)}</Text>
              </View>
              <View style={styles.forexStat}>
                <Text style={styles.statLabel}>Range</Text>
                <Text style={styles.statValue}>{pair.low.toFixed(4)} - {pair.high.toFixed(4)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

// Profile Screen
function ProfileScreen({ user, onLogout }: { user: User; onLogout: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <ScrollView style={styles.screenContainer}>
      <Animated.View style={[styles.profileHeader, {transform: [{scale: scaleAnim}]}]}>
        <Image source={{uri: user.avatar}} style={styles.profileAvatar} />
        <Text style={styles.profileName}>{user.name}</Text>
        <Text style={styles.profileUsername}>@{user.username}</Text>
        <Text style={styles.profileBio}>{user.bio}</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.glassButton} onPress={() => Alert.alert('Edit', 'Profile editing coming soon!')}>
          <Text style={styles.glassButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Share Options */}
      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Share Profile</Text>
        <View style={styles.shareContainer}>
          <TouchableOpacity
            style={[styles.shareButton, styles.telegramShare]}
            onPress={() => Alert.alert('Share', 'Profile shared to Telegram!')}>
            <Text style={styles.shareIcon}>✈️</Text>
            <Text style={styles.shareLabel}>Telegram</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareButton, styles.vkShare]}
            onPress={() => Alert.alert('Share', 'Profile shared to VK!')}>
            <Text style={styles.shareIcon}>🔷</Text>
            <Text style={styles.shareLabel}>VK</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareButton, styles.facebookShare]}
            onPress={() => Alert.alert('Share', 'Profile shared to Facebook!')}>
            <Text style={styles.shareIcon}>📘</Text>
            <Text style={styles.shareLabel}>Facebook</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Recent Posts</Text>
        <View style={styles.postsList}>
          <TouchableOpacity style={styles.postPreview}>
            <Text style={styles.postPreviewText}>📸 Post 1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.postPreview}>
            <Text style={styles.postPreviewText}>📸 Post 2</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => {
          Alert.alert('Sign Out', 'Are you sure?', [
            {text: 'Cancel', onPress: () => {}},
            {text: 'Sign Out', onPress: onLogout},
          ]);
        }}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Shopping Screen (Amazon/Temu/Facebook Marketplace style)
function ShoppingScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/products`);
      const data = await response.json();
      setProducts(data);
    } catch {
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchText.trim()) {
      try {
        const response = await fetch(`${API_BASE}/products?search=${searchText}`);
        const data = await response.json();
        setProducts(data);
      } catch {
        Alert.alert('Error', 'Failed to search products');
      }
    }
  };

  const addToCart = async (product: Product) => {
    try {
      const response = await fetch(`${API_BASE}/cart/1/add`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          product_id: product.id,
          seller_id: product.seller_id,
          quantity: 1,
          price: product.price,
        }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', `${product.name} added to cart!`);
      }
    } catch {
      Alert.alert('Error', 'Failed to add to cart');
    }
  };

  return (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shop</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Loading products...</Text>
      ) : (
        <View>
          {products.map(product => (
            <View key={product.id} style={styles.productCard}>
              <Image source={{uri: product.image}} style={styles.productImage} />
              
              <View style={styles.productInfo}>
                <View style={styles.sellerInfo}>
                  <Image source={{uri: product.seller_avatar}} style={styles.sellerAvatar} />
                  <View>
                    <Text style={styles.sellerName}>{product.seller_name}</Text>
                    <Text style={styles.rating}>⭐ {product.rating} ({product.reviews})</Text>
                  </View>
                </View>

                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productDesc}>{product.description}</Text>

                <View style={styles.priceContainer}>
                  <Text style={styles.price}>${product.price}</Text>
                  {product.original_price && (
                    <Text style={styles.originalPrice}>${product.original_price}</Text>
                  )}
                </View>

                <View style={styles.productMeta}>
                  <Text style={styles.metaText}>📦 Sold: {product.sold}</Text>
                  <Text style={styles.metaText}>⏱️ {product.estimated_delivery}</Text>
                </View>

                <TouchableOpacity
                  style={styles.addCartButton}
                  onPress={() => addToCart(product)}>
                  <Text style={styles.addCartText}>Add to Cart</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// Cart Screen
function CartScreen() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await fetch(`${API_BASE}/cart/1`);
      const data = await response.json();
      setCartItems(data.items);
      setTotal(data.total);
    } catch {
      Alert.alert('Error', 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId: number) => {
    try {
      await fetch(`${API_BASE}/cart/1/remove/${productId}`, {method: 'POST'});
      fetchCart();
    } catch {
      Alert.alert('Error', 'Failed to remove item');
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Add items to checkout');
      return;
    }
    Alert.prompt('Shipping Address', 'Enter your address:', [
      {text: 'Cancel', onPress: () => {}},
      {
        text: 'Checkout',
        onPress: async (address: string | undefined) => {
          if (!address) return;
          try {
            const response = await fetch(`${API_BASE}/checkout/1`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({address}),
            });
            const data = await response.json();
            if (data.success) {
              Alert.alert('Order Confirmed', `Order #${data.order_id} created!\nTotal: $${data.total.toFixed(2)}`);
              fetchCart();
            }
          } catch {
            Alert.alert('Error', 'Checkout failed');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cart</Text>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Loading cart...</Text>
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyDesc}>Start shopping to add items</Text>
        </View>
      ) : (
        <>
          {cartItems.map((item, index) => (
            <View key={index} style={styles.cartItemContainer}>
              <View style={styles.cartItemInfo}>
                <Text style={styles.cartItemName}>Product {item.product_id}</Text>
                <Text style={styles.cartItemPrice}>
                  ${item.price} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeItem(item.product_id)}>
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.cartSummary}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalPrice}>${total.toFixed(2)}</Text>
          </View>

          <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
            <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

// Orders Screen
function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE}/orders/1`);
      const data = await response.json();
      setOrders(data);
    } catch {
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Loading orders...</Text>
      ) : orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>📦</Text>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptyDesc}>Your orders will appear here</Text>
        </View>
      ) : (
        orders.map(order => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>Order #{order.id}</Text>
              <Text style={[styles.orderStatus, {color: order.status === 'delivered' ? '#25D366' : '#FF9500'} as any]}>
                {order.status.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.orderDate}>{order.created_at}</Text>
            <Text style={styles.orderItems}>{order.items.length} items</Text>
            <Text style={styles.orderDelivery}>Delivery: {order.estimated_delivery}</Text>
            <Text style={styles.orderTotal}>${order.total_price.toFixed(2)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// Notifications Screen
function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE}/notifications/1`);
      const data = await response.json();
      setNotifications(data);
    } catch {
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await fetch(`${API_BASE}/notifications/1/read/${notificationId}`, {method: 'POST'});
      setNotifications(notifications.map(n => n.id === notificationId ? {...n, read: true} : n));
    } catch {
      Alert.alert('Error', 'Failed to mark as read');
    }
  };

  return (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>
      {loading ? (
        <Text style={styles.loadingText}>Loading notifications...</Text>
      ) : (
        notifications.map(notif => (
          <TouchableOpacity
            key={notif.id}
            style={[styles.notificationCard, !notif.read && styles.notificationUnread]}
            onPress={() => markAsRead(notif.id)}>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{notif.title}</Text>
              <Text style={styles.notificationMessage}>{notif.message}</Text>
              <Text style={styles.notificationTime}>{notif.created_at}</Text>
            </View>
            <View style={[styles.notificationDot, !notif.read && styles.dotActive]} />
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

// Search Screen
function SearchScreen() {
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<(Product | User)[]>([]);

  const handleSearch = async (text: string) => {
    setSearchText(text);
    if (text.length > 0) {
      try {
        const response = await fetch(`${API_BASE}/products?search=${text}`);
        const data = await response.json();
        setResults(data);
      } catch {
        Alert.alert('Error', 'Search failed');
      }
    } else {
      setResults([]);
    }
  };

  return (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>
      <TextInput
        style={styles.searchInputField}
        placeholder="Search products, users, posts..."
        placeholderTextColor="#999"
        value={searchText}
        onChangeText={handleSearch}
      />
      {results.length > 0 ? (
        results.map((item: any) => (
          <View key={item.id} style={styles.searchResultCard}>
            <Image source={{uri: item.image || item.avatar}} style={styles.searchResultImage} />
            <View style={styles.flexContainer}>
              <Text style={styles.searchResultName}>{item.name || item.username}</Text>
              <Text style={styles.searchResultDesc}>{item.description || item.bio}</Text>
            </View>
          </View>
        ))
      ) : searchText ? (
        <Text style={styles.noResultsText}>No results found</Text>
      ) : (
        <Text style={styles.loadingText}>Start typing to search...</Text>
      )}
    </ScrollView>
  );
}

// Wishlist Screen
function WishlistScreen() {
  const [wishlist, setWishlist] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await fetch(`${API_BASE}/wishlists/1`);
      const data = await response.json();
      setWishlist(data);
    } catch {
      Alert.alert('Error', 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: number) => {
    try {
      await fetch(`${API_BASE}/wishlists/1/remove/${productId}`, {method: 'DELETE'});
      setWishlist(wishlist.filter(w => w.product_id !== productId));
    } catch {
      Alert.alert('Error', 'Failed to remove from wishlist');
    }
  };

  return (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wishlist</Text>
      </View>
      {loading ? (
        <Text style={styles.loadingText}>Loading wishlist...</Text>
      ) : wishlist.length > 0 ? (
        wishlist.map(item => (
          <View key={item.id} style={styles.wishlistCard}>
            <Image source={{uri: item.product?.image || ''}} style={styles.wishlistImage} />
            <View style={styles.flexContainer}>
              <Text style={styles.wishlistName}>{item.product?.name}</Text>
              <Text style={styles.wishlistPrice}>${item.product?.price}</Text>
            </View>
            <TouchableOpacity onPress={() => removeFromWishlist(item.product_id)}>
              <Text style={styles.removeButton}>❌</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <Text style={styles.noResultsText}>Your wishlist is empty</Text>
      )}
    </ScrollView>
  );
}

// Wallet Screen
function WalletScreen() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const response = await fetch(`${API_BASE}/wallet/1`);
      const data = await response.json();
      setWallet(data);
    } catch {
      Alert.alert('Error', 'Failed to load wallet');
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      Alert.alert('Invalid', 'Enter a valid amount');
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/wallet/1/deposit?amount=${depositAmount}`, {method: 'POST'});
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', `Deposited $${depositAmount}`);
        fetchWallet();
        setDepositAmount('');
      }
    } catch {
      Alert.alert('Error', 'Deposit failed');
    }
  };

  return (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet</Text>
      </View>
      {wallet && (
        <>
          <View style={styles.walletCard}>
            <Text style={styles.walletLabel}>Current Balance</Text>
            <Text style={styles.walletBalance}>${wallet.balance.toFixed(2)}</Text>
          </View>
          <View style={styles.walletStatsRow}>
            <View style={styles.walletStat}>
              <Text style={styles.walletStatLabel}>Total Spent</Text>
              <Text style={styles.walletStatValue}>${wallet.total_spent.toFixed(2)}</Text>
            </View>
            <View style={styles.walletStat}>
              <Text style={styles.walletStatLabel}>Total Earned</Text>
              <Text style={[styles.walletStatValue, {color: '#25D366'} as any]}>${wallet.total_earned.toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.depositSection}>
            <Text style={styles.sectionTitle}>Add Funds</Text>
            <TextInput
              style={styles.glassInput}
              placeholder="Enter amount"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={depositAmount}
              onChangeText={setDepositAmount}
            />
            <TouchableOpacity style={styles.glassButton} onPress={handleDeposit}>
              <Text style={styles.glassButtonText}>Deposit</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

// Cryptocurrency Screen
function CryptoScreen() {
  const [cryptos, setCryptos] = useState<Cryptocurrency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCryptos();
  }, []);

  const fetchCryptos = async () => {
    try {
      const response = await fetch(`${API_BASE}/crypto`);
      const data = await response.json();
      setCryptos(data);
    } catch {
      Alert.alert('Error', 'Failed to load cryptocurrencies');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cryptocurrencies</Text>
      </View>
      {loading ? (
        <Text style={styles.loadingText}>Loading crypto data...</Text>
      ) : (
        cryptos.map(crypto => (
          <TouchableOpacity key={crypto.id} style={styles.cryptoCard}>
            <View style={styles.cryptoHeader}>
              <View>
                <Text style={styles.cryptoSymbol}>{crypto.symbol}</Text>
                <Text style={styles.cryptoName}>{crypto.name}</Text>
              </View>
              <View style={styles.cryptoPriceContainer}>
                <Text style={styles.cryptoPrice}>${crypto.price.toFixed(2)}</Text>
                <Text style={[styles.cryptoChange, {color: crypto.change > 0 ? '#25D366' : '#FF3B30'} as any]}>
                  {crypto.change > 0 ? '▲' : '▼'} {Math.abs(crypto.change_percent).toFixed(2)}%
                </Text>
              </View>
            </View>
            <View style={styles.cryptoStats}>
              <View style={styles.cryptoStat}>
                <Text style={styles.statLabel}>Market Cap</Text>
                <Text style={styles.statValue}>{crypto.market_cap}</Text>
              </View>
              <View style={styles.cryptoStat}>
                <Text style={styles.statLabel}>Volume</Text>
                <Text style={styles.statValue}>{crypto.volume}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

// Copy Trading Screen
function CopyTradingScreen() {
  const [traders, setTraders] = useState<CopyTrader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTraders();
  }, []);

  const fetchTraders = async () => {
    try {
      const response = await fetch(`${API_BASE}/copy-traders`);
      const data = await response.json();
      setTraders(data);
    } catch {
      Alert.alert('Error', 'Failed to load traders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Top Traders</Text>
      </View>
      {loading ? (
        <Text style={styles.loadingText}>Loading traders...</Text>
      ) : (
        traders.map(trader => (
          <TouchableOpacity key={trader.id} style={styles.traderCard}>
            <View style={styles.traderInfo}>
              <Text style={styles.traderName}>{trader.trader_name}</Text>
              <Text style={styles.traderFollowers}>{trader.followers} followers</Text>
            </View>
            <View style={styles.traderStats}>
              <View style={styles.traderStat}>
                <Text style={styles.statLabel}>Win Rate</Text>
                <Text style={styles.statValue}>{trader.win_rate}%</Text>
              </View>
              <View style={styles.traderStat}>
                <Text style={styles.statLabel}>ROI</Text>
                <Text style={[styles.statValue, {color: '#25D366'} as any]}>{trader.roi}%</Text>
              </View>
              <View style={styles.traderStat}>
                <Text style={styles.statLabel}>Trades</Text>
                <Text style={styles.statValue}>{trader.total_trades}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.copyButton} onPress={() => Alert.alert('Copying trades from ' + trader.trader_name)}>
              <Text style={styles.copyButtonText}>📋 Copy</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

// Loyalty Screen
function LoyaltyScreen() {
  const [loyalty, setLoyalty] = useState<LoyaltyPoints | null>(null);

  useEffect(() => {
    fetchLoyalty();
  }, []);

  const fetchLoyalty = async () => {
    try {
      const response = await fetch(`${API_BASE}/loyalty/1`);
      const data = await response.json();
      setLoyalty(data);
    } catch {
      Alert.alert('Error', 'Failed to load loyalty points');
    }
  };

  const tierColors: {[key: string]: string} = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
  };

  return (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Loyalty Program</Text>
      </View>
      {loyalty && (
        <>
          <View style={styles.loyaltyCard}>
            <Text style={[styles.tierBadge, {color: tierColors[loyalty.tier], fontSize: 48} as any]}>
              ⭐ {loyalty.tier.toUpperCase()}
            </Text>
            <Text style={styles.pointsDisplay}>{loyalty.points} Points</Text>
            <View style={styles.progressBar}>
              <View style={{width: `${(loyalty.points % 1000) / 10}%`, height: '100%', backgroundColor: '#007AFF'} as any} />
            </View>
            <Text style={styles.progressText}>{loyalty.points % 1000} / 1000 to next tier</Text>
          </View>
          <View style={styles.benefitsSection}>
            <Text style={styles.sectionTitle}>Tier Benefits</Text>
            <Text style={styles.benefitItem}>🎁 Exclusive discounts</Text>
            <Text style={styles.benefitItem}>🚚 Free shipping</Text>
            <Text style={styles.benefitItem}>💰 Cashback rewards</Text>
            <Text style={styles.benefitItem}>⏰ Early access to sales</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

// Settings Screen
function SettingsScreen({onScreenChange}: {onScreenChange: (screen: Screen) => void}) {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');

  return (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Display</Text>
        <TouchableOpacity style={styles.settingsItem} onPress={() => setDarkMode(!darkMode)}>
          <Text style={styles.settingsLabel}>Dark Mode</Text>
          <Text style={styles.toggleSwitch}>{darkMode ? '🔵' : '⚪'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Language</Text>
        {['en', 'es', 'fr', 'de', 'zh'].map(lang => (
          <TouchableOpacity
            key={lang}
            style={[styles.settingsItem, language === lang && styles.settingsItemActive]}
            onPress={() => setLanguage(lang)}>
            <Text style={styles.settingsLabel}>{lang.toUpperCase()}</Text>
            <Text>{language === lang ? '✓' : ''}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Account</Text>
        <TouchableOpacity style={styles.settingsItem} onPress={() => onScreenChange('followers')}>
          <Text style={styles.settingsLabel}>👥 View Followers</Text>
          <Text>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem} onPress={() => onScreenChange('analytics')}>
          <Text style={styles.settingsLabel}>📊 Analytics</Text>
          <Text>→</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Followers Screen
function FollowersScreen() {
  const [followers, setFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowers();
  }, []);

  const fetchFollowers = async () => {
    try {
      const response = await fetch(`${API_BASE}/followers/1`);
      const data = await response.json();
      setFollowers(data);
    } catch {
      Alert.alert('Error', 'Failed to load followers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Followers</Text>
      </View>
      {loading ? (
        <Text style={styles.loadingText}>Loading followers...</Text>
      ) : followers.length > 0 ? (
        followers.map((follower, idx) => (
          <View key={idx} style={styles.followerCard}>
            <Text style={styles.followerName}>User {follower.follower_id}</Text>
            <Text style={styles.followerDate}>Followed on {follower.created_at}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.noResultsText}>No followers yet</Text>
      )}
    </ScrollView>
  );
}

// Analytics Screen
function AnalyticsScreen() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE}/analytics/1/user_spending`);
      const data = await response.json();
      setAnalytics(data[0]?.data || {});
    } catch {
      Alert.alert('Error', 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
      </View>
      {loading ? (
        <Text style={styles.loadingText}>Loading analytics...</Text>
      ) : (
        <>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsLabel}>Total Spent</Text>
            <Text style={styles.analyticsValue}>${analytics.total_spent || 0}</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsLabel}>Total Orders</Text>
            <Text style={styles.analyticsValue}>{analytics.orders || 0}</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsLabel}>Average Order Value</Text>
            <Text style={styles.analyticsValue}>${analytics.avg_order || 0}</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsLabel}>Favorite Category</Text>
            <Text style={styles.analyticsValue}>{analytics.favorite_category || 'N/A'}</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  screenContainer: {
    flex: 1,
    paddingBottom: 70,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },

  // Feed Styles
  postCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    padding: 12,
  },
  postHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postUsername: {
    fontWeight: '600',
    fontSize: 14,
  },
  postTime: {
    fontSize: 12,
    color: '#666',
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    padding: 8,
  },
  actionText: {
    fontSize: 14,
  },

  // Chat Styles
  chatItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 4,
  },
  chatPreview: {
    fontSize: 13,
    color: '#666',
  },
  chatMeta: {
    alignItems: 'flex-end',
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#25D366',
  },

  // Stories Styles
  storiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    justifyContent: 'space-between',
  },
  storyTile: {
    width: '48%',
    aspectRatio: 9 / 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  storyOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  storyUsername: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  addStoryButton: {
    margin: 16,
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  addStoryText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Profile Styles
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  profileSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  postsList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  postPreview: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postPreviewText: {
    fontSize: 24,
  },

  // Bottom Navigation
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    height: 60,
  },
  navButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navActive: {
    backgroundColor: '#f5f5f5',
  },
  navText: {
    fontSize: 24,
  },
  navTextActive: {
    fontSize: 24,
  },

  // Shopping Styles
  searchContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f5f5f5',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 14,
  },
  searchButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 18,
  },
  productCard: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    padding: 12,
    backgroundColor: '#fff',
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  sellerInfo: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  sellerName: {
    fontWeight: '600',
    fontSize: 12,
  },
  rating: {
    fontSize: 11,
    color: '#666',
  },
  productName: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  productDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#25D366',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    fontSize: 11,
    color: '#999',
  },
  metaText: {
    fontSize: 11,
    color: '#999',
  },
  addCartButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  addCartText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },

  // Cart Styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#666',
  },
  cartItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#666',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cartSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f5f5f5',
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#25D366',
  },
  checkoutButton: {
    margin: 12,
    paddingVertical: 14,
    backgroundColor: '#25D366',
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  // Orders Styles
  orderCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    margin: 12,
    backgroundColor: '#fff',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  orderStatus: {
    fontWeight: '600',
    fontSize: 12,
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  orderItems: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  orderDelivery: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#25D366',
  },

  // Stocks & Forex Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  portfolioSummary: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'space-between',
  },
  portfolioCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  portfolioLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  portfolioValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  stockCard: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    padding: 12,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stockSymbol: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  stockName: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  stockPriceContainer: {
    alignItems: 'flex-end',
  },
  stockPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  stockChange: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  stockDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  stockStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statSmall: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  forexCard: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    padding: 12,
  },
  forexHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  forexSymbol: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  forexName: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  forexRateContainer: {
    alignItems: 'flex-end',
  },
  forexRate: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  forexChange: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  forexDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  forexStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  forexStat: {
    alignItems: 'center',
  },

  // Splash Screen Styles
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#667eea',
  },
  logoContainer: {
    alignItems: 'center',
  },
  appLogo: {
    fontSize: 80,
    marginBottom: 20,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1.5,
  },

  // Authentication Screen Styles
  authContainer: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  authContent: {
    padding: 24,
    paddingTop: 60,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  authTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  authSubtitle: {
    fontSize: 18,
    color: '#666',
  },

  // Glassmorphism Styles
  glassForm: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
  },
  glassInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#000',
  },
  glassButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  glassButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  // Social Login Styles
  socialLoginContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  socialButton: {
    width: '48%',
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  googleButton: {
    borderColor: '#EA4335',
  },
  facebookButton: {
    borderColor: '#1877F2',
  },
  telegramButton: {
    borderColor: '#0088cc',
  },
  vkButton: {
    borderColor: '#0077ff',
  },
  appleButton: {
    borderColor: '#000',
  },
  socialIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  socialLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },

  // Toggle Container
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    color: '#666',
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
  },

  // Share Buttons
  shareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  shareButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  telegramShare: {
    borderColor: '#0088cc',
  },
  vkShare: {
    borderColor: '#0077ff',
  },
  facebookShare: {
    borderColor: '#1877F2',
  },
  shareIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  shareLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },

  // Logout Button
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  // Notifications Styles
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
  notificationUnread: {
    backgroundColor: '#f0f7ff',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 11,
    color: '#999',
  },
  notificationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
    marginLeft: 12,
  },
  dotActive: {
    backgroundColor: '#007AFF',
  },

  // Search Styles
  searchInputField: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    fontSize: 16,
  },
  searchResultCard: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  searchResultImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  searchResultName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  searchResultDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  noResultsText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 32,
    fontSize: 14,
  },
  wishlistCard: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  wishlistImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  wishlistName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  wishlistPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 4,
  },

  // Wallet Styles
  walletCard: {
    backgroundColor: 'rgba(0, 122, 255, 0.95)',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  walletLabel: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  walletBalance: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 8,
  },
  walletStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  walletStat: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  walletStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  walletStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 8,
  },
  depositSection: {
    padding: 16,
  },

  // Crypto Styles
  cryptoCard: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cryptoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cryptoSymbol: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  cryptoName: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  cryptoPriceContainer: {
    alignItems: 'flex-end',
  },
  cryptoPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cryptoChange: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  cryptoStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  cryptoStat: {
    alignItems: 'center',
  },

  // Copy Trading Styles
  traderCard: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  traderInfo: {
    marginBottom: 12,
  },
  traderName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  traderFollowers: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  traderStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  traderStat: {
    alignItems: 'center',
  },
  copyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // Loyalty Styles
  loyaltyCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  tierBadge: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  pointsDisplay: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  benefitsSection: {
    padding: 16,
  },
  benefitItem: {
    fontSize: 14,
    marginVertical: 8,
    paddingLeft: 16,
  },

  // Settings Styles
  settingsSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  settingsSectionTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingsItemActive: {
    backgroundColor: '#f0f7ff',
  },
  settingsLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  toggleSwitch: {
    fontSize: 20,
  },
  flexContainer: {
    flex: 1,
  },

  // Followers Styles
  followerCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  followerName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  followerDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  // Analytics Styles
  analyticsCard: {
    backgroundColor: '#f9f9f9',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#666',
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 8,
  },
});

export default App;
