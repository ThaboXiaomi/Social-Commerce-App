# Contributing to UniHub

Thank you for contributing to UniHub! This guide will help you understand the codebase and contribute effectively.

## Architecture Overview

### Frontend (React Native + Expo)
- **Location**: `/Frontend`
- **Language**: TypeScript
- **Runtime**: React Native with Expo
- **Styling**: StyleSheet (no CSS-in-JS), with theme tokenization

### Backend (FastAPI)
- **Location**: `/backend`
- **Language**: Python
- **Framework**: FastAPI
- **Database**: SQLite (auth_db.sqlite, state_db.sqlite)

## Development Setup

### Frontend
```bash
cd Frontend
npm install
npm start
```

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```

The backend will start on `http://localhost:8000`.

## Key Features Implemented

### 1. Theme System
- **Files**: `Frontend/utils/theme.ts`
- **Features**: Light/dark mode with tokenized colors
- **Usage**: Colors defined in `lightColors` and `darkColors` objects
- **Shadow Support**: Dynamically themed shadow colors

### 2. Session Persistence  
- **Files**: `Frontend/utils/sessionStorage.ts`
- **Features**: Secure token storage with 7-day expiry
- **Benefits**: Auto-login on app restart, automatic session invalidation

### 3. Real-time Market Data
- **Files**: `Frontend/services/marketDataService.ts`
- **Features**: 5-second polling, subscriber pattern
- **Usage**: StocksScreen subscribes for live price updates

### 4. Sparkline Visualization
- **Files**: `Frontend/components/Sparkline.tsx`
- **Features**: SVG-based mini charts for market rows
- **Benefits**: Compact visual representation of price trends

### 5. Memoized Components
- **Files**: `Frontend/components/MarketRow.tsx`
- **Benefits**: Prevents unnecessary re-renders in large lists

### 6. Internationalization Framework
- **Files**: `Frontend/utils/i18n.ts`
- **Languages**: English, Spanish, French, German, Portuguese
- **Features**: String translations, number/currency formatting

## Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/ -v
```

### Frontend Tests
```bash
cd Frontend
npm test
```

### Linting
```bash
cd Frontend
npm run lint
```

## Code Quality Standards

### Theme Tokenization
All colors should use theme tokens from `Frontend/utils/theme.ts`:
```typescript
import { lightColors, darkColors } from './utils/theme.ts';
```

### Component Memoization
For list items and frequently re-rendered components:
```typescript
export const MyComponent = React.memo(MyComponentImpl);
```

### Accessibility
Add accessibility labels and hints:
```typescript
<TouchableOpacity 
  accessibilityLabel="Buy stock"
  accessibilityHint="Double tap to purchase shares"
  accessible={true}
/>
```

## Performance Tips

1. **Use React.memo** for list item components
2. **Use useCallback** for event handlers passed to lists
3. **Lazy-load images** in feed and market lists
4. **Subscription cleanup** for real-time services
5. **Avoid creating objects inline** in render methods

## Session Management

The app automatically:
1. Saves tokens on successful login/signup
2. Restores sessions on app launch if tokens are valid
3. Invalidates sessions that are older than 7 days
4. Clears tokens on logout

## Market Data Updates

StocksScreen receives real-time updates every 5 seconds:
- Connect: `MarketDataService.subscribe(listener)`
- Disconnect: Call the unsubscribe function on unmount

## Troubleshooting

### App won't start backend
- Ensure port 8000 is not in use: `lsof -i :8000`
- Check Python version: `python --version` (should be 3.10+)
- Verify FastAPI installed: `pip install fastapi`

### Styles not applying
- Check theme token usage: `styles = createStyles(isDark ? darkColors : lightColors)`
- Ensure colors imported from `Frontend/utils/theme.ts`
- Run cache clear: `npx expo r -c`

### Session not persisting
- Check `@react-native-async-storage/async-storage` is installed
- Verify `sessionStorage.saveSession()` is called after login
- Check browser console for AsyncStorage errors

## CI/CD Pipeline

GitHub Actions automatically runs on push/PR:
- Backend tests via pytest
- Frontend linting via ESLint
- TypeScript type checking
- Jest test suite

See `.github/workflows/ci.yml` for configuration.

## Future Improvements

- [ ] Replace remaining ScrollViews with FlatList/SectionList
- [ ] Add placeholder token support for all remaining #94a3b8 colors
- [ ] Implement WCAG AA contrast ratio auditing
- [ ] Add image caching layer for market logos
- [ ] Implement virtual scrolling for large feeds
- [ ] Add analytics integration
- [ ] Set up error tracking (Sentry)

## Questions?

Please create an issue or reach out to the development team.
