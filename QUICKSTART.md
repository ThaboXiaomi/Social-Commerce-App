# Quick Start Guide - UniHub Development

## 🚀 5-Minute Setup

### Prerequisites
- Node.js 18+ 
- Python 3.10+
- npm or yarn
- Git

### Clone & Install

```bash
# Clone repository
git clone <your-repo-url>
cd UniHub

# Setup Backend
cd backend
pip install -r requirements.txt
python main.py
# Backend will run on http://localhost:8000

# Setup Frontend (in new terminal)
cd Frontend
npm install
npm start
# Expo will prompt: press 'w' for web, 'i' for iOS, 'a' for Android
```

## 📱 Running the App

### Web Browser
```bash
cd Frontend
npm start
# Press 'w' - opens http://localhost:19006
```

### iOS Simulator
```bash
cd Frontend
npm start
# Press 'i' - requires Xcode installed
```

### Android Emulator
```bash
cd Frontend
npm start
# Press 'a' - requires Android Studio
```

### On Device
```bash
cd Frontend
npm start
# Scan QR code with Expo Go app
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/test_auth_db.py -v
```

### Frontend Tests
```bash
cd Frontend
npm test

# Run specific test file
npm test components.test.tsx

# Watch mode
npm test -- --watch
```

### Linting
```bash
cd Frontend
npm run lint
```

## 🎨 Using Theme System

Add colors using theme tokens:
```typescript
import { createStyles, lightColors, darkColors } from './utils/theme.ts';

// In your component
const isDark = useColorScheme() === 'dark';
const colors = isDark ? darkColors : lightColors;
const styles = createStyles(colors);

// Use in render
<Text style={styles.textPrimary}>Hello</Text>
```

**Never use hard-coded colors!** ❌ `color: '#2563eb'` → ✅ `color: colors.accent`

## 🔐 Session Management

Sessions automatically save on login:
```typescript
// This happens automatically after login
await sessionStorage.saveSession(tokens, userId);

// Auto-restore on app launch (in App.tsx)
const session = await sessionStorage.getSession();

// Clear on logout (in logout handler)
await sessionStorage.clearSession();
```

## 📊 Real-Time Market Data

StocksScreen automatically subscribes for updates:
```typescript
// This is already implemented
useEffect(() => {
  const unsubscribe = MarketDataService.subscribe((stocks) => {
    setStocks(stocks);
  });
  return () => unsubscribe();
}, []);
```

## 🌍 Internationalization

To add internationalized strings:
```typescript
import { getLocalizedString } from './utils/i18n.ts';

const title = getLocalizedString('app.title', 'en');
const number = formatNumber(1234.56, 'en-US');
const price = formatCurrency(99.99, 'en-US');
```

## ⚡ Performance Optimization

Use memoization for list components:
```typescript
// ✅ Good - Memoized market row
import { MarketRow } from './components/MarketRow.tsx';

export const Component = () => (
  {stocks.map(stock => (
    <MarketRow key={stock.id} stock={stock} onSelect={handleSelect} />
  ))}
);

// ❌ Bad - Inline item rendering
stocks.map(stock => (
  <View key={stock.id}>
    <Text>{stock.name}</Text>
  </View>
))
```

## ♿ Accessibility

Add a11y labels to interactive elements:
```typescript
import { createButtonA11yProps } from './utils/accessibility.ts';

<TouchableOpacity 
  {...createButtonA11yProps('Buy shares', 'Purchases selected quantity')}
  onPress={handleBuy}
/>
```

## 🐛 Debugging

### View Logs
```bash
# React Native Debugger
cd Frontend
npm start
# Press 'd' for debugger

# Or use Chrome DevTools
open http://localhost:19006/debugger-ui
```

### VSCode Debugging
Install "React Native Tools" extension, then press F5

### Network Requests
```typescript
// Check API calls
fetch(url)
  .then(r => r.json())
  .then(data => console.log('Response:', data))
  .catch(err => console.error('Error:', err))
```

## 📝 Common Tasks

### Add a New Screen
```typescript
// 1. Create component in APP.tsx
function NewScreen() {
  return <View><Text>New Screen</Text></View>;
}

// 2. Add to navigation
{currentScreen === 'new' && <NewScreen />}

// 3. Add button to nav bar
<TouchableOpacity onPress={() => setCurrentScreen('new')}>
  <Text>New</Text>
</TouchableOpacity>
```

### Add a Market Column
```typescript
// In StocksScreen's market list header
<Text style={styles.marketHeaderColExpected}>Expected</Text>

// In market row
<View style={styles.marketRight}>
  <Text>{stock.expected}</Text>
</View>
```

### Change Theme Colors
```typescript
// Edit Frontend/utils/theme.ts
export const lightColors = {
  bg: '#ffffff',           // Change background
  accent: '#2563eb',       // Change primary color
  // ... other colors
};
```

## 🚀 Deployment

### Build for Production
```bash
cd Frontend
npx eas build --platform all

# OR locally
npx expo export --platform all
```

### Deploy Backend
```bash
cd backend
# Setup on hosting (Heroku, Railway, etc.)
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `App.tsx` | Main app component & navigation |
| `auth_db.py` | User authentication database |
| `main.py` | FastAPI backend server |
| `theme.ts` | Theme color tokens |
| `sessionStorage.ts` | Token persistence |
| `marketDataService.ts` | Real-time market polling |
| `Sparkline.tsx` | Market sparkline charts |
| `accessibility.ts` | A11y utilities |
| `performance.ts` | Performance hooks |

## ❓ Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is free
lsof -i :8000

# Or use different port
python main.py --port 8001
```

### Frontend won't install
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Styles not applying
```bash
# Clear Expo cache
npx expo r -c

# Restart dev server
npm start
```

### Session not persisting
```bash
# Check AsyncStorage:
import AsyncStorage from '@react-native-async-storage/async-storage';
AsyncStorage.getItem('session').then(console.log);
```

## 💡 Tips & Tricks

1. **Hot reload**: Save file, changes appear instantly
2. **Debug network**: Open DevTools (F12) → Network tab
3. **Inspect styles**: Use React DevTools extension
4. **Test a11y**: Use screen reader (Mac: Cmd+F5)
5. **Profile performance**: React Profiler tab in DevTools

## 📞 Getting Help

1. Check `CONTRIBUTING.md` for detailed docs
2. Review `IMPLEMENTATION_SUMMARY.md` for feature details
3. Look at test files for usage examples
4. Check inline code comments

---

**Ready to develop? Let's ship! 🚀**
