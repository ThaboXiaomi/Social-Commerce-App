# Social Commerce App

A full-featured React Native app with integrated social media, e-commerce, and financial trading features combining WhatsApp, Instagram, Threads, Snapchat, Amazon, Temu, Facebook Marketplace, and trading platforms.

## Features

### Social Media
- **Feed** - Create and share posts with likes and comments (Instagram/Threads style)
- **Messaging** - Real-time chat with conversations (WhatsApp style)
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
- **Stock Market** 📈
  - Browse 6+ stocks with real-time pricing
  - View company fundamentals (P/E ratio, market cap, dividend yield)
  - 52-week highs/lows tracking
  - Buy/Sell stocks with simulated trading
  - Portfolio management with profit/loss tracking
  - Top gainers/losers rankings

- **Forex Trading** 💱
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
├── Frontend/              # React Native app
│   ├── App.tsx           # Main app with navigation
│   ├── package.json      # Dependencies
│   └── tsconfig.json     # TypeScript config
└── backend/              # FastAPI server
    ├── main.py          # API endpoints
    └── requirements.txt # Python dependencies
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

## Frontend Setup

```bash
# Navigate to frontend
cd Frontend

# Install dependencies
npm install

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Run development server
npm start
```

## App Navigation

Bottom tab navigation:
- **🏠** Feed - View social media posts
- **📈** Stocks - Stock market & trading
- **🛍️** Shop - Browse products and sellers
- **💬** Chat - Messaging and conversations
- **👤** Profile - User profile and stats

*Additional access through menu:*
- 💱 Forex - Currency trading
- 🛒 Cart - Shopping cart management
- 📦 Orders - Order history

## Technology Stack

### Frontend
- React Native 0.76.0
- Expo SDK 54
- TypeScript 5.3.3
- React Native Safe Area Context

### Backend
- FastAPI 0.104.1
- Uvicorn 0.24.0
- Pydantic 2.5.0

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
- ✅ Upgraded Expo from SDK 51 to **SDK 54**
- ✅ Updated React Native from 0.74.5 to **0.76.0**
- ✅ Improved performance and compatibility with latest React Native features

## Features Roadmap

- [ ] Real-time WebSocket messaging
- [ ] Image upload for posts and stories
- [ ] Payment gateway integration
- [ ] User authentication & authorization
- [ ] Seller dashboard
- [ ] Product recommendation engine
- [ ] Video streaming for stories
- [ ] Live shopping events
- [ ] Customer support chatbot
- [ ] Real-time stock quotes (API integration)
- [ ] Advanced charting & technical analysis
- [ ] Options trading
- [ ] Crypto trading
- [ ] Social trading / Copy trading

## API Documentation

Visit `http://localhost:8000/docs` for interactive API documentation (Swagger UI)