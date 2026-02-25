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
  ActivityIndicator,
  Easing,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

const API_BASE = 'http://localhost:8000';
let ACCESS_TOKEN = '';
let REFRESH_TOKEN = '';
let ACTIVE_USER_ID = 1;
let REFRESH_IN_FLIGHT: Promise<boolean> | null = null;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';
const SHADOW_POST_CARD = Platform.select({
  web: {boxShadow: '0px 8px 10px rgba(15, 23, 42, 0.06)'},
  default: {
    shadowColor: '#0f172a',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
}) as any;
const SHADOW_BOTTOM_NAV = Platform.select({
  web: {boxShadow: '0px 8px 16px rgba(15, 23, 42, 0.08)'},
  default: {
    shadowColor: '#0f172a',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
}) as any;
const SHADOW_APP_LOGO_ORB = Platform.select({
  web: {boxShadow: '0px 12px 18px rgba(96, 165, 250, 0.45)'},
  default: {
    shadowColor: '#60a5fa',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
}) as any;
const SHADOW_GLASS_FORM = Platform.select({
  web: {boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.1)'},
  default: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
  },
}) as any;
const SHADOW_GLASS_BUTTON = Platform.select({
  web: {boxShadow: '0px 4px 8px rgba(0, 122, 255, 0.3)'},
  default: {
    shadowColor: '#007AFF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
}) as any;
const SHADOW_AUTH_SUBMIT = Platform.select({
  web: {boxShadow: '0px 10px 14px rgba(59, 130, 246, 0.35)'},
  default: {
    shadowColor: '#3b82f6',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
}) as any;
const SHADOW_LOGOUT = Platform.select({
  web: {boxShadow: '0px 4px 8px rgba(255, 59, 48, 0.3)'},
  default: {
    shadowColor: '#FF3B30',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
}) as any;

const requestWithToken = (path: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers ?? {});
  if (ACCESS_TOKEN) {
    headers.set('Authorization', `Bearer ${ACCESS_TOKEN}`);
  }
  return fetch(`${API_BASE}${path}`, {...options, headers});
};

const refreshAccessToken = async () => {
  if (!REFRESH_TOKEN) {
    return false;
  }
  if (REFRESH_IN_FLIGHT) {
    return REFRESH_IN_FLIGHT;
  }

  REFRESH_IN_FLIGHT = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({refresh_token: REFRESH_TOKEN}),
      });
      if (!response.ok) {
        ACCESS_TOKEN = '';
        REFRESH_TOKEN = '';
        return false;
      }
      const data = await response.json();
      ACCESS_TOKEN = data.access_token || '';
      REFRESH_TOKEN = data.refresh_token || '';
      return Boolean(ACCESS_TOKEN);
    } catch {
      return false;
    } finally {
      REFRESH_IN_FLIGHT = null;
    }
  })();

  return REFRESH_IN_FLIGHT;
};

const apiFetch = async (path: string, options: RequestInit = {}) => {
  const response = await requestWithToken(path, options);
  const isAuthRoute = path.startsWith('/auth/');
  if (response.status !== 401 || isAuthRoute) {
    return response;
  }

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    return response;
  }

  return requestWithToken(path, options);
};

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

interface ChatMessage {
  id: number;
  text: string;
  sender: 'me' | 'them';
  timestamp: string;
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

interface StockCandle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface StockChartPayload {
  symbol: string;
  range: string;
  interval: string;
  candles: StockCandle[];
  indicators: {
    sma20: Array<number | null>;
    ema20: Array<number | null>;
    rsi14: Array<number | null>;
  };
}

interface TrendLine {
  id: number;
  startIdx: number;
  endIdx: number;
  startPrice: number;
  endPrice: number;
  slope: number;
  color: string;
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

interface NewsArticle {
  title: string;
  source?: {name?: string};
  url?: string;
  publishedAt?: string;
}

interface ExternalPhoto {
  id: number;
  src?: {medium?: string; large?: string};
  alt?: string;
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

interface AuthAccount {
  id: number;
  fullName: string;
  username: string;
  email: string;
  password: string;
  provider?: string;
}

interface AuthApiUser {
  id: number;
  full_name: string;
  username: string;
  email: string;
  provider?: string | null;
}

interface AuthActionResult {
  account: AuthAccount | null;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

type Screen = 'feed' | 'chat' | 'stories' | 'profile' | 'shop' | 'cart' | 'orders' | 'stocks' | 'forex' | 'notifications' | 'search' | 'wishlist' | 'wallet' | 'crypto' | 'copy-trading' | 'loyalty' | 'settings' | 'followers' | 'analytics';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [accounts, setAccounts] = useState<AuthAccount[]>([
    {
      id: 1,
      fullName: 'Demo User',
      username: 'demo',
      email: 'demo@unihub.com',
      password: 'Demo@123',
    },
    {
      id: 2,
      fullName: 'Test User',
      username: 'testuser',
      email: 'test@unihub.com',
      password: 'Test@1234',
    },
  ]);
  const [activeUser, setActiveUser] = useState<User>({
    id: 1,
    username: 'demo',
    name: 'Demo User',
    avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=2563eb&color=ffffff&bold=true',
    bio: '',
    followers: 0,
    following: 0,
  });

  const mapAccountToUser = (account: AuthAccount): User => ({
    id: account.id,
    username: account.username,
    name: account.fullName,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(account.fullName)}&background=2563eb&color=ffffff&bold=true`,
    bio: account.provider ? `Signed in with ${account.provider}` : '',
    followers: 0,
    following: 0,
  });

  const handleLoginSuccess = (account: AuthAccount) => {
    ACTIVE_USER_ID = account.id;
    setActiveUser(mapAccountToUser(account));
    setIsLoggedIn(true);
  };

  useEffect(() => {
    ACCESS_TOKEN = accessToken;
  }, [accessToken]);
  useEffect(() => {
    REFRESH_TOKEN = refreshToken;
  }, [refreshToken]);

  const upsertAccount = (account: AuthAccount) => {
    setAccounts(prev => {
      const existingIndex = prev.findIndex(
        existing => existing.email.toLowerCase() === account.email.toLowerCase()
      );

      if (existingIndex === -1) {
        return [...prev, account];
      }

      const next = [...prev];
      next[existingIndex] = account;
      return next;
    });
  };

  const mapApiUserToAccount = (user: AuthApiUser, password: string): AuthAccount => ({
    id: user.id,
    fullName: user.full_name,
    username: user.username,
    email: user.email,
    password,
    provider: user.provider ?? undefined,
  });

  const extractApiError = async (response: Response) => {
    try {
      const body = await response.json();
      if (typeof body?.detail === 'string') {
        return body.detail;
      }
      if (typeof body?.message === 'string') {
        return body.message;
      }
    } catch (error) {}
    return 'Request failed. Please try again.';
  };

  const handleLogin = async (email: string, password: string): Promise<AuthActionResult> => {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const response = await apiFetch(`/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      if (!response.ok) {
        return {account: null, error: await extractApiError(response)};
      }

      const data = await response.json();
      const account = mapApiUserToAccount(data.user, password);
      upsertAccount(account);
      return {account, accessToken: data.access_token, refreshToken: data.refresh_token};
    } catch (error) {
      return {account: null, error: 'Unable to reach authentication service.'};
    }
  };

  const handleSignUp = async ({
    fullName,
    username,
    email,
    password,
    provider,
  }: Omit<AuthAccount, 'id'>): Promise<AuthActionResult> => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    try {
      const response = await apiFetch(`/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          username: normalizedUsername,
          email: normalizedEmail,
          password,
          provider: provider ?? null,
        }),
      });

      if (!response.ok) {
        return {account: null, error: await extractApiError(response)};
      }

      const data = await response.json();
      const account = mapApiUserToAccount(data.user, password);
      upsertAccount(account);
      return {account, accessToken: data.access_token, refreshToken: data.refresh_token};
    } catch (error) {
      return {account: null, error: 'Unable to reach sign-up service.'};
    }
  };

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
        <AuthenticationScreen
          onLoginSuccess={(account, tokens) => {
            if (tokens?.accessToken) {
              setAccessToken(tokens.accessToken);
            }
            if (tokens?.refreshToken) {
              setRefreshToken(tokens.refreshToken);
            }
            handleLoginSuccess(account);
          }}
          onLogin={handleLogin}
          onSignUp={handleSignUp}
          accounts={accounts}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent
        currentUser={activeUser}
        onLogout={() => {
          setAccessToken('');
          setRefreshToken('');
          setIsLoggedIn(false);
          setIsLoading(true);
        }}
      />
    </SafeAreaProvider>
  );
}

// Splash Screen with Animated Logo
function SplashScreen() {
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const enterAnimation = Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]);

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    );

    const progressLoop = Animated.loop(
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1450,
        easing: Easing.linear,
        useNativeDriver: USE_NATIVE_DRIVER,
      })
    );

    enterAnimation.start();
    pulseLoop.start();
    progressLoop.start();

    return () => {
      pulseLoop.stop();
      progressLoop.stop();
      enterAnimation.stop();
    };
  }, [cardOpacity, cardTranslateY, pulseAnim, progressAnim]);

  const progressTranslateX = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-140, 220],
  });

  return (
    <View style={styles.splashContainer}>
      <View style={styles.splashGlowTop} />
      <View style={styles.splashGlowBottom} />

      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: cardOpacity,
            transform: [{translateY: cardTranslateY}],
          },
        ]}>
        <Animated.View style={[styles.appLogoOrb, {transform: [{scale: pulseAnim}]}]}>
          <Text style={styles.appLogo}>U</Text>
        </Animated.View>
        <Text style={styles.appName}>UniHub</Text>
        <Text style={styles.appTagline}>Connect, shop, and trade in one place</Text>

        <View style={styles.splashLoadingRow}>
          <ActivityIndicator size="small" color="#f8fbff" />
          <Text style={styles.splashLoadingText}>Loading your home screen</Text>
        </View>

        <View style={styles.splashProgressTrack}>
          <Animated.View
            style={[styles.splashProgressBar, {transform: [{translateX: progressTranslateX}]}]}
          />
        </View>
      </Animated.View>
    </View>
  );
}

// Authentication Screen
function AuthenticationScreen({
  onLoginSuccess,
  onLogin,
  onSignUp,
  accounts,
}: {
  onLoginSuccess: (
    account: AuthAccount,
    tokens?: {accessToken?: string; refreshToken?: string}
  ) => void;
  onLogin: (email: string, password: string) => Promise<AuthActionResult>;
  onSignUp: (account: Omit<AuthAccount, 'id'>) => Promise<AuthActionResult>;
  accounts: AuthAccount[];
}) {
  const {width} = useWindowDimensions();
  const isNarrow = width < 390;
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hasAccount, setHasAccount] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [slideAnim]);

  const resetForm = () => {
    setFullName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);
  const isStrongPassword = (value: string) =>
    value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      Alert.alert('Missing fields', 'Enter both email and password.');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }

    const result = await onLogin(normalizedEmail, password);
    if (!result.account) {
      Alert.alert('Sign in failed', result.error ?? 'Unable to sign in right now.');
      return;
    }

    Alert.alert('Welcome back', `Signed in as ${result.account.fullName}`);
    onLoginSuccess(result.account, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  };

  const handleSignUpSubmit = async () => {
    const normalizedFullName = fullName.trim();
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedFullName || !normalizedUsername || !normalizedEmail || !password || !confirmPassword) {
      Alert.alert('Missing fields', 'Complete all sign-up fields.');
      return;
    }

    if (normalizedFullName.length < 2) {
      Alert.alert('Invalid name', 'Full name must be at least 2 characters.');
      return;
    }

    if (!/^[a-z0-9._]{3,20}$/.test(normalizedUsername)) {
      Alert.alert('Invalid username', 'Use 3-20 characters: lowercase letters, numbers, dot, underscore.');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }

    if (!isStrongPassword(password)) {
      Alert.alert('Weak password', 'Password must be 8+ characters and include letters and numbers.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }

    const emailTaken = accounts.some(account => account.email.toLowerCase() === normalizedEmail);
    const usernameTaken = accounts.some(account => account.username.toLowerCase() === normalizedUsername);

    if (emailTaken) {
      Alert.alert('Email already used', 'Try signing in or use another email.');
      return;
    }

    if (usernameTaken) {
      Alert.alert('Username unavailable', 'Choose a different username.');
      return;
    }

    const result = await onSignUp({
      fullName: normalizedFullName,
      username: normalizedUsername,
      email: normalizedEmail,
      password,
    });

    if (!result.account) {
      Alert.alert('Sign up failed', result.error ?? 'Unable to create account right now.');
      return;
    }

    Alert.alert('Account created', 'Your UniHub account is ready.');
    onLoginSuccess(result.account, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  };

  const handleForgotPassword = () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      Alert.alert('Email required', 'Enter your email first to reset password.');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }

    const matchedAccount = accounts.find(
      account => account.email.toLowerCase() === normalizedEmail
    );

    if (!matchedAccount) {
      Alert.alert('Account not found', 'No account exists for this email.');
      return;
    }

    Alert.alert(
      'Reset email sent',
      `A password reset link was sent to ${normalizedEmail}.`
    );
  };

  const handleSocialLogin = async (provider: string) => {
    const providerSlug = provider.toLowerCase();
    const socialEmail = `${providerSlug}@social.unihub.app`;
    const existingAccount = accounts.find(
      account => account.email.toLowerCase() === socialEmail
    );

    if (existingAccount) {
      Alert.alert('Signed in', `Connected with ${provider}.`);
      onLoginSuccess(existingAccount);
      return;
    }

    const result = await onSignUp({
      fullName: `${provider} User`,
      username: `${providerSlug}_user`,
      email: socialEmail,
      password: `social_${providerSlug}`,
      provider,
    });

    if (!result.account) {
      Alert.alert('Sign in failed', result.error ?? `Unable to connect with ${provider}.`);
      return;
    }

    Alert.alert('Signed in', `New ${provider} account linked successfully.`);
    onLoginSuccess(result.account, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    if (hasAccount) {
      await handleLogin();
    } else {
      await handleSignUpSubmit();
    }

    setIsSubmitting(false);
  };

  return (
    <ScrollView
      style={styles.authContainer}
      contentContainerStyle={styles.authScrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.authGlowTop} />
      <View style={styles.authGlowBottom} />

      <Animated.View
        style={[
          styles.authContent,
          isNarrow && styles.authContentCompact,
          {
            transform: [{translateY: slideAnim}],
          },
        ]}>
        {/* Header */}
        <View style={styles.authHeader}>
          <View style={styles.authBrandPill}>
            <Text style={styles.authBrandPillText}>UniHub</Text>
          </View>
          <Text style={[styles.authTitle, isNarrow && styles.authTitleCompact]}>UniHub</Text>
          <Text style={styles.authSubtitle}>
            {hasAccount ? 'Welcome back to your digital hub' : 'Create your all-in-one account'}
          </Text>
        </View>

        <View style={styles.authForm}>
          {!hasAccount && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.authInput}
                  placeholder="Enter your full name"
                  placeholderTextColor="#94a3b8"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.authInput}
                  placeholder="e.g. alex_lee"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={username}
                  onChangeText={setUsername}
                />
              </View>
            </>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.authInput}
              placeholder="name@example.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.authInputWrapper}>
              <TextInput
                style={styles.authInputField}
                placeholder="Enter your password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(prev => !prev)}>
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#bfdbfe"
                />
              </TouchableOpacity>
            </View>
          </View>

          {!hasAccount && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.authInputWrapper}>
                <TextInput
                  style={styles.authInputField}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword(prev => !prev)}>
                  <MaterialCommunityIcons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#bfdbfe"
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {hasAccount && (
            <TouchableOpacity style={styles.forgotPasswordButton} onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.authSubmitButton, isSubmitting && styles.authSubmitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}>
            <Text style={styles.authSubmitText}>
              {isSubmitting ? 'Please wait...' : hasAccount ? 'Sign In' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Social Login */}
        <View style={styles.socialLoginContainer}>
          <Text style={styles.dividerText}>Or continue with</Text>
          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={[styles.socialButton, isNarrow && styles.socialButtonFull, styles.googleButton]}
              onPress={() => handleSocialLogin('Google')}>
              <MaterialCommunityIcons name="google" size={16} color="#e2e8f0" style={styles.socialIcon} />
              <Text style={styles.socialLabel}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialButton, isNarrow && styles.socialButtonFull, styles.facebookButton]}
              onPress={() => handleSocialLogin('Facebook')}>
              <MaterialCommunityIcons name="facebook" size={16} color="#e2e8f0" style={styles.socialIcon} />
              <Text style={styles.socialLabel}>Facebook</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialButton, isNarrow && styles.socialButtonFull, styles.telegramButton]}
              onPress={() => handleSocialLogin('Telegram')}>
              <MaterialCommunityIcons name="send" size={16} color="#e2e8f0" style={styles.socialIcon} />
              <Text style={styles.socialLabel}>Telegram</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialButton, isNarrow && styles.socialButtonFull, styles.vkButton]}
              onPress={() => handleSocialLogin('VK')}>
              <MaterialCommunityIcons name="alpha-v-circle" size={16} color="#e2e8f0" style={styles.socialIcon} />
              <Text style={styles.socialLabel}>VK</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialButton, isNarrow && styles.socialButtonFull, styles.appleButton]}
              onPress={() => handleSocialLogin('Apple')}>
              <MaterialCommunityIcons name="apple" size={16} color="#e2e8f0" style={styles.socialIcon} />
              <Text style={styles.socialLabel}>Apple</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Toggle Sign In/Up */}
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleText}>
            {hasAccount ? "Don't have an account? " : 'Already have an account? '}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setHasAccount(prev => !prev);
              resetForm();
            }}>
            <Text style={styles.toggleLink}>{hasAccount ? 'Sign Up' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

function AppContent({currentUser, onLogout}: {currentUser: User; onLogout: () => void}) {
  const {width} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compactNav = width < 360;
  const [currentScreen, setCurrentScreen] = useState<Screen>('feed');
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: USE_NATIVE_DRIVER,
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
      <View
        style={[
          styles.bottomNav,
          compactNav && styles.bottomNavCompact,
          {
            bottom: Platform.OS === 'web' ? 10 : Math.max(10, insets.bottom + 6),
          },
        ]}>
        <TouchableOpacity
          style={[styles.navButton, currentScreen === 'feed' && styles.navActive]}
          onPress={() => setCurrentScreen('feed')}>
          <MaterialCommunityIcons
            name="home-variant-outline"
            size={20}
            color={currentScreen === 'feed' ? '#2563eb' : '#64748b'}
          />
          <Text numberOfLines={1} style={[currentScreen === 'feed' ? styles.navTextActive : styles.navText, compactNav && styles.navTextCompact]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, currentScreen === 'stocks' && styles.navActive]}
          onPress={() => setCurrentScreen('stocks')}>
          <MaterialCommunityIcons
            name="chart-line"
            size={20}
            color={currentScreen === 'stocks' ? '#2563eb' : '#64748b'}
          />
          <Text numberOfLines={1} style={[currentScreen === 'stocks' ? styles.navTextActive : styles.navText, compactNav && styles.navTextCompact]}>Market</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, currentScreen === 'shop' && styles.navActive]}
          onPress={() => setCurrentScreen('shop')}>
          <MaterialCommunityIcons
            name="shopping-outline"
            size={20}
            color={currentScreen === 'shop' ? '#2563eb' : '#64748b'}
          />
          <Text numberOfLines={1} style={[currentScreen === 'shop' ? styles.navTextActive : styles.navText, compactNav && styles.navTextCompact]}>Shop</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, currentScreen === 'chat' && styles.navActive]}
          onPress={() => setCurrentScreen('chat')}>
          <MaterialCommunityIcons
            name="message-text-outline"
            size={20}
            color={currentScreen === 'chat' ? '#2563eb' : '#64748b'}
          />
          <Text numberOfLines={1} style={[currentScreen === 'chat' ? styles.navTextActive : styles.navText, compactNav && styles.navTextCompact]}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, currentScreen === 'profile' && styles.navActive]}
          onPress={() => setCurrentScreen('profile')}>
          <MaterialCommunityIcons
            name="account-circle-outline"
            size={20}
            color={currentScreen === 'profile' ? '#2563eb' : '#64748b'}
          />
          <Text numberOfLines={1} style={[currentScreen === 'profile' ? styles.navTextActive : styles.navText, compactNav && styles.navTextCompact]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Feed Screen (Instagram/Threads style)
function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newsItems, setNewsItems] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('For you');
  const [commentDrafts, setCommentDrafts] = useState<{[postId: number]: string}>({});
  const [localComments, setLocalComments] = useState<{[postId: number]: string[]}>({});
  const [shareCounts, setShareCounts] = useState<{[postId: number]: number}>({});
  const [savedPosts, setSavedPosts] = useState<{[postId: number]: boolean}>({});
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [viewCounts, setViewCounts] = useState<{[postId: number]: number}>({});

  useEffect(() => {
    fetchFeed();
    fetchNews();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setPosts(prev =>
        prev.map(post => ({
          ...post,
          likes: post.likes + (Math.random() > 0.72 ? 1 : 0),
        }))
      );
    }, 7000);

    return () => clearInterval(timer);
  }, []);

  const fetchFeed = async () => {
    try {
      const response = await apiFetch(`/feed`);
      const data = await response.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNews = async () => {
    try {
      const response = await apiFetch(`/external/news?query=finance`);
      const data = await response.json();
      setNewsItems(Array.isArray(data?.items) ? data.items.slice(0, 5) : []);
    } catch {
      setNewsItems([]);
    }
  };

  const likePost = async (postId: number) => {
    try {
      const response = await apiFetch(`/posts/${postId}/like`, {method: 'POST'});
      const data = await response.json();
      setPosts(posts.map(p => p.id === postId ? {...p, likes: data.likes} : p));
    } catch {
      setPosts(prev => prev.map(p => p.id === postId ? {...p, likes: p.likes + 1} : p));
    }
  };

  const formatCount = (count: number) =>
    count >= 1000 ? `${(count / 1000).toFixed(1).replace('.0', '')}k` : `${count}`;

  const handleComment = async (postId: number) => {
    const draft = commentDrafts[postId]?.trim();
    if (!draft) {
      Alert.alert('Comment required', 'Type a comment first.');
      return;
    }
    try {
      const response = await apiFetch(`/posts/${postId}/comment`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({content: draft}),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        Alert.alert('Comment failed', data?.error || data?.detail || 'Unable to post comment.');
        return;
      }
      setLocalComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), draft],
      }));
      setPosts(prev => prev.map(p => p.id === postId ? {...p, comments: data.comments_count ?? p.comments + 1} : p));
      setCommentDrafts(prev => ({...prev, [postId]: ''}));
    } catch {
      Alert.alert('Comment failed', 'Unable to post comment right now.');
    }
  };

  const handleShare = (postId: number, username: string) => {
    setShareCounts(prev => ({...prev, [postId]: (prev[postId] || 0) + 1}));
    Alert.alert('Link ready', `${username}'s post link copied.`);
  };

  const toggleSaved = (postId: number) => {
    setSavedPosts(prev => ({...prev, [postId]: !prev[postId]}));
  };

  const openPostDetails = (postId: number) => {
    setSelectedPostId(postId);
    setViewCounts(prev => ({...prev, [postId]: (prev[postId] || 0) + 1}));
  };

  const displayedPosts = posts.filter(post => {
    if (activeFilter === 'For you') return true;
    if (activeFilter === 'Trending') return post.likes >= 100;
    if (activeFilter === 'Following') return post.user_id !== ACTIVE_USER_ID;
    if (activeFilter === 'Finance') {
      const text = `${post.content} ${post.username}`.toLowerCase();
      return ['market', 'stock', 'crypto', 'trade', 'finance'].some(keyword => text.includes(keyword));
    }
    return true;
  });
  const selectedPost = displayedPosts.find(post => post.id === selectedPostId) || null;

  return (
    <ScrollView style={styles.screenContainer} contentContainerStyle={styles.feedContent}>
      <View style={styles.feedHero}>
        <View>
          <Text style={styles.feedKicker}>Discover</Text>
          <Text style={styles.feedTitle}>Your Daily Feed</Text>
          <Text style={styles.feedSubtitle}>Curated social updates from your communities</Text>
        </View>
        <View style={styles.feedHeroIcon}>
          <MaterialCommunityIcons name="compass-outline" size={22} color="#f8fbff" />
        </View>
      </View>

      {newsItems.length > 0 && (
        <View style={styles.newsStrip}>
          <View style={styles.newsStripHeader}>
            <Text style={styles.newsStripTitle}>Live Headlines</Text>
            <MaterialCommunityIcons name="newspaper-variant-outline" size={16} color="#334155" />
          </View>
          {newsItems.slice(0, 3).map((item, idx) => (
            <Text key={`${item.title}-${idx}`} style={styles.newsItemText} numberOfLines={2}>
              • {item.title}
            </Text>
          ))}
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.feedFilterRow}>
        {['For you', 'Trending', 'Following', 'Finance'].map(filter => (
          <TouchableOpacity
            key={filter}
            style={[styles.feedFilterChip, activeFilter === filter && styles.feedFilterChipActive]}
            onPress={() => setActiveFilter(filter)}>
            <Text style={[styles.feedFilterText, activeFilter === filter && styles.feedFilterTextActive]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.feedListHeader}>
        <Text style={styles.feedListTitle}>Latest Posts</Text>
        <Text style={styles.feedListMeta}>{displayedPosts.length} items</Text>
      </View>

      {selectedPost && (
        <View style={styles.feedDetailCard}>
          <View style={styles.feedDetailHeader}>
            <Text style={styles.feedDetailTitle}>Post Detail</Text>
            <TouchableOpacity onPress={() => setSelectedPostId(null)}>
              <MaterialCommunityIcons name="close" size={16} color="#64748b" />
            </TouchableOpacity>
          </View>
          <Text style={styles.feedDetailUser}>@{selectedPost.username}</Text>
          <Text style={styles.feedDetailContent}>{selectedPost.content}</Text>
          <Text style={styles.feedDetailMeta}>
            Views {viewCounts[selectedPost.id] || 0} | Comments {selectedPost.comments}
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.feedLoading}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      ) : displayedPosts.length === 0 ? (
        <View style={styles.feedEmptyCard}>
          <MaterialCommunityIcons name="post-outline" size={28} color="#94a3b8" />
          <Text style={styles.feedEmptyTitle}>No posts match this filter</Text>
          <Text style={styles.feedEmptyText}>Try another feed tab.</Text>
        </View>
      ) : (
        displayedPosts.map(post => (
          <View key={post.id} style={styles.postCard}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <Image source={{uri: post.avatar}} style={styles.postAvatar} />
              <View style={styles.postHeaderInfo}>
                <Text style={styles.postUsername}>{post.username}</Text>
                <Text style={styles.postTime}>{post.timestamp}</Text>
              </View>
              <TouchableOpacity style={styles.postMenuButton} onPress={() => toggleSaved(post.id)}>
                <MaterialCommunityIcons
                  name={savedPosts[post.id] ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color={savedPosts[post.id] ? '#2563eb' : '#64748b'}
                />
              </TouchableOpacity>
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
                <MaterialCommunityIcons name="heart-outline" size={16} color="#334155" style={styles.actionIcon} />
                <Text style={styles.actionText}>{formatCount(post.likes)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleComment(post.id)}>
                <MaterialCommunityIcons name="comment-outline" size={16} color="#334155" style={styles.actionIcon} />
                <Text style={styles.actionText}>{formatCount(post.comments)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(post.id, post.username)}>
                <MaterialCommunityIcons
                  name="share-variant-outline"
                  size={16}
                  color="#334155"
                  style={styles.actionIcon}
                />
                <Text style={styles.actionText}>Share {formatCount(shareCounts[post.id] || 0)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => openPostDetails(post.id)}>
                <MaterialCommunityIcons name="eye-outline" size={16} color="#334155" style={styles.actionIcon} />
                <Text style={styles.actionText}>Open</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.commentComposer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                placeholderTextColor="#94a3b8"
                value={commentDrafts[post.id] || ''}
                onChangeText={text => setCommentDrafts(prev => ({...prev, [post.id]: text}))}
              />
              <TouchableOpacity style={styles.commentSendButton} onPress={() => handleComment(post.id)}>
                <MaterialCommunityIcons name="send" size={14} color="#fff" />
              </TouchableOpacity>
            </View>

            {(localComments[post.id] || []).slice(-2).map((comment, idx) => (
              <Text key={`${post.id}-${idx}`} style={styles.commentPreviewText}>
                {comment}
              </Text>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

// Chat Screen (WhatsApp style)
function ChatScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatQuery, setChatQuery] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [chatDraft, setChatDraft] = useState('');

  useEffect(() => {
    fetchChatData();
  }, []);

  const fetchChatData = async () => {
    try {
      const [conversationResponse, messagesResponse] = await Promise.all([
        apiFetch(`/conversations`),
        apiFetch(`/messages/${ACTIVE_USER_ID}`),
      ]);
      const conversationData = await conversationResponse.json();
      const messagesData = await messagesResponse.json();
      setConversations(Array.isArray(conversationData) ? conversationData : []);
      setMessages(Array.isArray(messagesData) ? messagesData : []);
    } catch {
      setConversations([]);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesQuery = conv.user.name.toLowerCase().includes(chatQuery.toLowerCase())
      || conv.last_message.toLowerCase().includes(chatQuery.toLowerCase());
    const matchesUnread = showUnreadOnly ? conv.unread : true;
    return matchesQuery && matchesUnread;
  });

  const openConversation = (conversation: Conversation) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.user_id === conversation.user_id ? {...conv, unread: false} : conv
      )
    );
    setActiveConversation({...conversation, unread: false});
  };

  const sendMessage = async () => {
    if (!activeConversation) {
      return;
    }

    const text = chatDraft.trim();
    if (!text) {
      return;
    }

    try {
      const response = await apiFetch(`/messages`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          receiver_id: activeConversation.user_id,
          content: text,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        Alert.alert('Send failed', data?.error || data?.detail || 'Unable to send message.');
        return;
      }
      setChatDraft('');
      await fetchChatData();
    } catch {
      Alert.alert('Connection error', 'Unable to send message right now.');
    }
  };

  const threadMessages = activeConversation
    ? messages.filter((message: any) =>
        (message.sender_id === ACTIVE_USER_ID && message.receiver_id === activeConversation.user_id) ||
        (message.sender_id === activeConversation.user_id && message.receiver_id === ACTIVE_USER_ID)
      )
    : [];

  return (
    <ScrollView style={styles.screenContainer} contentContainerStyle={styles.chatContent}>
      <View style={styles.chatHero}>
        <View>
          <Text style={styles.chatHeroKicker}>Messages</Text>
          <Text style={styles.chatHeroTitle}>Stay Connected</Text>
          <Text style={styles.chatHeroSubtitle}>Quickly reach your friends and communities</Text>
        </View>
        <View style={styles.chatHeroIcon}>
          <MaterialCommunityIcons name="message-badge-outline" size={20} color="#f8fbff" />
        </View>
      </View>

      <View style={styles.chatControlRow}>
        <View style={styles.chatSearchBox}>
          <MaterialCommunityIcons name="magnify" size={16} color="#94a3b8" />
          <TextInput
            style={styles.chatSearchInput}
            placeholder="Search chats"
            placeholderTextColor="#94a3b8"
            value={chatQuery}
            onChangeText={setChatQuery}
          />
        </View>
        <TouchableOpacity
          style={[styles.chatUnreadChip, showUnreadOnly && styles.chatUnreadChipActive]}
          onPress={() => setShowUnreadOnly(prev => !prev)}>
          <Text style={[styles.chatUnreadText, showUnreadOnly && styles.chatUnreadTextActive]}>
            Unread
          </Text>
        </TouchableOpacity>
      </View>

      {activeConversation && (
        <View style={styles.chatThreadCard}>
          <View style={styles.chatThreadHeader}>
            <View style={styles.chatThreadUser}>
              <Image source={{uri: activeConversation.user.avatar}} style={styles.chatThreadAvatar} />
              <View>
                <Text style={styles.chatThreadName}>{activeConversation.user?.name || activeConversation.user?.username || `User ${activeConversation.user_id}`}</Text>
                <Text style={styles.chatThreadMeta}>online now</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.chatThreadClose} onPress={() => setActiveConversation(null)}>
              <MaterialCommunityIcons name="close" size={16} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.chatThreadMessages}>
            {threadMessages.map((message: any) => (
              <View
                key={message.id}
                style={[
                  styles.chatBubble,
                  message.sender_id === ACTIVE_USER_ID ? styles.chatBubbleMine : styles.chatBubbleTheirs,
                ]}>
                <Text
                  style={[
                    styles.chatBubbleText,
                    message.sender_id === ACTIVE_USER_ID ? styles.chatBubbleTextMine : styles.chatBubbleTextTheirs,
                  ]}>
                  {message.content}
                </Text>
                <Text style={styles.chatBubbleTime}>{message.timestamp}</Text>
              </View>
            ))}
          </View>

          <View style={styles.chatComposerRow}>
            <TextInput
              style={styles.chatComposerInput}
              placeholder="Type your message"
              placeholderTextColor="#94a3b8"
              value={chatDraft}
              onChangeText={setChatDraft}
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity style={styles.chatComposerSend} onPress={sendMessage}>
              <MaterialCommunityIcons name="send" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.feedLoading}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : filteredConversations.length === 0 ? (
        <View style={styles.feedEmptyCard}>
          <MaterialCommunityIcons name="chat-processing-outline" size={26} color="#94a3b8" />
          <Text style={styles.feedEmptyTitle}>No matching conversations</Text>
          <Text style={styles.feedEmptyText}>Try a different search or filter.</Text>
        </View>
      ) : (
        filteredConversations.map(conv => (
          <TouchableOpacity key={conv.user_id} style={styles.chatItem} onPress={() => openConversation(conv)}>
            <Image source={{uri: conv.user?.avatar || 'https://ui-avatars.com/api/?name=User&background=94a3b8&color=ffffff'}} style={styles.chatAvatar} />
            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>{conv.user?.name || conv.user?.username || `User ${conv.user_id}`}</Text>
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
      const response = await apiFetch(`/stories`);
      const data = await response.json();
      setStories(Array.isArray(data) ? data : []);
    } catch {
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStory = async () => {
    const image = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800';
    try {
      const response = await apiFetch(`/stories`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({image}),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        Alert.alert('Story failed', data?.error || data?.detail || 'Unable to publish story.');
        return;
      }
      Alert.alert('Story Added', 'Your story is now live.');
      fetchStories();
    } catch {
      Alert.alert('Story failed', 'Unable to publish story right now.');
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

      <TouchableOpacity style={styles.addStoryButton} onPress={handleAddStory}>
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
  const [chartLoading, setChartLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'market' | 'portfolio'>('market');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [chartRange, setChartRange] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1M');
  const [chartPayload, setChartPayload] = useState<StockChartPayload | null>(null);
  const [trendDrawMode, setTrendDrawMode] = useState(false);
  const [trendDraftStart, setTrendDraftStart] = useState<number | null>(null);
  const [trendLines, setTrendLines] = useState<TrendLine[]>([]);
  const [tradeQuantity, setTradeQuantity] = useState('1');
  const [marketQuery, setMarketQuery] = useState('');
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
  const [watchlist, setWatchlist] = useState<{[symbol: string]: boolean}>({});

  useEffect(() => {
    fetchStocks();
    fetchPortfolio();
  }, []);

  useEffect(() => {
    if (!selectedStock) {
      setChartPayload(null);
      setTrendLines([]);
      setTrendDraftStart(null);
      return;
    }
    setTrendLines([]);
    setTrendDraftStart(null);
    fetchStockChart(selectedStock.symbol, chartRange);
  }, [selectedStock, chartRange]);

  const fetchStocks = async () => {
    try {
      const response = await apiFetch(`/stocks`);
      const data = await response.json();
      setStocks(Array.isArray(data) ? data : []);
    } catch {
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const response = await apiFetch(`/portfolio/${ACTIVE_USER_ID}`);
      const data = await response.json();
      setPortfolio(data && Object.keys(data).length > 0 ? data : null);
    } catch {
      setPortfolio(null);
    }
  };

  const fetchStockChart = async (symbol: string, rangeKey: '1D' | '1W' | '1M' | '3M' | '1Y') => {
    const map: Record<typeof rangeKey, {range: string; interval: string}> = {
      '1D': {range: '1d', interval: '5m'},
      '1W': {range: '5d', interval: '30m'},
      '1M': {range: '1mo', interval: '1d'},
      '3M': {range: '3mo', interval: '1d'},
      '1Y': {range: '1y', interval: '1wk'},
    };
    const picked = map[rangeKey];

    setChartLoading(true);
    try {
      const response = await apiFetch(
        `/stocks/symbol/${encodeURIComponent(symbol)}/chart?range=${picked.range}&interval=${picked.interval}`
      );
      const data = await response.json();
      if (!response.ok || !Array.isArray(data?.candles)) {
        setChartPayload(null);
        return;
      }
      setChartPayload(data as StockChartPayload);
    } catch {
      setChartPayload(null);
    } finally {
      setChartLoading(false);
    }
  };

  const toggleWatchlist = (symbol: string) => {
    setWatchlist(prev => ({...prev, [symbol]: !prev[symbol]}));
  };

  const executeTrade = async (side: 'buy' | 'sell') => {
    if (!selectedStock) {
      Alert.alert('Select stock', 'Choose a stock first.');
      return;
    }

    const quantity = parseFloat(tradeQuantity);
    if (!quantity || quantity <= 0) {
      Alert.alert('Invalid quantity', 'Enter a valid number of shares.');
      return;
    }

    try {
      const response = await apiFetch(`/trade/${side}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          user_id: ACTIVE_USER_ID,
          symbol: selectedStock.symbol,
          quantity,
          price: selectedStock.price,
          asset_type: 'stock',
        }),
      });
      const data = await response.json();

      if (data.success) {
        Alert.alert('Trade successful', `${side.toUpperCase()} ${quantity} ${selectedStock.symbol}`);
        fetchPortfolio();
        setTradeQuantity('1');
      } else {
        Alert.alert('Trade failed', data.message || 'Unable to place trade.');
      }
    } catch {
      Alert.alert('Trade failed', 'Unable to place trade right now.');
    }
  };

  const visibleStocks = stocks.filter(stock => {
    const text = `${stock.symbol} ${stock.name}`.toLowerCase();
    const matchesQuery = text.includes(marketQuery.toLowerCase());
    const matchesWatchlist = showWatchlistOnly ? !!watchlist[stock.symbol] : true;
    return matchesQuery && matchesWatchlist;
  });
  const tradeValue = selectedStock ? selectedStock.price * (parseFloat(tradeQuantity) || 0) : 0;
  const candles = chartPayload?.candles || [];
  const lows = candles.map(candle => candle.l);
  const highs = candles.map(candle => candle.h);
  const volumes = candles.map(candle => candle.v || 0);
  const minLow = lows.length > 0 ? Math.min(...lows) : 0;
  const maxHigh = highs.length > 0 ? Math.max(...highs) : 1;
  const priceSpan = Math.max(0.0001, maxHigh - minLow);
  const maxVolume = volumes.length > 0 ? Math.max(...volumes) : 1;
  const latestRsi = chartPayload?.indicators?.rsi14?.filter(v => typeof v === 'number').slice(-1)[0] as number | undefined;
  const latestSma = chartPayload?.indicators?.sma20?.filter(v => typeof v === 'number').slice(-1)[0] as number | undefined;
  const latestEma = chartPayload?.indicators?.ema20?.filter(v => typeof v === 'number').slice(-1)[0] as number | undefined;
  const recentCandles = candles.slice(-Math.min(20, candles.length));
  const supportLevel = recentCandles.length > 0 ? Math.min(...recentCandles.map(c => c.l)) : undefined;
  const resistanceLevel = recentCandles.length > 0 ? Math.max(...recentCandles.map(c => c.h)) : undefined;
  const candleStep = 14;
  const chartHeight = 120;

  const handleCandleSelectForTrend = (idx: number) => {
    if (!trendDrawMode || !candles[idx]) {
      return;
    }

    if (trendDraftStart === null) {
      setTrendDraftStart(idx);
      return;
    }

    if (trendDraftStart === idx) {
      return;
    }

    const startIdx = Math.min(trendDraftStart, idx);
    const endIdx = Math.max(trendDraftStart, idx);
    const startPrice = candles[startIdx].c;
    const endPrice = candles[endIdx].c;
    const slope = (endPrice - startPrice) / (endIdx - startIdx);
    const palette = ['#22c55e', '#f59e0b', '#0ea5e9', '#a855f7', '#ef4444'];
    const color = palette[trendLines.length % palette.length];

    setTrendLines(prev => [
      ...prev,
      {
        id: Date.now(),
        startIdx,
        endIdx,
        startPrice,
        endPrice,
        slope,
        color,
      },
    ]);
    setTrendDraftStart(null);
  };

  return (
    <ScrollView style={styles.screenContainer} contentContainerStyle={styles.marketContent}>
      <View style={styles.marketHero}>
        <View>
          <Text style={styles.marketHeroKicker}>Market</Text>
          <Text style={styles.marketHeroTitle}>Trade Smarter</Text>
          <Text style={styles.marketHeroSubtitle}>Monitor stocks and your portfolio in one place</Text>
        </View>
        <View style={styles.marketHeroIcon}>
          <MaterialCommunityIcons name="finance" size={22} color="#f8fbff" />
        </View>
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

      {activeTab === 'market' && (
        <View style={styles.marketControlRow}>
          <View style={styles.marketSearchBox}>
            <MaterialCommunityIcons name="magnify" size={16} color="#94a3b8" />
            <TextInput
              style={styles.marketSearchInput}
              placeholder="Search symbol or company"
              placeholderTextColor="#94a3b8"
              value={marketQuery}
              onChangeText={setMarketQuery}
            />
          </View>
          <TouchableOpacity
            style={[styles.marketWatchlistChip, showWatchlistOnly && styles.marketWatchlistChipActive]}
            onPress={() => setShowWatchlistOnly(prev => !prev)}>
            <Text style={[styles.marketWatchlistText, showWatchlistOnly && styles.marketWatchlistTextActive]}>
              Watchlist
            </Text>
          </TouchableOpacity>
        </View>
      )}

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
          {selectedStock && (
            <View style={styles.tradePanel}>
              <View style={styles.tradePanelHeader}>
                <Text style={styles.tradePanelTitle}>Trade {selectedStock.symbol}</Text>
                <Text style={styles.tradePanelPrice}>${selectedStock.price.toFixed(2)}</Text>
              </View>
              <View style={styles.chartRangeRow}>
                {(['1D', '1W', '1M', '3M', '1Y'] as const).map(range => (
                  <TouchableOpacity
                    key={range}
                    style={[styles.chartRangeChip, chartRange === range && styles.chartRangeChipActive]}
                    onPress={() => setChartRange(range)}>
                    <Text style={[styles.chartRangeText, chartRange === range && styles.chartRangeTextActive]}>{range}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {chartLoading ? (
                <Text style={styles.chartHintText}>Loading live chart...</Text>
              ) : candles.length === 0 ? (
                <Text style={styles.chartHintText}>No chart data available for this range.</Text>
              ) : (
                <>
                  <View style={styles.analysisControlRow}>
                    <TouchableOpacity
                      style={[styles.analysisToggleChip, trendDrawMode && styles.analysisToggleChipActive]}
                      onPress={() => {
                        setTrendDrawMode(prev => !prev);
                        setTrendDraftStart(null);
                      }}>
                      <Text style={[styles.analysisToggleText, trendDrawMode && styles.analysisToggleTextActive]}>
                        {trendDrawMode ? 'Trend Draw On' : 'Trend Draw Off'}
                      </Text>
                    </TouchableOpacity>
                    {trendDraftStart !== null && (
                      <Text style={styles.chartHintText}>Select second candle point...</Text>
                    )}
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.candleRow}>
                    <View style={[styles.candlePlot, {width: candles.length * candleStep}]}>
                      {candles.map((candle, idx) => {
                        const highBottom = ((candle.h - minLow) / priceSpan) * 100;
                        const lowBottom = ((candle.l - minLow) / priceSpan) * 100;
                        const openBottom = ((candle.o - minLow) / priceSpan) * 100;
                        const closeBottom = ((candle.c - minLow) / priceSpan) * 100;
                        const wickHeight = Math.max(2, Math.abs(highBottom - lowBottom));
                        const bodyBottom = Math.min(openBottom, closeBottom);
                        const bodyHeight = Math.max(2, Math.abs(openBottom - closeBottom));
                        const up = candle.c >= candle.o;
                        const volumeHeight = maxVolume > 0 ? Math.max(4, (candle.v / maxVolume) * 40) : 4;
                        return (
                          <TouchableOpacity
                            key={`${candle.t}-${idx}`}
                            activeOpacity={0.85}
                            style={styles.candleContainer}
                            onPress={() => handleCandleSelectForTrend(idx)}>
                            <View style={styles.candleCanvas}>
                              <View
                                style={[
                                  styles.candleWick,
                                  {
                                    bottom: lowBottom,
                                    height: wickHeight,
                                    backgroundColor: up ? '#22c55e' : '#ef4444',
                                  },
                                ]}
                              />
                              <View
                                style={[
                                  styles.candleBody,
                                  {
                                    bottom: bodyBottom,
                                    height: bodyHeight,
                                    backgroundColor: up ? '#22c55e' : '#ef4444',
                                  },
                                ]}
                              />
                            </View>
                            <View style={[styles.volumeBar, {height: volumeHeight}]} />
                          </TouchableOpacity>
                        );
                      })}
                      <View style={styles.trendOverlay} pointerEvents="none">
                        {trendLines.map(line => {
                          const x1 = line.startIdx * candleStep + 5;
                          const x2 = line.endIdx * candleStep + 5;
                          const y1 = chartHeight - ((line.startPrice - minLow) / priceSpan) * chartHeight;
                          const y2 = chartHeight - ((line.endPrice - minLow) / priceSpan) * chartHeight;
                          const dx = x2 - x1;
                          const dy = y2 - y1;
                          const length = Math.sqrt(dx * dx + dy * dy);
                          const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
                          return (
                            <View
                              key={line.id}
                              style={[
                                styles.trendLine,
                                {
                                  left: x1,
                                  top: y1,
                                  width: length,
                                  backgroundColor: line.color,
                                  transform: [{rotateZ: `${angle}deg`}],
                                },
                              ]}
                            />
                          );
                        })}
                      </View>
                    </View>
                  </ScrollView>
                  <View style={styles.indicatorRow}>
                    <Text style={styles.indicatorText}>
                      SMA20 {typeof latestSma === 'number' ? latestSma.toFixed(2) : '-'}
                    </Text>
                    <Text style={styles.indicatorText}>
                      EMA20 {typeof latestEma === 'number' ? latestEma.toFixed(2) : '-'}
                    </Text>
                    <Text style={styles.indicatorText}>
                      RSI14 {typeof latestRsi === 'number' ? latestRsi.toFixed(1) : '-'}
                    </Text>
                  </View>
                  <View style={styles.indicatorRow}>
                    <Text style={styles.indicatorText}>
                      Support {typeof supportLevel === 'number' ? supportLevel.toFixed(2) : '-'}
                    </Text>
                    <Text style={styles.indicatorText}>
                      Resistance {typeof resistanceLevel === 'number' ? resistanceLevel.toFixed(2) : '-'}
                    </Text>
                  </View>
                  {trendLines.length > 0 && (
                    <View style={styles.trendList}>
                      {trendLines.slice(-3).map((line, idx) => (
                        <Text key={line.id} style={styles.trendListText}>
                          L{idx + 1} slope {line.slope.toFixed(3)} | {line.startPrice.toFixed(2)} {'->'} {line.endPrice.toFixed(2)}
                        </Text>
                      ))}
                    </View>
                  )}
                </>
              )}
              <TextInput
                style={styles.tradeQuantityInput}
                value={tradeQuantity}
                onChangeText={setTradeQuantity}
                keyboardType="decimal-pad"
                placeholder="Shares"
                placeholderTextColor="#94a3b8"
              />
              <Text style={styles.tradeEstimate}>Estimated Value: ${tradeValue.toFixed(2)}</Text>
              <View style={styles.tradeQuickRow}>
                {[1, 5, 10].map(qty => (
                  <TouchableOpacity key={qty} style={styles.tradeQuickChip} onPress={() => setTradeQuantity(String(qty))}>
                    <Text style={styles.tradeQuickText}>{qty}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.tradeButtonRow}>
                <TouchableOpacity style={[styles.tradeButton, styles.tradeBuyButton]} onPress={() => executeTrade('buy')}>
                  <Text style={styles.tradeButtonText}>Buy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tradeButton, styles.tradeSellButton]} onPress={() => executeTrade('sell')}>
                  <Text style={styles.tradeButtonText}>Sell</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {loading ? (
            <View style={styles.feedLoading}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.loadingText}>Loading stocks...</Text>
            </View>
          ) : visibleStocks.length === 0 ? (
            <View style={styles.feedEmptyCard}>
              <MaterialCommunityIcons name="chart-line-variant" size={26} color="#94a3b8" />
              <Text style={styles.feedEmptyTitle}>No stocks found</Text>
              <Text style={styles.feedEmptyText}>Adjust search or watchlist filter.</Text>
            </View>
          ) : (
            visibleStocks.map(stock => (
              <TouchableOpacity key={stock.id} style={styles.stockCard} onPress={() => setSelectedStock(stock)}>
                <View style={styles.stockHeader}>
                  <View>
                    <Text style={styles.stockSymbol}>{stock.symbol}</Text>
                    <Text style={styles.stockName}>{stock.name}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.marketWatchButton}
                    onPress={() => toggleWatchlist(stock.symbol)}>
                    <MaterialCommunityIcons
                      name={watchlist[stock.symbol] ? 'star' : 'star-outline'}
                      size={18}
                      color={watchlist[stock.symbol] ? '#f59e0b' : '#64748b'}
                    />
                  </TouchableOpacity>
                  <View style={styles.stockPriceContainer}>
                    <Text style={styles.stockPrice}>${stock.price.toFixed(2)}</Text>
                    <Text style={[styles.stockChange, {color: stock.change > 0 ? '#25D366' : '#FF3B30'} as any]}>
                      {stock.change > 0 ? '+' : '-'} {Math.abs(stock.change)}%
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
      const response = await apiFetch(`/forex`);
      const data = await response.json();
      setForexPairs(Array.isArray(data) ? data : []);
    } catch {
      setForexPairs([]);
    } finally {
      setLoading(false);
    }
  };

  const tradeForex = (pair: ForexPair) => {
    const execute = async (side: 'buy' | 'sell') => {
      try {
        const response = await apiFetch(`/trade/${side}`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            user_id: ACTIVE_USER_ID,
            symbol: pair.symbol,
            quantity: 1000,
            price: pair.rate,
            asset_type: 'forex',
          }),
        });
        const data = await response.json();
        if (!response.ok || !data?.success) {
          Alert.alert('Trade failed', data?.error || data?.detail || 'Unable to place trade.');
          return;
        }
        Alert.alert('Trade placed', `${side.toUpperCase()} ${pair.symbol} submitted.`);
      } catch {
        Alert.alert('Trade failed', 'Unable to place trade right now.');
      }
    };

    Alert.alert('Trade Forex', `${pair.symbol} - ${pair.rate.toFixed(4)}`, [
      {text: 'Cancel', onPress: () => {}},
      {text: 'Buy', onPress: () => execute('buy')},
      {text: 'Sell', onPress: () => execute('sell')},
    ]);
  };

  return (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Forex</Text>
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
                  {pair.change > 0 ? '+' : '-'} {Math.abs(pair.change_percent).toFixed(2)}%
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
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'highlights'>('overview');
  const [profileData, setProfileData] = useState<User>(user);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editBio, setEditBio] = useState(user.bio);
  const [newPostText, setNewPostText] = useState('');
  const [recentPosts, setRecentPosts] = useState<{id: number; title: string; createdAt: string}[]>([]);
  const [shareCount, setShareCount] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [statusMode, setStatusMode] = useState<'Online' | 'Focus' | 'Away'>('Online');
  const [activityTimeline, setActivityTimeline] = useState<{id: number; title: string; time: string; icon: string}[]>([]);

  useEffect(() => {
    setProfileData(user);
    setEditName(user.name);
    setEditBio(user.bio);
  }, [user]);

  const addActivity = (title: string, icon: string) => {
    const newEvent = {
      id: Date.now(),
      title,
      time: 'Just now',
      icon,
    };
    setActivityTimeline(prev => [newEvent, ...prev]);
  };

  const profileStats = [
    {label: 'Followers', value: profileData.followers.toLocaleString(), icon: 'account-group-outline'},
    {label: 'Following', value: profileData.following.toLocaleString(), icon: 'account-heart-outline'},
    {label: 'Engagement', value: `${Math.max(6, Math.min(18, recentPosts.length * 2.3)).toFixed(1)}%`, icon: 'trending-up'},
  ];

  const handleSaveProfile = () => {
    if (!editName.trim() || !editBio.trim()) {
      Alert.alert('Missing fields', 'Name and bio are required.');
      return;
    }

    setProfileData(prev => ({
      ...prev,
      name: editName.trim(),
      bio: editBio.trim(),
    }));
    setIsEditing(false);
    addActivity('Updated profile information', 'account-edit-outline');
    Alert.alert('Profile updated', 'Your profile details were saved.');
  };

  const handleCreatePost = async () => {
    if (!newPostText.trim()) {
      Alert.alert('Empty post', 'Write something before posting.');
      return;
    }

    try {
      const response = await apiFetch(`/posts`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          content: newPostText.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        Alert.alert('Post failed', data?.error || data?.detail || 'Unable to publish post.');
        return;
      }

      const newPost = {
        id: data.post_id || Date.now(),
        title: newPostText.trim(),
        createdAt: 'Just now',
      };

      setRecentPosts(prev => [newPost, ...prev]);
      setNewPostText('');
      addActivity('Published a new post', 'post-outline');
      Alert.alert('Posted', 'Your post is now live.');
    } catch {
      Alert.alert('Post failed', 'Unable to publish post right now.');
    }
  };

  const handleInvite = () => {
    const inviteCode = `${profileData.username.toUpperCase()}-${String(Date.now()).slice(-4)}`;
    addActivity('Generated invite code', 'account-plus-outline');
    Alert.alert('Invite Link', `Share this code with friends: ${inviteCode}`);
  };

  const handleShareProfile = (provider: string) => {
    setShareCount(prev => prev + 1);
    addActivity(`Shared profile on ${provider}`, 'share-variant-outline');
    Alert.alert('Shared', `Profile shared to ${provider}.`);
  };

  const handleOpenPost = (post: {title: string; createdAt: string}) => {
    Alert.alert('Post Preview', `${post.title}\n\nPublished: ${post.createdAt}`);
  };

  const handleHighlightAction = (badge: string) => {
    addActivity(`Viewed badge: ${badge}`, 'star-circle-outline');
    Alert.alert('Badge', `${badge} badge details opened.`);
  };

  const handleDailyCheckIn = () => {
    setStreakDays(prev => prev + 1);
    setProfileData(prev => ({...prev, followers: prev.followers + 3}));
    addActivity('Completed daily check-in', 'calendar-check-outline');
  };

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [scaleAnim]);

  return (
    <ScrollView style={styles.screenContainer}>
      <Animated.View style={[styles.profileHeader, {transform: [{scale: scaleAnim}]}]}>
        <Image source={{uri: profileData.avatar}} style={styles.profileAvatar} />
        <Text style={styles.profileName}>{profileData.name}</Text>
        <Text style={styles.profileUsername}>@{profileData.username}</Text>
        <Text style={styles.profileBio}>{profileData.bio}</Text>

        <View style={styles.statsContainer}>
          {profileStats.map(item => (
            <View key={item.label} style={styles.statItem}>
              <MaterialCommunityIcons name={item.icon as any} size={16} color="#93c5fd" />
              <Text style={styles.statNumber}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {!isEditing ? (
          <TouchableOpacity
            style={styles.glassButton}
            onPress={() => {
              setActiveTab('overview');
              setIsEditing(true);
            }}>
            <Text style={styles.glassButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.profileEditActions}>
            <TouchableOpacity style={styles.profileSaveButton} onPress={handleSaveProfile}>
              <Text style={styles.profileSaveText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileCancelButton}
              onPress={() => {
                setIsEditing(false);
                setEditName(profileData.name);
                setEditBio(profileData.bio);
              }}>
              <Text style={styles.profileCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      <View style={styles.profileTabBar}>
        {[
          {key: 'overview', label: 'Overview'},
          {key: 'activity', label: 'Activity'},
          {key: 'highlights', label: 'Highlights'},
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.profileTabButton, activeTab === tab.key && styles.profileTabButtonActive]}
            onPress={() => setActiveTab(tab.key as 'overview' | 'activity' | 'highlights')}>
            <Text style={[styles.profileTabText, activeTab === tab.key && styles.profileTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'overview' && (
        <>
          {isEditing && (
            <View style={styles.profileSection}>
              <Text style={styles.sectionTitle}>Edit Profile</Text>
              <TextInput
                style={styles.profileInput}
                placeholder="Name"
                placeholderTextColor="#94a3b8"
                value={editName}
                onChangeText={setEditName}
              />
              <TextInput
                style={[styles.profileInput, styles.profileInputMultiline]}
                placeholder="Bio"
                placeholderTextColor="#94a3b8"
                value={editBio}
                onChangeText={setEditBio}
                multiline
              />
            </View>
          )}

          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>Profile Insights</Text>
            <View style={styles.profileInsightGrid}>
              <View style={styles.profileInsightCard}>
                <Text style={styles.profileInsightLabel}>Profile Views</Text>
                <Text style={styles.profileInsightValue}>{(profileData.followers * 3).toLocaleString()}</Text>
              </View>
              <View style={styles.profileInsightCard}>
                <Text style={styles.profileInsightLabel}>Post Reach</Text>
                <Text style={styles.profileInsightValue}>{(recentPosts.length * 120).toLocaleString()}</Text>
              </View>
              <View style={[styles.profileInsightCard, styles.profileInsightCardFull]}>
                <Text style={styles.profileInsightLabel}>Shares This Week</Text>
                <Text style={styles.profileInsightValue}>{shareCount}</Text>
              </View>
              <View style={[styles.profileInsightCard, styles.profileInsightCardFull]}>
                <Text style={styles.profileInsightLabel}>Streak</Text>
                <Text style={styles.profileInsightValue}>{streakDays} days</Text>
              </View>
            </View>
          </View>

          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.profileActionRow}>
              <TouchableOpacity style={styles.profileActionButton} onPress={handleCreatePost}>
                <MaterialCommunityIcons name="plus-box-outline" size={18} color="#2563eb" />
                <Text style={styles.profileActionText}>Create Post</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.profileActionButton} onPress={handleInvite}>
                <MaterialCommunityIcons name="account-plus-outline" size={18} color="#2563eb" />
                <Text style={styles.profileActionText}>Invite</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.profileStatusRow}>
              {(['Online', 'Focus', 'Away'] as const).map(mode => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.profileStatusChip, statusMode === mode && styles.profileStatusChipActive]}
                  onPress={() => {
                    setStatusMode(mode);
                    addActivity(`Changed status to ${mode}`, 'toggle-switch-outline');
                  }}>
                  <Text style={[styles.profileStatusText, statusMode === mode && styles.profileStatusTextActive]}>
                    {mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.profileCheckInButton} onPress={handleDailyCheckIn}>
              <Text style={styles.profileCheckInText}>Daily Check-In</Text>
            </TouchableOpacity>
            <TextInput
              style={[styles.profileInput, styles.profileComposerInput]}
              placeholder="Write a quick post..."
              placeholderTextColor="#94a3b8"
              value={newPostText}
              onChangeText={setNewPostText}
            />
          </View>

          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>Recent Posts</Text>
            <View style={styles.postsList}>
              {recentPosts.slice(0, 2).map(post => (
                <TouchableOpacity key={post.id} style={styles.postPreview} onPress={() => handleOpenPost(post)}>
                  <Text style={styles.postPreviewText} numberOfLines={3}>{post.title}</Text>
                  <Text style={styles.postPreviewMeta}>{post.createdAt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}

      {activeTab === 'activity' && (
        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {activityTimeline.length === 0 ? (
            <Text style={styles.noResultsText}>No activity yet</Text>
          ) : (
            <View style={styles.profileTimeline}>
              {activityTimeline.map(item => (
                <View key={item.id} style={styles.profileTimelineItem}>
                  <View style={styles.profileTimelineIcon}>
                    <MaterialCommunityIcons name={item.icon as any} size={16} color="#2563eb" />
                  </View>
                  <View style={styles.profileTimelineContent}>
                    <Text style={styles.profileTimelineTitle}>{item.title}</Text>
                    <Text style={styles.profileTimelineTime}>{item.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {activeTab === 'highlights' && (
        <>
          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={styles.profileBadgeRow}>
              <TouchableOpacity style={styles.profileBadge} onPress={() => handleHighlightAction('Top Creator')}>
                <MaterialCommunityIcons name="star-circle-outline" size={20} color="#f59e0b" />
                <Text style={styles.profileBadgeText}>Top Creator</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.profileBadge} onPress={() => handleHighlightAction('Verified')}>
                <MaterialCommunityIcons name="shield-check-outline" size={20} color="#22c55e" />
                <Text style={styles.profileBadgeText}>Verified</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>Share Profile</Text>
            <View style={styles.shareContainer}>
              <TouchableOpacity
                style={[styles.shareButton, styles.telegramShare]}
                onPress={() => handleShareProfile('Telegram')}>
                <MaterialCommunityIcons name="send" size={18} color="#0284c7" />
                <Text style={styles.shareLabel}>Telegram</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shareButton, styles.vkShare]}
                onPress={() => handleShareProfile('VK')}>
                <MaterialCommunityIcons name="alpha-v-circle" size={18} color="#1d4ed8" />
                <Text style={styles.shareLabel}>VK</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shareButton, styles.facebookShare]}
                onPress={() => handleShareProfile('Facebook')}>
                <MaterialCommunityIcons name="facebook" size={18} color="#2563eb" />
                <Text style={styles.shareLabel}>Facebook</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

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
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [showcasePhotos, setShowcasePhotos] = useState<ExternalPhoto[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [wishlistMap, setWishlistMap] = useState<{[productId: number]: boolean}>({});
  const [localCartCount, setLocalCartCount] = useState(0);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [buyQuantity, setBuyQuantity] = useState(1);

  useEffect(() => {
    fetchProducts();
    fetchShowcasePhotos();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await apiFetch(`/products`);
      const data = await response.json();
      const productList = Array.isArray(data) ? data : [];
      setProducts(productList);
      setAllProducts(productList);
    } catch {
      setProducts([]);
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchShowcasePhotos = async () => {
    try {
      const response = await apiFetch(`/external/photos?query=shopping`);
      const data = await response.json();
      setShowcasePhotos(Array.isArray(data?.items) ? data.items.slice(0, 8) : []);
    } catch {
      setShowcasePhotos([]);
    }
  };

  const handleSearch = async () => {
    if (!searchText.trim()) {
      setProducts(allProducts);
      return;
    }

    const filtered = allProducts.filter(product => {
      const text = `${product.name} ${product.description} ${product.category}`.toLowerCase();
      return text.includes(searchText.toLowerCase());
    });
    setProducts(filtered);
  };

  const addToCart = async (product: Product) => {
    try {
      const response = await apiFetch(`/cart/${ACTIVE_USER_ID}/add`, {
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
        setLocalCartCount(prev => prev + 1);
        Alert.alert('Success', `${product.name} added to cart!`);
      } else {
        Alert.alert('Add failed', data?.error || data?.detail || 'Unable to add item.');
      }
    } catch {
      Alert.alert('Add failed', 'Unable to add item right now.');
    }
  };

  const toggleWishlist = async (productId: number) => {
    const isSaved = !!wishlistMap[productId];
    try {
      const response = await apiFetch(
        isSaved
          ? `/wishlists/${ACTIVE_USER_ID}/remove/${productId}`
          : `/wishlists/${ACTIVE_USER_ID}/add/${productId}`,
        {method: isSaved ? 'DELETE' : 'POST'}
      );
      const data = await response.json();
      if (!response.ok || data?.error) {
        Alert.alert('Wishlist failed', data?.error || data?.detail || 'Unable to update wishlist.');
        return;
      }
      setWishlistMap(prev => ({...prev, [productId]: !isSaved}));
    } catch {
      Alert.alert('Wishlist failed', 'Unable to update wishlist right now.');
    }
  };

  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    setBuyQuantity(1);
  };

  const handleBuyNow = async () => {
    if (!selectedProduct) {
      return;
    }

    if (selectedProduct.stock <= 0) {
      Alert.alert('Out of stock', 'This product is currently unavailable.');
      return;
    }

    const quantity = Math.max(1, buyQuantity);
    try {
      const response = await apiFetch(`/cart/${ACTIVE_USER_ID}/add`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          product_id: selectedProduct.id,
          seller_id: selectedProduct.seller_id,
          quantity,
          price: selectedProduct.price,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        Alert.alert('Purchase failed', data?.error || data?.detail || 'Unable to complete purchase.');
        return;
      }
      setLocalCartCount(prev => prev + quantity);
      Alert.alert('Added to cart', `${quantity} x ${selectedProduct.name} added.`);
      setSelectedProduct(null);
    } catch {
      Alert.alert('Purchase failed', 'Unable to complete purchase right now.');
    }
  };

  const categories = ['All', ...Array.from(new Set(allProducts.map(p => p.category)))];
  const visibleProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesStock = showInStockOnly ? product.stock > 0 : true;
    return matchesCategory && matchesStock;
  });

  return (
    <ScrollView style={styles.screenContainer} contentContainerStyle={styles.shopContent}>
      <View style={styles.shopHero}>
        <View>
          <Text style={styles.shopHeroKicker}>Shop</Text>
          <Text style={styles.shopHeroTitle}>Daily Picks</Text>
          <Text style={styles.shopHeroSubtitle}>Discover trending products and fast deals</Text>
        </View>
        <View style={styles.shopHeroIcon}>
          <MaterialCommunityIcons name="shopping-search" size={20} color="#f8fbff" />
        </View>
      </View>

      {showcasePhotos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shopPhotoRow}>
          {showcasePhotos.map(photo => (
            <Image
              key={photo.id}
              source={{uri: photo.src?.medium || photo.src?.large}}
              style={styles.shopPhotoCard}
            />
          ))}
        </ScrollView>
      )}

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
          <Text style={styles.searchButtonText}>Go</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.shopMetaRow}>
        <Text style={styles.shopMetaText}>Cart items: {localCartCount}</Text>
        <TouchableOpacity
          style={[styles.shopStockChip, showInStockOnly && styles.shopStockChipActive]}
          onPress={() => setShowInStockOnly(prev => !prev)}>
          <Text style={[styles.shopStockChipText, showInStockOnly && styles.shopStockChipTextActive]}>
            In Stock
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shopCategoryRow}>
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[styles.shopCategoryChip, selectedCategory === category && styles.shopCategoryChipActive]}
            onPress={() => setSelectedCategory(category)}>
            <Text style={[styles.shopCategoryText, selectedCategory === category && styles.shopCategoryTextActive]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedProduct && (
        <View style={styles.shopDetailCard}>
          <View style={styles.shopDetailHeader}>
            <Text style={styles.shopDetailTitle}>{selectedProduct.name}</Text>
            <TouchableOpacity onPress={() => setSelectedProduct(null)}>
              <MaterialCommunityIcons name="close" size={16} color="#64748b" />
            </TouchableOpacity>
          </View>
          <Text style={styles.shopDetailDesc}>{selectedProduct.description}</Text>
          <Text style={styles.shopDetailPrice}>${selectedProduct.price.toFixed(2)}</Text>
          <View style={styles.shopQtyRow}>
            <TouchableOpacity style={styles.shopQtyButton} onPress={() => setBuyQuantity(prev => Math.max(1, prev - 1))}>
              <Text style={styles.shopQtyButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.shopQtyValue}>{buyQuantity}</Text>
            <TouchableOpacity style={styles.shopQtyButton} onPress={() => setBuyQuantity(prev => Math.min(99, prev + 1))}>
              <Text style={styles.shopQtyButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.shopBuyNowButton} onPress={handleBuyNow}>
            <Text style={styles.shopBuyNowText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.feedLoading}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : visibleProducts.length === 0 ? (
        <View style={styles.feedEmptyCard}>
          <MaterialCommunityIcons name="shopping-outline" size={26} color="#94a3b8" />
          <Text style={styles.feedEmptyTitle}>No products found</Text>
          <Text style={styles.feedEmptyText}>Change filters or search query.</Text>
        </View>
      ) : (
        <View>
          {visibleProducts.map(product => (
            <TouchableOpacity key={product.id} style={styles.productCard} onPress={() => openProduct(product)}>
              <Image source={{uri: product.image}} style={styles.productImage} />
              
              <View style={styles.productInfo}>
                <View style={styles.sellerInfo}>
                  <Image source={{uri: product.seller_avatar}} style={styles.sellerAvatar} />
                  <View>
                    <Text style={styles.sellerName}>{product.seller_name}</Text>
                    <Text style={styles.rating}>* {product.rating} ({product.reviews})</Text>
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
                  <Text style={styles.metaText}>Sold: {product.sold}</Text>
                  <Text style={styles.metaText}>ETA {product.estimated_delivery}</Text>
                </View>

                <View style={styles.shopActionRow}>
                  <TouchableOpacity
                    style={[styles.shopWishlistButton, wishlistMap[product.id] && styles.shopWishlistButtonActive]}
                    onPress={() => toggleWishlist(product.id)}>
                    <MaterialCommunityIcons
                      name={wishlistMap[product.id] ? 'heart' : 'heart-outline'}
                      size={16}
                      color={wishlistMap[product.id] ? '#ef4444' : '#64748b'}
                    />
                  </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addCartButton}
                  onPress={() => addToCart(product)}>
                  <Text style={styles.addCartText}>Add to Cart</Text>
                </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
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
      const response = await apiFetch(`/cart/${ACTIVE_USER_ID}`);
      const data = await response.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      setCartItems(items);
      setTotal(typeof data?.total === 'number' ? data.total : 0);
    } catch {
      setCartItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId: number) => {
    try {
      await apiFetch(`/cart/${ACTIVE_USER_ID}/remove/${productId}`, {method: 'POST'});
      fetchCart();
    } catch {
      const updatedItems = cartItems.filter(item => item.product_id !== productId);
      setCartItems(updatedItems);
      setTotal(updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0));
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
            const response = await apiFetch(`/checkout/${ACTIVE_USER_ID}`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({address}),
            });
            const data = await response.json();
            if (data.success) {
              Alert.alert('Order Confirmed', `Order #${data.order_id} created!\nTotal: $${data.total.toFixed(2)}`);
              fetchCart();
            } else {
              Alert.alert('Checkout failed', data?.error || data?.detail || 'Unable to checkout.');
            }
          } catch {
            Alert.alert('Checkout failed', 'Unable to checkout right now.');
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
          <Text style={styles.emptyText}>Cart</Text>
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
      const response = await apiFetch(`/orders/${ACTIVE_USER_ID}`);
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
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
          <Text style={styles.emptyText}>Box</Text>
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
      const response = await apiFetch(`/notifications/${ACTIVE_USER_ID}`);
      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await apiFetch(`/notifications/${ACTIVE_USER_ID}/read/${notificationId}`, {method: 'POST'});
      const data = await response.json();
      if (!response.ok || data?.error) {
        Alert.alert('Update failed', data?.error || data?.detail || 'Unable to mark notification as read.');
        return;
      }
      setNotifications(notifications.map(n => n.id === notificationId ? {...n, read: true} : n));
    } catch {
      Alert.alert('Update failed', 'Unable to mark notification as read.');
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
        const [productsResponse, usersResponse] = await Promise.all([
          apiFetch(`/products?search=${text}`),
          apiFetch(`/users`),
        ]);
        const productsData = await productsResponse.json();
        const usersData = await usersResponse.json();
        const normalized = text.toLowerCase();
        const matchingUsers = Array.isArray(usersData)
          ? usersData.filter((user: any) => {
              const haystack = `${user.name || ''} ${user.username || ''} ${user.bio || ''}`.toLowerCase();
              return haystack.includes(normalized);
            })
          : [];
        const matchingProducts = Array.isArray(productsData) ? productsData : [];
        setResults([...matchingProducts, ...matchingUsers]);
      } catch {
        setResults([]);
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
      const response = await apiFetch(`/wishlists/${ACTIVE_USER_ID}`);
      const data = await response.json();
      setWishlist(Array.isArray(data) ? data : []);
    } catch {
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: number) => {
    try {
      await apiFetch(`/wishlists/${ACTIVE_USER_ID}/remove/${productId}`, {method: 'DELETE'});
      setWishlist(wishlist.filter(w => w.product_id !== productId));
    } catch {
      setWishlist(wishlist.filter(w => w.product_id !== productId));
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
              <Text style={styles.removeButton}>X</Text>
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
      const response = await apiFetch(`/wallet/${ACTIVE_USER_ID}`);
      const data = await response.json();
      setWallet(data && Object.keys(data).length > 0 ? data : null);
    } catch {
      setWallet(null);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      Alert.alert('Invalid', 'Enter a valid amount');
      return;
    }
    try {
      const response = await apiFetch(`/wallet/${ACTIVE_USER_ID}/deposit`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({amount: parseFloat(depositAmount)}),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', `Deposited $${depositAmount}`);
        fetchWallet();
        setDepositAmount('');
      }
    } catch {
      Alert.alert('Deposit failed', 'Could not complete the deposit.');
    }
  };

  const handleWithdraw = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      Alert.alert('Invalid', 'Enter a valid amount');
      return;
    }
    try {
      const response = await apiFetch(`/wallet/${ACTIVE_USER_ID}/withdraw`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({amount: parseFloat(depositAmount)}),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        Alert.alert('Withdraw failed', data?.error || data?.detail || 'Unable to withdraw funds.');
        return;
      }
      Alert.alert('Success', `Withdrew $${depositAmount}`);
      fetchWallet();
      setDepositAmount('');
    } catch {
      Alert.alert('Withdraw failed', 'Could not complete withdrawal.');
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
            <TouchableOpacity style={[styles.glassButton, styles.withdrawButton]} onPress={handleWithdraw}>
              <Text style={styles.glassButtonText}>Withdraw</Text>
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
      const response = await apiFetch(`/crypto`);
      const data = await response.json();
      setCryptos(Array.isArray(data) ? data : []);
    } catch {
      setCryptos([]);
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
                  {crypto.change > 0 ? '+' : '-'} {Math.abs(crypto.change_percent).toFixed(2)}%
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
      const response = await apiFetch(`/copy-traders`);
      const data = await response.json();
      setTraders(Array.isArray(data) ? data : []);
    } catch {
      setTraders([]);
    } finally {
      setLoading(false);
    }
  };

  const followTrader = async (traderId: number, traderName: string) => {
    try {
      const response = await apiFetch(`/copy-traders/${traderId}/follow?user_id=${ACTIVE_USER_ID}`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok || data?.error) {
        Alert.alert('Copy failed', data?.error || data?.detail || 'Unable to follow trader.');
        return;
      }
      setTraders(prev =>
        prev.map(trader =>
          trader.trader_id === traderId
            ? {...trader, followers: trader.followers + 1}
            : trader
        )
      );
      Alert.alert('Copy enabled', `Now copying ${traderName}.`);
    } catch {
      Alert.alert('Copy failed', 'Unable to follow trader right now.');
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
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => followTrader(trader.trader_id, trader.trader_name)}>
              <Text style={styles.copyButtonText}>Copy</Text>
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
      const response = await apiFetch(`/loyalty/${ACTIVE_USER_ID}`);
      const data = await response.json();
      setLoyalty(data && Object.keys(data).length > 0 ? data : null);
    } catch {
      setLoyalty(null);
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
              * {loyalty.tier.toUpperCase()}
            </Text>
            <Text style={styles.pointsDisplay}>{loyalty.points} Points</Text>
            <View style={styles.progressBar}>
              <View style={{width: `${(loyalty.points % 1000) / 10}%`, height: '100%', backgroundColor: '#007AFF'} as any} />
            </View>
            <Text style={styles.progressText}>{loyalty.points % 1000} / 1000 to next tier</Text>
          </View>
          <View style={styles.benefitsSection}>
            <Text style={styles.sectionTitle}>Tier Benefits</Text>
            <Text style={styles.benefitItem}>- Exclusive discounts</Text>
            <Text style={styles.benefitItem}>- Free shipping</Text>
            <Text style={styles.benefitItem}>- Cashback rewards</Text>
            <Text style={styles.benefitItem}>- Early access to sales</Text>
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiFetch(`/settings/${ACTIVE_USER_ID}`);
      const data = await response.json();
      if (!response.ok || data?.error) {
        return;
      }
      setDarkMode(!!data.dark_mode);
      setLanguage(data.language || 'en');
      setNotificationsEnabled(data.notifications_enabled !== false);
    } catch {}
  };

  const persistSettings = async (next: {
    dark_mode?: boolean;
    language?: string;
    notifications_enabled?: boolean;
  }) => {
    const response = await apiFetch(`/settings/${ACTIVE_USER_ID}/update`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(next),
    });
    const data = await response.json();
    if (!response.ok || data?.error) {
      throw new Error(data?.error || data?.detail || 'Unable to save settings');
    }
  };

  const toggleDarkMode = async () => {
    const next = !darkMode;
    setDarkMode(next);
    try {
      await persistSettings({dark_mode: next});
    } catch {
      setDarkMode(!next);
      Alert.alert('Save failed', 'Unable to update dark mode.');
    }
  };

  const changeLanguage = async (lang: string) => {
    const previous = language;
    setLanguage(lang);
    try {
      await persistSettings({language: lang});
    } catch {
      setLanguage(previous);
      Alert.alert('Save failed', 'Unable to update language.');
    }
  };

  const toggleNotifications = async () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    try {
      await persistSettings({notifications_enabled: next});
    } catch {
      setNotificationsEnabled(!next);
      Alert.alert('Save failed', 'Unable to update notifications.');
    }
  };

  return (
    <ScrollView style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Display</Text>
        <TouchableOpacity style={styles.settingsItem} onPress={toggleDarkMode}>
          <Text style={styles.settingsLabel}>Dark Mode</Text>
          <Text style={styles.toggleSwitch}>{darkMode ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem} onPress={toggleNotifications}>
          <Text style={styles.settingsLabel}>Notifications</Text>
          <Text style={styles.toggleSwitch}>{notificationsEnabled ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Language</Text>
        {['en', 'es', 'fr', 'de', 'zh'].map(lang => (
          <TouchableOpacity
            key={lang}
            style={[styles.settingsItem, language === lang && styles.settingsItemActive]}
            onPress={() => changeLanguage(lang)}>
            <Text style={styles.settingsLabel}>{lang.toUpperCase()}</Text>
            <Text>{language === lang ? 'v' : ''}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Account</Text>
        <TouchableOpacity style={styles.settingsItem} onPress={() => onScreenChange('followers')}>
          <Text style={styles.settingsLabel}>View Followers</Text>
          <Text>{'>'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem} onPress={() => onScreenChange('analytics')}>
          <Text style={styles.settingsLabel}>Analytics</Text>
          <Text>{'>'}</Text>
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
      const response = await apiFetch(`/followers/${ACTIVE_USER_ID}`);
      const data = await response.json();
      setFollowers(Array.isArray(data) ? data : []);
    } catch {
      setFollowers([]);
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
      const response = await apiFetch(`/analytics/${ACTIVE_USER_ID}/user_spending`);
      const data = await response.json();
      setAnalytics(data?.[0]?.data || null);
    } catch {
      setAnalytics(null);
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
      ) : !analytics ? (
        <Text style={styles.noResultsText}>No analytics available yet</Text>
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
    backgroundColor: '#f1f5f9',
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
  feedContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 84,
  },
  feedHero: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  feedKicker: {
    fontSize: 12,
    fontWeight: '700',
    color: '#93c5fd',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  feedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fbff',
  },
  feedSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#bfdbfe',
    maxWidth: 220,
    lineHeight: 19,
  },
  feedHeroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(37, 99, 235, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsStrip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  newsStripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  newsStripTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  newsItemText: {
    fontSize: 12,
    color: '#334155',
    marginBottom: 6,
    lineHeight: 18,
  },
  feedFilterRow: {
    paddingBottom: 10,
    paddingRight: 8,
  },
  feedFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    marginRight: 8,
  },
  feedFilterChipActive: {
    backgroundColor: '#2563eb',
  },
  feedFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  feedFilterTextActive: {
    color: '#f8fbff',
  },
  feedListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 2,
    paddingHorizontal: 2,
  },
  feedListTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  feedListMeta: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  feedDetailCard: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 14,
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 10,
  },
  feedDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  feedDetailTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  feedDetailUser: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  feedDetailContent: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  feedDetailMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 8,
  },
  feedLoading: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedEmptyCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  feedEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 10,
  },
  feedEmptyText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  postCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    ...SHADOW_POST_CARD,
  },
  postHeader: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  postHeaderInfo: {
    flex: 1,
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#dbeafe',
  },
  postMenuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postUsername: {
    fontWeight: '700',
    fontSize: 15,
    color: '#0f172a',
  },
  postTime: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    color: '#334155',
  },
  postImage: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#f8fafc',
    minWidth: 96,
  },
  actionIcon: {
    marginRight: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  commentComposer: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    fontSize: 13,
    color: '#0f172a',
  },
  commentSendButton: {
    marginLeft: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
  },
  commentPreviewText: {
    marginTop: 8,
    fontSize: 12,
    color: '#334155',
  },

  // Chat Styles
  chatContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 84,
  },
  chatHero: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  chatHeroKicker: {
    color: '#a5b4fc',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  chatHeroTitle: {
    color: '#f8fbff',
    fontSize: 24,
    fontWeight: '700',
  },
  chatHeroSubtitle: {
    color: '#c7d2fe',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },
  chatHeroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(79, 70, 229, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatControlRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  chatSearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chatSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  chatUnreadChip: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#fff',
  },
  chatUnreadChipActive: {
    backgroundColor: '#e0ecff',
    borderColor: '#93c5fd',
  },
  chatUnreadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  chatUnreadTextActive: {
    color: '#2563eb',
  },
  chatThreadCard: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 12,
  },
  chatThreadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chatThreadUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatThreadAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 8,
  },
  chatThreadName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  chatThreadMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  chatThreadClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatThreadMessages: {
    marginBottom: 10,
  },
  chatBubble: {
    maxWidth: '82%',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  chatBubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563eb',
  },
  chatBubbleTheirs: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
  },
  chatBubbleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  chatBubbleTextMine: {
    color: '#fff',
  },
  chatBubbleTextTheirs: {
    color: '#0f172a',
  },
  chatBubbleTime: {
    marginTop: 4,
    fontSize: 10,
    color: 'rgba(148,163,184,0.9)',
  },
  chatComposerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatComposerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  chatComposerSend: {
    marginLeft: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  chatAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#dbeafe',
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 3,
    color: '#0f172a',
  },
  chatPreview: {
    fontSize: 13,
    color: '#64748b',
  },
  chatMeta: {
    alignItems: 'flex-end',
  },
  chatTime: {
    fontSize: 12,
    color: '#94a3b8',
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
    margin: 14,
    padding: 22,
    borderRadius: 20,
    backgroundColor: '#0f172a',
  },
  profileAvatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#93c5fd',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    color: '#f8fbff',
  },
  profileUsername: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    color: '#dbeafe',
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
    fontWeight: '700',
    color: '#f8fbff',
  },
  statLabel: {
    fontSize: 12,
    color: '#bfdbfe',
  },
  profileSection: {
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#0f172a',
  },
  postsList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  postPreview: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 10,
  },
  postPreviewText: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  postPreviewMeta: {
    fontSize: 11,
    color: '#64748b',
  },
  profileTabBar: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 4,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
  },
  profileTabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  profileTabButtonActive: {
    backgroundColor: '#fff',
  },
  profileTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  profileTabTextActive: {
    color: '#2563eb',
  },
  profileInsightGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileInsightCard: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#eff6ff',
    padding: 12,
  },
  profileInsightCardFull: {
    width: '100%',
    marginTop: 10,
  },
  profileInsightLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  profileInsightValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 6,
  },
  profileActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileActionButton: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    alignItems: 'center',
  },
  profileActionText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#1e3a8a',
  },
  profileTimeline: {
    borderLeftWidth: 2,
    borderLeftColor: '#dbeafe',
    paddingLeft: 12,
  },
  profileTimelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  profileTimelineIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    marginRight: 10,
  },
  profileTimelineContent: {
    flex: 1,
  },
  profileTimelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  profileTimelineTime: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  profileBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileBadge: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    backgroundColor: '#fffbeb',
    paddingVertical: 12,
    alignItems: 'center',
  },
  profileBadgeText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  profileEditActions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileSaveButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  profileSaveText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  profileCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginLeft: 8,
  },
  profileCancelText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },
  profileInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 10,
  },
  profileInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  profileComposerInput: {
    marginTop: 10,
    marginBottom: 0,
  },
  profileStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  profileStatusChip: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
  },
  profileStatusChipActive: {
    backgroundColor: '#e0ecff',
    borderColor: '#93c5fd',
  },
  profileStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  profileStatusTextActive: {
    color: '#2563eb',
  },
  profileCheckInButton: {
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    alignItems: 'center',
  },
  profileCheckInText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },

  // Bottom Navigation
  bottomNav: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: '#dbeafe',
    height: 64,
    borderRadius: 18,
    paddingHorizontal: 6,
    ...SHADOW_BOTTOM_NAV,
  },
  bottomNavCompact: {
    left: 8,
    right: 8,
    height: 60,
    paddingHorizontal: 2,
  },
  navButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  navActive: {
    backgroundColor: '#e0ecff',
  },
  navText: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  navTextActive: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  navTextCompact: {
    fontSize: 10,
  },

  // Shopping Styles
  shopContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 84,
  },
  shopHero: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  shopHeroKicker: {
    fontSize: 12,
    color: '#a7f3d0',
    fontWeight: '700',
    marginBottom: 4,
  },
  shopHeroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fbff',
  },
  shopHeroSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#d1fae5',
    lineHeight: 19,
  },
  shopHeroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(16, 185, 129, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopPhotoRow: {
    paddingBottom: 10,
  },
  shopPhotoCard: {
    width: 128,
    height: 86,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: '#e2e8f0',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
  },
  shopMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  shopMetaText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  shopStockChip: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 999,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  shopStockChipActive: {
    backgroundColor: '#e0ecff',
    borderColor: '#93c5fd',
  },
  shopStockChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  shopStockChipTextActive: {
    color: '#2563eb',
  },
  shopCategoryRow: {
    paddingBottom: 10,
    paddingRight: 8,
  },
  shopCategoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    marginRight: 8,
  },
  shopCategoryChipActive: {
    backgroundColor: '#2563eb',
  },
  shopCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  shopCategoryTextActive: {
    color: '#fff',
  },
  shopDetailCard: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 14,
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 10,
  },
  shopDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shopDetailTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginRight: 8,
  },
  shopDetailDesc: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  shopDetailPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16a34a',
    marginBottom: 8,
  },
  shopQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  shopQtyButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  shopQtyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563eb',
  },
  shopQtyValue: {
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  shopBuyNowButton: {
    borderRadius: 10,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    alignItems: 'center',
  },
  shopBuyNowText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  productCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 10,
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
  shopActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shopWishlistButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#f8fafc',
  },
  shopWishlistButtonActive: {
    borderColor: '#fecaca',
    backgroundColor: '#fff1f2',
  },
  addCartButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
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
  marketContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 84,
  },
  marketHero: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  marketHeroKicker: {
    fontSize: 12,
    color: '#93c5fd',
    fontWeight: '700',
    marginBottom: 4,
  },
  marketHeroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fbff',
  },
  marketHeroSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#bfdbfe',
    lineHeight: 19,
  },
  marketHeroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(37, 99, 235, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  marketControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  marketSearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  marketSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  marketWatchlistChip: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#fff',
  },
  marketWatchlistChipActive: {
    backgroundColor: '#e0ecff',
    borderColor: '#93c5fd',
  },
  marketWatchlistText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  marketWatchlistTextActive: {
    color: '#2563eb',
  },
  tradePanel: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  tradePanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tradePanelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  tradePanelPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
  chartRangeRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  chartRangeChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#f8fafc',
    marginRight: 6,
  },
  chartRangeChipActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  chartRangeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  chartRangeTextActive: {
    color: '#1d4ed8',
  },
  chartHintText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 10,
  },
  candleRow: {
    paddingBottom: 6,
  },
  candlePlot: {
    flexDirection: 'row',
    position: 'relative',
  },
  candleContainer: {
    width: 10,
    marginRight: 4,
    alignItems: 'center',
  },
  candleCanvas: {
    width: 10,
    height: 120,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  candleWick: {
    position: 'absolute',
    width: 1,
    left: 4.5,
  },
  candleBody: {
    position: 'absolute',
    width: 6,
    left: 2,
    borderRadius: 2,
  },
  volumeBar: {
    width: 6,
    backgroundColor: '#93c5fd',
    borderRadius: 2,
    marginTop: 2,
  },
  trendOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 120,
  },
  trendLine: {
    position: 'absolute',
    height: 2,
    borderRadius: 2,
  },
  analysisControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  analysisToggleChip: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#f8fafc',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  analysisToggleChipActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  analysisToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  analysisToggleTextActive: {
    color: '#1d4ed8',
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  indicatorText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  trendList: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    padding: 8,
    marginBottom: 10,
  },
  trendListText: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 4,
  },
  tradeQuantityInput: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    marginBottom: 10,
  },
  tradeEstimate: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  tradeQuickRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tradeQuickChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    marginRight: 8,
  },
  tradeQuickText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  tradeButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tradeButton: {
    width: '48%',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tradeBuyButton: {
    backgroundColor: '#16a34a',
  },
  tradeSellButton: {
    backgroundColor: '#dc2626',
  },
  tradeButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
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
  marketWatchButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    marginRight: 8,
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
    backgroundColor: '#0f172a',
    overflow: 'hidden',
  },
  splashGlowTop: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: '#1e3a8a',
    top: -120,
    left: -80,
    opacity: 0.36,
  },
  splashGlowBottom: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#0ea5e9',
    bottom: -130,
    right: -70,
    opacity: 0.22,
  },
  logoContainer: {
    alignItems: 'center',
    width: '84%',
    maxWidth: 340,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 24,
    paddingVertical: 34,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  appLogoOrb: {
    width: 86,
    height: 86,
    borderRadius: 43,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    ...SHADOW_APP_LOGO_ORB,
  },
  appLogo: {
    fontSize: 40,
    color: '#f8fbff',
    fontWeight: '800',
  },
  appName: {
    fontSize: 34,
    fontWeight: '700',
    color: '#f8fbff',
    marginTop: 18,
    marginBottom: 6,
  },
  appTagline: {
    fontSize: 14,
    color: 'rgba(248, 251, 255, 0.8)',
    letterSpacing: 0.4,
    textAlign: 'center',
    lineHeight: 21,
  },
  splashLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 26,
    gap: 10,
  },
  splashLoadingText: {
    fontSize: 13,
    color: 'rgba(248, 251, 255, 0.9)',
    fontWeight: '500',
  },
  splashProgressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(248, 251, 255, 0.15)',
    marginTop: 16,
    overflow: 'hidden',
  },
  splashProgressBar: {
    width: 140,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#f8fbff',
  },

  // Authentication Screen Styles
  authContainer: {
    flex: 1,
    backgroundColor: '#0b1222',
  },
  authScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 10,
  },
  authGlowTop: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#1d4ed8',
    top: -120,
    left: -90,
    opacity: 0.32,
  },
  authGlowBottom: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#06b6d4',
    bottom: -90,
    right: -70,
    opacity: 0.2,
  },
  authContent: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    marginHorizontal: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    borderRadius: 24,
    padding: 22,
  },
  authContentCompact: {
    marginHorizontal: 10,
    padding: 16,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  authBrandPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    marginBottom: 14,
  },
  authBrandPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#bfdbfe',
    letterSpacing: 0.4,
  },
  authTitle: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 6,
    color: '#f8fbff',
  },
  authTitleCompact: {
    fontSize: 28,
  },
  authSubtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Shared Form Styles (used outside auth screen as well)
  glassForm: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    ...SHADOW_GLASS_FORM,
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
    ...SHADOW_GLASS_BUTTON,
  },
  glassButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  withdrawButton: {
    marginTop: 8,
    backgroundColor: '#dc2626',
  },
  authForm: {
    backgroundColor: 'rgba(15, 23, 42, 0.56)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    borderRadius: 18,
    padding: 18,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#bfdbfe',
    marginBottom: 7,
    letterSpacing: 0.3,
  },
  authInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#f8fbff',
  },
  authInputWrapper: {
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  authInputField: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#f8fbff',
  },
  passwordToggle: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 2,
    marginBottom: 14,
  },
  forgotPasswordText: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '600',
  },
  authSubmitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    ...SHADOW_AUTH_SUBMIT,
  },
  authSubmitButtonDisabled: {
    opacity: 0.7,
  },
  authSubmitText: {
    color: '#f8fbff',
    fontWeight: '700',
    fontSize: 15,
  },

  // Social Login Styles
  socialLoginContainer: {
    marginTop: 18,
    marginBottom: 20,
  },
  dividerText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 14,
    textAlign: 'center',
  },
  socialButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  socialButton: {
    width: '48%',
    marginBottom: 10,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  socialButtonFull: {
    width: '100%',
  },
  googleButton: {
    borderColor: 'rgba(234, 67, 53, 0.7)',
  },
  facebookButton: {
    borderColor: 'rgba(24, 119, 242, 0.75)',
  },
  telegramButton: {
    borderColor: 'rgba(0, 136, 204, 0.75)',
  },
  vkButton: {
    borderColor: 'rgba(0, 119, 255, 0.75)',
  },
  appleButton: {
    borderColor: 'rgba(203, 213, 225, 0.7)',
  },
  socialIcon: {
    fontSize: 14,
    marginRight: 7,
    color: '#e2e8f0',
    fontWeight: '700',
  },
  socialLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e2e8f0',
    flexShrink: 1,
  },

  // Toggle Container
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  toggleText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#60a5fa',
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
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 96,
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
    ...SHADOW_LOGOUT,
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



