# UniHub

A full-featured React Native app with integrated social media, e-commerce, and financial trading features combining WhatsApp, Instagram, Threads, Snapchat, Amazon, Temu, Facebook Marketplace, and trading platforms.

## Features

### Social Media
- **Feed** - Create and share posts with likes and comments (Instagram/Threads style)
- **Messaging** - Real-time chat with conversations (WhatsApp style)
  - Search, unread filter and thread view with composer
  - Dark/light theme support and improved empty states
- **Stories** - Ephemeral content sharing with timers (Snapchat style)
- **Profiles** - User profiles with followers/following stats

### E-Commerce
- **Shopping** - Browse and search products with seller info, ratings, and prices (Amazon/Temu style)
- **Product Details** - Full product information with reviews and specifications
- **Shopping Cart** - Add/remove items with real-time total calculation
- **Checkout** - Secure checkout with address entry
- **Orders** - Track order history and delivery status
- **Seller Marketplace** - Shop from multiple sellers with ratings and reviews (Facebook Marketplace style)
- **Search & Filter** - Find products by category or keyword

### Financial Trading
- **Stock Market** ðŸ“ˆ
  - Browse 6+ stocks with real-time pricing
  - View company fundamentals (P/E ratio, market cap, dividend yield)
  - 52-week highs/lows tracking
  - Buy/Sell stocks with simulated trading
  - Portfolio management with profit/loss tracking
  - Top gainers/losers rankings

- **Forex Trading** ðŸ’±
  - Major currency pairs (EUR/USD, GBP/USD, USD/JPY, AUD/USD, USD/CNY)
  - Real-time bid/ask spreads
  - Buy/Sell forex pairs
  - Historical price data charts
  - Technical indicators

- **Portfolio & Trading**
  - Portfolio overview with cash balance
  - Holdings management with P/L tracking
  - Trade history and execution
  - Watchlists for favorite assets
  - Profit/Loss calculation

## Structure

```
â”œâ”€â”€ Frontend/              # React Native app
â”‚   â”œâ”€â”€ App.tsx           # Main app with navigation
â”‚   â”œâ”€â”€ package.json      # Dependencies
â”‚   â””â”€â”€ tsconfig.json     # TypeScript config
â””â”€â”€ backend/              # FastAPI server
    â”œâ”€â”€ main.py          # API endpoints
    â””â”€â”€ requirements.txt # Python dependencies
```

## Backend Setup

```bash
# Navigate to backend
cd backend

# Activate virtual environment (Windows)
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn main:app --reload
```

Server runs on: `http://localhost:8000`

### API Endpoints

**Social Media:**
- `GET /feed` - Get posts
- `POST /posts` - Create post
- `POST /posts/{id}/like` - Like post
- `GET /messages` - Get messages
- `GET /conversations` - Get chat list
- `GET /stories` - Get stories

**E-Commerce:**
- `GET /products` - List all products (supports search & category filter)
- `GET /products/{id}` - Get product details
- `GET /sellers` - List all sellers
- `GET /cart/{user_id}` - Get user's cart
- `POST /cart/{user_id}/add` - Add item to cart
- `POST /checkout/{user_id}` - Create order
- `GET /orders/{user_id}` - Get user's orders
- `POST /products/{id}/review` - Add product review

**Stocks:**
- `GET /stocks` - List all stocks
- `GET /stocks/{id}` - Get stock details
- `GET /market/top-gainers` - Top performing stocks
- `GET /market/top-losers` - Worst performing stocks
- `POST /trade/buy` - Buy stock
- `POST /trade/sell` - Sell stock

**Forex:**
- `GET /forex` - List all forex pairs
- `GET /forex/{id}` - Get forex pair details
- `POST /trade/buy` - Buy forex pair
- `POST /trade/sell` - Sell forex pair

**Portfolio & Trading:**
- `GET /portfolio/{user_id}` - Get portfolio summary
- `GET /portfolio/{user_id}/holdings` - Get portfolio holdings
- `GET /watchlists/{user_id}` - Get watchlists
- `POST /watchlists/{user_id}` - Create watchlist
- `GET /trades/{user_id}` - Get trade history

**New Platform Services:**
- `WS /ws/chat/{user_id}?token=...` - Real-time chat stream
- `POST /media/upload` - Upload image/video media
- `POST /posts/upload` - Create post with uploaded image
- `POST /stories/upload` - Create story with uploaded media
- `POST /payments/create-intent` - Create payment intent
- `POST /payments/confirm` - Confirm payment intent
- `GET /seller/{seller_id}/dashboard` - Seller analytics dashboard
- `GET /recommendations/{user_id}` - Personalized recommendations
- `GET /live-shopping/events` - Live shopping events
- `POST /support/chat` - Customer support chatbot
- `GET /options/contracts` - Options chain contracts
- `POST /options/trade` - Options trade execution

## Frontend Setup

```bash
# Navigate to frontend
cd Frontend

# Install dependencies
npm install

# Optional: set backend URL for Expo
# PowerShell:
$env:EXPO_PUBLIC_API_BASE_URL="http://localhost:8000"

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Run development server
npm start
```

## App Navigation

Bottom tab navigation:
- **ðŸ ** Feed - View social media posts
- **ðŸ“ˆ** Stocks - Stock market & trading
- **ðŸ›ï¸** Shop - Browse products and sellers
- **ðŸ’¬** Chat - Messaging and conversations
- **ðŸ‘¤** Profile - User profile and stats

*Additional access through menu:*
- ðŸ’± Forex - Currency trading
- ðŸ›’ Cart - Shopping cart management
- ðŸ“¦ Orders - Order history

## Technology Stack

### Frontend
- React Native 0.74.5
- Expo SDK 51
- TypeScript 5.3.3
- React Native Safe Area Context

### Backend
- FastAPI 0.104.1
- Uvicorn 0.24.0
- Pydantic 2.5.0
- python-multipart 0.0.9

## Sample Data

The app comes with mock data including:
- **3 Users** - john_doe, jane_smith, mike_tech
- **3 Sellers** - Jane's Electronics, Tech Hub, Global Deals
- **6 Products** - Earbuds, phone stand, cables, smartwatch, speaker, screen protector
- **6 Stocks** - AAPL, MSFT, GOOGL, AMZN, TSLA, META with real pricing data
- **5 Forex Pairs** - EUR/USD, GBP/USD, USD/JPY, AUD/USD, USD/CNY
- **Sample Portfolio** - User with $50,000 portfolio containing stocks and forex positions
- **Sample Messages & Stories**

## Updates (v1.1.0)

### SDK & Dependencies Upgrade
- âœ… Upgraded Expo from SDK 51 to **SDK 51** (simplified to stable version)
- âœ… Updated React Native to **0.74.5** 
- âœ… Added `babel-preset-expo` for proper Babel configuration
- âœ… Fixed TypeScript configuration for Expo projects
- âœ… Updated `app.json` with proper Expo configuration
- âœ… Updated npm scripts to use `npx expo` for cross-platform compatibility
- âœ… Improved performance and compatibility with React Native features

### Configuration Changes
- **app.json**: Added SDK version, platforms, Android/iOS specific settings
- **package.json**: Fixed npm scripts to use `npx expo`, removed conflicting dependencies
- **tsconfig.json**: Enhanced TypeScript compiler options with ES2020 target, proper JSX handling, module resolution
- **babel.config.js**: Using babel-preset-expo for proper Expo support
- **metro.config.js**: Configured for Expo Metro bundler

### Getting Started
```bash
# Navigate to Frontend
cd Frontend

# Install dependencies
npm install

# Start the development server
npm start

# Or for specific platforms:
npm run android    # Android
npm run ios        # iOS (macOS only)
npm run web        # Web browser
```

## Features Roadmap

- [x] Real-time WebSocket messaging
- [x] Image/video upload for posts and stories
- [x] Payment intent + confirmation flow
- [x] User authentication & authorization
- [x] Seller dashboard and seller orders
- [x] Product recommendation engine
- [x] Video stories endpoint
- [x] Live shopping events
- [x] Customer support chatbot
- [x] Chat screen unit tests covering search/filter, conversation thread, send message and theming
- [x] Real-time stock quotes (API integration)
- [x] Advanced charting & technical analysis
- [x] Options trading
- [x] Crypto trading
- [x] Social trading / Copy trading

## API Documentation

Visit `http://localhost:8000/docs` for interactive API documentation (Swagger UI)

