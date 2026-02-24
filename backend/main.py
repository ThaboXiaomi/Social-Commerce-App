from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from datetime import datetime
from enum import Enum
import os
import urllib.parse
import urllib.request
import json

try:
    from .auth_db import init_auth_db
    from .auth_routes import get_current_user, router as auth_router
    from .state_db import get_state, init_state_db, seed_state, set_state
except ImportError:
    from auth_db import init_auth_db
    from auth_routes import get_current_user, router as auth_router
    from state_db import get_state, init_state_db, seed_state, set_state

app = FastAPI(title="Social Commerce App", description="Social Media + E-Commerce (Amazon, Temu, Facebook Marketplace style)")

STATE_KEYS = {
    "posts": "posts",
    "messages": "messages",
    "stories": "stories",
    "products_review": "products_review",
    "cart": "cart",
    "orders": "orders",
    "watchlists": "watchlists",
    "trades": "trades",
    "portfolios": "portfolios",
    "notifications": "notifications",
    "reviews": "reviews",
    "wishlists": "wishlists",
    "wallets": "wallets",
    "chat_messages": "chat_messages",
    "follows": "follows",
    "copy_traders": "copy_traders",
    "loyalty_points": "loyalty_points",
    "analytics_data": "analytics_data",
    "settings_data": "settings_data",
}

EXTERNAL_TIMEOUT_SECONDS = 6


def _to_jsonable(value: Any) -> Any:
    if isinstance(value, BaseModel):
        if hasattr(value, "model_dump"):
            return value.model_dump()
        return value.dict()
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, list):
        return [_to_jsonable(item) for item in value]
    if isinstance(value, dict):
        return {str(key): _to_jsonable(item) for key, item in value.items()}
    return value


def _persist_state(key: str, value: Any) -> None:
    set_state(key, _to_jsonable(value))


def _fetch_json(url: str, headers: Optional[Dict[str, str]] = None) -> Optional[Any]:
    request = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(request, timeout=EXTERNAL_TIMEOUT_SECONDS) as response:
            payload = response.read().decode("utf-8")
            return json.loads(payload)
    except Exception:
        return None
    return None


def _hydrate_model_list(key: str, model_cls: Any, default_items: List[Any]) -> List[Any]:
    default_payload = _to_jsonable(default_items)
    raw_items = seed_state(key, default_payload)
    if not isinstance(raw_items, list):
        set_state(key, default_payload)
        return default_items
    hydrated = []
    for item in raw_items:
        try:
            hydrated.append(model_cls(**item))
        except Exception:
            continue
    if not raw_items:
        return []
    return hydrated if hydrated else default_items


def _hydrate_model_dict(key: str, model_cls: Any, default_items: Dict[int, Any]) -> Dict[int, Any]:
    default_payload = _to_jsonable(default_items)
    raw_items = seed_state(key, default_payload)
    if not isinstance(raw_items, dict):
        set_state(key, default_payload)
        return default_items

    hydrated: Dict[int, Any] = {}
    for raw_key, raw_value in raw_items.items():
        try:
            hydrated[int(raw_key)] = model_cls(**raw_value)
        except Exception:
            continue
    if not raw_items:
        return {}
    return hydrated if hydrated else default_items


def _hydrate_cart(default_cart: Dict[int, List[Any]]) -> Dict[int, List[Any]]:
    default_payload = _to_jsonable(default_cart)
    raw_cart = seed_state(STATE_KEYS["cart"], default_payload)
    if not isinstance(raw_cart, dict):
        set_state(STATE_KEYS["cart"], default_payload)
        return default_cart

    hydrated: Dict[int, List[CartItem]] = {}
    for raw_user_id, raw_items in raw_cart.items():
        if not isinstance(raw_items, list):
            continue
        items: List[CartItem] = []
        for raw_item in raw_items:
            try:
                items.append(CartItem(**raw_item))
            except Exception:
                continue
        hydrated[int(raw_user_id)] = items
    return hydrated


def _hydrate_primitive_list(key: str, default_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    default_payload = _to_jsonable(default_items)
    raw_items = seed_state(key, default_payload)
    if not isinstance(raw_items, list):
        set_state(key, default_payload)
        return default_items
    return raw_items


def _hydrate_all_state() -> None:
    global POSTS, MESSAGES, STORIES, PRODUCTS_REVIEW, CART, ORDERS, WATCHLISTS, TRADES, PORTFOLIOS
    global NOTIFICATIONS, REVIEWS, WISHLISTS, WALLETS, CHAT_MESSAGES, FOLLOWS
    global COPY_TRADERS, LOYALTY_POINTS, ANALYTICS_DATA, SETTINGS_DATA

    POSTS = _hydrate_model_list(STATE_KEYS["posts"], Post, POSTS)
    MESSAGES = _hydrate_model_list(STATE_KEYS["messages"], Message, MESSAGES)
    STORIES = _hydrate_model_list(STATE_KEYS["stories"], Story, STORIES)
    PRODUCTS_REVIEW = _hydrate_model_list(STATE_KEYS["products_review"], Review, PRODUCTS_REVIEW)
    CART = _hydrate_cart(CART)
    ORDERS = _hydrate_model_list(STATE_KEYS["orders"], Order, ORDERS)
    WATCHLISTS = _hydrate_model_list(STATE_KEYS["watchlists"], Watchlist, WATCHLISTS)
    TRADES = _hydrate_model_list(STATE_KEYS["trades"], Trade, TRADES)
    PORTFOLIOS = _hydrate_model_dict(STATE_KEYS["portfolios"], Portfolio, PORTFOLIOS)
    NOTIFICATIONS = _hydrate_primitive_list(STATE_KEYS["notifications"], NOTIFICATIONS)
    REVIEWS = _hydrate_primitive_list(STATE_KEYS["reviews"], REVIEWS)
    WISHLISTS = _hydrate_primitive_list(STATE_KEYS["wishlists"], WISHLISTS)
    WALLETS = _hydrate_primitive_list(STATE_KEYS["wallets"], WALLETS)
    CHAT_MESSAGES = _hydrate_primitive_list(STATE_KEYS["chat_messages"], CHAT_MESSAGES)
    FOLLOWS = _hydrate_primitive_list(STATE_KEYS["follows"], FOLLOWS)
    COPY_TRADERS = _hydrate_primitive_list(STATE_KEYS["copy_traders"], COPY_TRADERS)
    LOYALTY_POINTS = _hydrate_primitive_list(STATE_KEYS["loyalty_points"], LOYALTY_POINTS)
    ANALYTICS_DATA = _hydrate_primitive_list(STATE_KEYS["analytics_data"], ANALYTICS_DATA)
    SETTINGS_DATA = _hydrate_primitive_list(STATE_KEYS["settings_data"], SETTINGS_DATA)


def _require_user_access(user_id: int, current_user: Dict[str, Any]) -> None:
    if int(current_user["id"]) != int(user_id):
        raise HTTPException(status_code=403, detail="Forbidden: user scope mismatch.")


@app.on_event("startup")
async def setup_auth_database() -> None:
    init_auth_db()
    init_state_db()
    _hydrate_all_state()


app.include_router(auth_router)

# Enums
class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

# User Models
class User(BaseModel):
    id: int
    username: str
    name: str
    avatar: str
    bio: str
    followers: int
    following: int

# Social Models
class Post(BaseModel):
    id: int
    user_id: int
    username: str
    avatar: str
    content: str
    image: Optional[str]
    likes: int
    comments: int
    timestamp: str

class Message(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    sender_name: str
    content: str
    timestamp: str
    read: bool

class Comment(BaseModel):
    id: int
    user_id: int
    username: str
    content: str
    timestamp: str

class Story(BaseModel):
    id: int
    user_id: int
    username: str
    avatar: str
    image: str
    expires_in: int  # seconds

# E-Commerce Models
class Seller(BaseModel):
    id: int
    user_id: int
    shop_name: str
    shop_avatar: str
    rating: float
    reviews_count: int
    followers: int
    bio: str

class Product(BaseModel):
    id: int
    seller_id: int
    seller_name: str
    seller_avatar: str
    name: str
    description: str
    price: float
    original_price: Optional[float]
    image: str
    images: Optional[List[str]]
    category: str
    rating: float
    reviews: int
    sold: int
    stock: int
    shipping_cost: float
    estimated_delivery: str

class CartItem(BaseModel):
    product_id: int
    seller_id: int
    quantity: int
    price: float

class Order(BaseModel):
    id: int
    user_id: int
    items: List[CartItem]
    total_price: float
    shipping_address: str
    status: OrderStatus
    created_at: str
    estimated_delivery: str

class Review(BaseModel):
    id: int
    product_id: int
    user_id: int
    username: str
    rating: float
    text: str
    timestamp: str
    helpful: int

# Forex & Stock Models
class Stock(BaseModel):
    id: int
    symbol: str
    name: str
    price: float
    change: float  # percentage change
    change_amount: float
    market_cap: str
    volume: str
    high_52w: float
    low_52w: float
    pe_ratio: float
    dividend_yield: float
    description: str
    chart_data: List[float]  # last 7 days

class ForexPair(BaseModel):
    id: int
    symbol: str  # e.g., EUR/USD
    name: str
    rate: float
    bid: float
    ask: float
    change: float
    change_percent: float
    high: float
    low: float
    description: str
    chart_data: List[float]

class Watchlist(BaseModel):
    id: int
    user_id: int
    name: str
    created_at: str
    items: List[int]  # List of stock/forex IDs

class Portfolio(BaseModel):
    id: int
    user_id: int
    total_value: float
    cash: float
    invested: float
    profit_loss: float
    profit_loss_percent: float

class PortfolioHolding(BaseModel):
    id: int
    portfolio_id: int
    asset_symbol: str
    asset_name: str
    quantity: float
    buy_price: float
    current_price: float
    value: float
    profit_loss: float
    profit_loss_percent: float
    type: str  # "stock" or "forex"

class Trade(BaseModel):
    id: int
    user_id: int
    symbol: str
    asset_name: str
    type: str  # "buy" or "sell"
    quantity: float
    price: float
    total_amount: float
    timestamp: str
    asset_type: str  # "stock" or "forex"
USERS = {
    1: User(id=1, username="john_doe", name="John Doe", avatar="https://via.placeholder.com/50", bio="Travel enthusiast 🌍", followers=1250, following=340),
    2: User(id=2, username="jane_smith", name="Jane Smith", avatar="https://via.placeholder.com/50", bio="Designer & Photographer", followers=2105, following=450),
    3: User(id=3, username="mike_tech", name="Mike Tech", avatar="https://via.placeholder.com/50", bio="Tech enthusiast", followers=890, following=210),
}

SELLERS = [
    Seller(id=1, user_id=2, shop_name="Jane's Electronics", shop_avatar="https://via.placeholder.com/50", rating=4.8, reviews_count=1250, followers=5600, bio="Premium electronics & gadgets 📱"),
    Seller(id=2, user_id=3, shop_name="Tech Hub", shop_avatar="https://via.placeholder.com/50", rating=4.5, reviews_count=890, followers=3400, bio="Affordable tech products"),
    Seller(id=3, user_id=1, shop_name="Global Deals", shop_avatar="https://via.placeholder.com/50", rating=4.7, reviews_count=2100, followers=7200, bio="Best deals from around the world"),
]

PRODUCTS = [
    Product(id=1, seller_id=1, seller_name="Jane's Electronics", seller_avatar="https://via.placeholder.com/50", name="Wireless Earbuds Pro", description="Premium noise-cancelling wireless earbuds with 48-hour battery life", price=45.99, original_price=79.99, image="https://via.placeholder.com/300", images=[], category="Electronics", rating=4.8, reviews=542, sold=1230, stock=45, shipping_cost=0, estimated_delivery="2-3 days"),
    Product(id=2, seller_id=2, seller_name="Tech Hub", seller_avatar="https://via.placeholder.com/50", name="Smartphone Stand", description="Adjustable phone stand for desk", price=12.50, original_price=19.99, image="https://via.placeholder.com/300", images=[], category="Accessories", rating=4.6, reviews=234, sold=890, stock=120, shipping_cost=2.99, estimated_delivery="3-5 days"),
    Product(id=3, seller_id=3, seller_name="Global Deals", seller_avatar="https://via.placeholder.com/50", name="USB-C Cable 2-Pack", description="Durable fast charging USB-C cables", price=8.99, original_price=15.99, image="https://via.placeholder.com/300", images=[], category="Cables", rating=4.7, reviews=1050, sold=5600, stock=200, shipping_cost=0, estimated_delivery="1-2 days"),
    Product(id=4, seller_id=1, seller_name="Jane's Electronics", seller_avatar="https://via.placeholder.com/50", name="Smart Watch X1", description="Fitness tracking, notifications, 7-day battery", price=129.99, original_price=199.99, image="https://via.placeholder.com/300", images=[], category="Wearables", rating=4.9, reviews=876, sold=3450, stock=67, shipping_cost=0, estimated_delivery="2-3 days"),
    Product(id=5, seller_id=2, seller_name="Tech Hub", seller_avatar="https://via.placeholder.com/50", name="Portable Speaker", description="40W waterproof Bluetooth speaker", price=34.99, original_price=59.99, image="https://via.placeholder.com/300", images=[], category="Audio", rating=4.5, reviews=423, sold=2150, stock=89, shipping_cost=3.99, estimated_delivery="3-5 days"),
    Product(id=6, seller_id=3, seller_name="Global Deals", seller_avatar="https://via.placeholder.com/50", name="Screen Protector Pack", description="Tempered glass screen protectors - 3 pack", price=6.99, original_price=12.99, image="https://via.placeholder.com/300", images=[], category="Protection", rating=4.4, reviews=612, sold=4200, stock=500, shipping_cost=0, estimated_delivery="1-2 days"),
]

PRODUCTS_REVIEW = [
    Review(id=1, product_id=1, user_id=1, username="john_doe", rating=5, text="Amazing quality! Works perfectly, great battery life.", timestamp="2 days ago", helpful=234),
    Review(id=2, product_id=1, user_id=2, username="jane_smith", rating=4.5, text="Good sound quality, ANC could be better", timestamp="1 week ago", helpful=145),
    Review(id=3, product_id=2, user_id=3, username="mike_tech", rating=4, text="Sturdy and adjustable, good value", timestamp="2 weeks ago", helpful=89),
]

POSTS = [
    Post(id=1, user_id=1, username="john_doe", avatar="https://via.placeholder.com/50", content="Just landed in Paris! 🗼", image="https://via.placeholder.com/300", likes=234, comments=12, timestamp="2 hours ago"),
    Post(id=2, user_id=2, username="jane_smith", avatar="https://via.placeholder.com/50", content="New design project coming soon!", image="https://via.placeholder.com/300", likes=567, comments=34, timestamp="4 hours ago"),
    Post(id=3, user_id=3, username="mike_tech", avatar="https://via.placeholder.com/50", content="Check out this new gadget review", image=None, likes=123, comments=8, timestamp="6 hours ago"),
]

MESSAGES = [
    Message(id=1, sender_id=1, receiver_id=2, sender_name="John Doe", content="Hey! How are you?", timestamp="10:30 AM", read=True),
    Message(id=2, sender_id=2, receiver_id=1, sender_name="Jane Smith", content="Doing great! How about you?", timestamp="10:32 AM", read=True),
    Message(id=3, sender_id=1, receiver_id=3, sender_name="John Doe", content="Let's grab coffee tomorrow", timestamp="Yesterday", read=False),
]

STORIES = [
    Story(id=1, user_id=1, username="john_doe", avatar="https://via.placeholder.com/50", image="https://via.placeholder.com/300", expires_in=3600),
    Story(id=2, user_id=2, username="jane_smith", avatar="https://via.placeholder.com/50", image="https://via.placeholder.com/300", expires_in=7200),
]

# Forex & Stock Mock Data
STOCKS = [
    Stock(id=1, symbol="AAPL", name="Apple Inc.", price=215.45, change=2.5, change_amount=5.25, market_cap="3.2T", volume="52.3M", high_52w=237.89, low_52w=124.17, pe_ratio=32.4, dividend_yield=0.42, description="Technology giant. Leader in consumer electronics and software.", chart_data=[210.20, 211.50, 213.80, 214.20, 215.00, 214.80, 215.45]),
    Stock(id=2, symbol="MSFT", name="Microsoft Corp.", price=421.80, change=1.8, change_amount=7.45, market_cap="3.1T", volume="18.9M", high_52w=445.99, low_52w=213.43, pe_ratio=38.2, dividend_yield=0.73, description="Cloud computing and enterprise software leader.", chart_data=[416.20, 417.30, 419.00, 420.50, 421.00, 421.20, 421.80]),
    Stock(id=3, symbol="GOOGL", name="Alphabet Inc.", price=175.30, change=-0.5, change_amount=-0.88, market_cap="1.1T", volume="28.4M", high_52w=195.00, low_52w=102.21, pe_ratio=25.6, dividend_yield=0.0, description="Search engine and advertising giant with AI innovations.", chart_data=[176.50, 176.00, 175.80, 175.50, 175.40, 175.35, 175.30]),
    Stock(id=4, symbol="AMZN", name="Amazon.com Inc.", price=188.45, change=3.2, change_amount=5.80, market_cap="1.8T", volume="42.1M", high_52w=199.87, low_52w=81.43, pe_ratio=64.3, dividend_yield=0.0, description="E-commerce and cloud computing leader AWS.", chart_data=[182.00, 183.50, 185.20, 186.80, 187.50, 188.00, 188.45]),
    Stock(id=5, symbol="TSLA", name="Tesla Inc.", price=245.67, change=5.1, change_amount=12.50, market_cap="780B", volume="134.2M", high_52w=299.29, low_52w=101.81, pe_ratio=68.9, dividend_yield=0.0, description="Electric vehicles and renewable energy company.", chart_data=[235.00, 237.50, 240.00, 242.50, 243.80, 244.50, 245.67]),
    Stock(id=6, symbol="META", name="Meta Platforms Inc.", price=512.45, change=4.3, change_amount=21.10, market_cap="1.3T", volume="12.5M", high_52w=545.00, low_52w=88.09, pe_ratio=22.1, dividend_yield=0.0, description="Social media and metaverse technology company.", chart_data=[490.00, 495.20, 500.50, 505.80, 510.00, 511.50, 512.45]),
]

FOREX_PAIRS = [
    ForexPair(id=1, symbol="EUR/USD", name="Euro/US Dollar", rate=1.0950, bid=1.0948, ask=1.0952, change=0.35, change_percent=0.32, high=1.1050, low=1.0850, description="World's most traded currency pair", chart_data=[1.0920, 1.0925, 1.0935, 1.0940, 1.0945, 1.0948, 1.0950]),
    ForexPair(id=2, symbol="GBP/USD", name="British Pound/US Dollar", rate=1.2750, bid=1.2748, ask=1.2752, change=0.15, change_percent=0.12, high=1.2950, low=1.2550, description="Second most traded currency pair", chart_data=[1.2720, 1.2725, 1.2735, 1.2740, 1.2745, 1.2748, 1.2750]),
    ForexPair(id=3, symbol="USD/JPY", name="US Dollar/Japanese Yen", rate=147.85, bid=147.83, ask=147.87, change=-0.50, change_percent=-0.34, high=152.50, low=145.00, description="Major currency pair with safe-haven status", chart_data=[148.20, 148.10, 148.00, 147.95, 147.90, 147.87, 147.85]),
    ForexPair(id=4, symbol="AUD/USD", name="Australian Dollar/US Dollar", rate=0.6820, bid=0.6818, ask=0.6822, change=0.25, change_percent=0.37, high=0.7150, low=0.6500, description="Commodity-influenced currency pair", chart_data=[0.6800, 0.6805, 0.6810, 0.6815, 0.6818, 0.6819, 0.6820]),
    ForexPair(id=5, symbol="USD/CNY", name="US Dollar/Chinese Yuan", rate=7.2450, bid=7.2440, ask=7.2460, change=-0.10, change_percent=-0.14, high=7.3500, low=6.9000, description="Emerging market currency pair", chart_data=[7.2550, 7.2520, 7.2490, 7.2470, 7.2460, 7.2455, 7.2450]),
]

PORTFOLIOS = {
    1: Portfolio(id=1, user_id=1, total_value=50000.00, cash=12500.00, invested=37500.00, profit_loss=4200.50, profit_loss_percent=12.65),
}

PORTFOLIO_HOLDINGS = [
    PortfolioHolding(id=1, portfolio_id=1, asset_symbol="AAPL", asset_name="Apple Inc.", quantity=50, buy_price=195.00, current_price=215.45, value=10772.50, profit_loss=1022.50, profit_loss_percent=10.50, type="stock"),
    PortfolioHolding(id=2, portfolio_id=1, asset_symbol="MSFT", asset_name="Microsoft Corp.", quantity=30, buy_price=380.00, current_price=421.80, value=12654.00, profit_loss=1254.00, profit_loss_percent=11.00, type="stock"),
    PortfolioHolding(id=3, portfolio_id=1, asset_symbol="EUR/USD", asset_name="Euro/US Dollar", quantity=1000, buy_price=1.0750, current_price=1.0950, value=1095.00, profit_loss=200.00, profit_loss_percent=18.60, type="forex"),
]

TRADES = [
    Trade(id=1, user_id=1, symbol="AAPL", asset_name="Apple Inc.", type="buy", quantity=50, price=195.00, total_amount=9750.00, timestamp="2026-02-20 10:30 AM", asset_type="stock"),
    Trade(id=2, user_id=1, symbol="MSFT", asset_name="Microsoft Corp.", type="buy", quantity=30, price=380.00, total_amount=11400.00, timestamp="2026-02-19 02:15 PM", asset_type="stock"),
    Trade(id=3, user_id=1, symbol="EUR/USD", asset_name="Euro/US Dollar", type="buy", quantity=1000, price=1.0750, total_amount=1075.00, timestamp="2026-02-18 08:45 AM", asset_type="forex"),
]

WATCHLISTS = [
    Watchlist(id=1, user_id=1, name="Tech Stocks", created_at="2026-01-15", items=[1, 2, 4, 6]),
    Watchlist(id=2, user_id=1, name="Major Pairs", created_at="2026-02-01", items=[1, 2, 3]),
]

CART = {}  # user_id -> list of CartItems
ORDERS = []  # List of Order

# User endpoints
@app.get("/users/{user_id}", response_model=User)
async def get_user(user_id: int):
    return USERS.get(user_id, {"error": "User not found"})

@app.get("/users", response_model=List[User])
async def list_users():
    return list(USERS.values())

# Feed endpoints
@app.get("/feed", response_model=List[Post])
async def get_feed():
    external_posts = _fetch_json("https://dummyjson.com/posts?limit=12")
    external_users = _fetch_json("https://dummyjson.com/users?limit=30")
    if isinstance(external_posts, dict) and isinstance(external_users, dict):
        posts_payload = external_posts.get("posts", [])
        users_payload = external_users.get("users", [])
        if isinstance(posts_payload, list) and isinstance(users_payload, list) and posts_payload:
            users_by_id = {u.get("id"): u for u in users_payload if isinstance(u, dict)}
            live_feed: List[Post] = []
            for item in posts_payload:
                if not isinstance(item, dict):
                    continue
                user = users_by_id.get(item.get("userId"), {})
                first = user.get("firstName", "User")
                last = user.get("lastName", "")
                username = user.get("username") or f"user_{item.get('userId', 0)}"
                live_feed.append(
                    Post(
                        id=int(item.get("id", 0)),
                        user_id=int(item.get("userId", 0)),
                        username=str(username),
                        avatar=f"https://ui-avatars.com/api/?name={urllib.parse.quote(str(first + ' ' + last).strip())}&background=2563eb&color=ffffff",
                        content=str(item.get("body", "")),
                        image=None,
                        likes=int(item.get("reactions", 0)),
                        comments=int(item.get("views", 0)) // 20,
                        timestamp="Live",
                    )
                )
            if live_feed:
                return live_feed
    return POSTS

@app.post("/posts")
async def create_post(post: Post):
    new_id = max([p.id for p in POSTS]) + 1
    POSTS.append(Post(id=new_id, **post.dict()))
    _persist_state(STATE_KEYS["posts"], POSTS)
    return {"success": True, "post_id": new_id}

@app.post("/posts/{post_id}/like")
async def like_post(post_id: int):
    for post in POSTS:
        if post.id == post_id:
            post.likes += 1
            _persist_state(STATE_KEYS["posts"], POSTS)
            return {"success": True, "likes": post.likes}
    return {"error": "Post not found"}

@app.post("/posts/{post_id}/comment")
async def comment_on_post(post_id: int, comment: Comment):
    for post in POSTS:
        if post.id == post_id:
            post.comments += 1
            _persist_state(STATE_KEYS["posts"], POSTS)
            return {"success": True, "comment_id": 1, "comments_count": post.comments}
    return {"error": "Post not found"}

# Messaging endpoints
@app.get("/messages", response_model=List[Message])
async def get_messages():
    return MESSAGES

@app.get("/messages/{user_id}", response_model=List[Message])
async def get_conversation(user_id: int):
    return [m for m in MESSAGES if m.sender_id == user_id or m.receiver_id == user_id]

@app.post("/messages")
async def send_message(message: Message):
    new_id = max([m.id for m in MESSAGES]) + 1
    MESSAGES.append(Message(id=new_id, **message.dict()))
    _persist_state(STATE_KEYS["messages"], MESSAGES)
    return {"success": True, "message_id": new_id}

@app.get("/conversations")
async def get_conversations():
    conversations = {}
    for msg in MESSAGES:
        other_user_id = msg.receiver_id if msg.sender_id == 1 else msg.sender_id
        if other_user_id not in conversations:
            conversations[other_user_id] = {
                "user_id": other_user_id,
                "user": USERS.get(other_user_id),
                "last_message": msg.content,
                "timestamp": msg.timestamp,
                "unread": not msg.read
            }
    return list(conversations.values())

# Stories endpoints
@app.get("/stories", response_model=List[Story])
async def get_stories():
    return STORIES

@app.post("/stories")
async def upload_story(story: Story):
    new_id = max([s.id for s in STORIES]) + 1
    STORIES.append(Story(id=new_id, **story.dict()))
    _persist_state(STATE_KEYS["stories"], STORIES)
    return {"success": True, "story_id": new_id}

# ========== E-COMMERCE ENDPOINTS ==========

# Product endpoints
@app.get("/products", response_model=List[Product])
async def get_products(category: str = "", search: str = ""):
    external = _fetch_json("https://dummyjson.com/products?limit=60")
    if isinstance(external, dict):
        payload = external.get("products", [])
        if isinstance(payload, list) and payload:
            live_products: List[Product] = []
            for item in payload:
                if not isinstance(item, dict):
                    continue
                live_products.append(
                    Product(
                        id=int(item.get("id", 0)),
                        seller_id=1,
                        seller_name=str(item.get("brand") or "Marketplace Seller"),
                        seller_avatar="https://ui-avatars.com/api/?name=Seller&background=0f172a&color=ffffff",
                        name=str(item.get("title", "Product")),
                        description=str(item.get("description", "")),
                        price=float(item.get("price", 0)),
                        original_price=float(item.get("price", 0)) / max(0.01, (1 - float(item.get("discountPercentage", 0)) / 100)),
                        image=str(item.get("thumbnail", "https://via.placeholder.com/300")),
                        images=item.get("images") if isinstance(item.get("images"), list) else [],
                        category=str(item.get("category", "General")),
                        rating=float(item.get("rating", 4.0)),
                        reviews=int(item.get("stock", 0)) + 20,
                        sold=int(item.get("stock", 0)) * 3,
                        stock=int(item.get("stock", 0)),
                        shipping_cost=0 if float(item.get("price", 0)) >= 50 else 4.99,
                        estimated_delivery="3-6 days",
                    )
                )

            products: List[Product] = live_products
            if category:
                products = [p for p in products if p.category.lower() == category.lower()]
            if search:
                products = [p for p in products if search.lower() in p.name.lower() or search.lower() in p.description.lower()]
            return products

    products = PRODUCTS
    if category:
        products = [p for p in products if p.category.lower() == category.lower()]
    if search:
        products = [p for p in products if search.lower() in p.name.lower() or search.lower() in p.description.lower()]
    return products

@app.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: int):
    for product in PRODUCTS:
        if product.id == product_id:
            return product
    return {"error": "Product not found"}

@app.get("/products/{product_id}/reviews", response_model=List[Review])
async def get_product_reviews(product_id: int):
    return [r for r in PRODUCTS_REVIEW if r.product_id == product_id]

@app.post("/products/{product_id}/review")
async def add_review(product_id: int, review: Review):
    new_id = max([r.id for r in PRODUCTS_REVIEW]) + 1
    PRODUCTS_REVIEW.append(Review(id=new_id, **review.dict()))
    _persist_state(STATE_KEYS["products_review"], PRODUCTS_REVIEW)
    return {"success": True, "review_id": new_id}

# Seller endpoints
@app.get("/sellers", response_model=List[Seller])
async def get_sellers():
    return SELLERS

@app.get("/sellers/{seller_id}", response_model=Seller)
async def get_seller(seller_id: int):
    for seller in SELLERS:
        if seller.id == seller_id:
            return seller
    return {"error": "Seller not found"}

@app.get("/sellers/{seller_id}/products", response_model=List[Product])
async def get_seller_products(seller_id: int):
    return [p for p in PRODUCTS if p.seller_id == seller_id]

# Cart endpoints
@app.get("/cart/{user_id}")
async def get_cart(user_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    _require_user_access(user_id, current_user)
    return {"items": CART.get(user_id, []), "total": sum(item.quantity * item.price for item in CART.get(user_id, []))}

@app.post("/cart/{user_id}/add")
async def add_to_cart(user_id: int, item: CartItem, current_user: Dict[str, Any] = Depends(get_current_user)):
    _require_user_access(user_id, current_user)
    if user_id not in CART:
        CART[user_id] = []
    CART[user_id].append(item)
    _persist_state(STATE_KEYS["cart"], CART)
    total = sum(ci.quantity * ci.price for ci in CART[user_id])
    return {"success": True, "cart_items": len(CART[user_id]), "total": total}

@app.post("/cart/{user_id}/remove/{product_id}")
async def remove_from_cart(user_id: int, product_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    _require_user_access(user_id, current_user)
    if user_id in CART:
        CART[user_id] = [item for item in CART[user_id] if item.product_id != product_id]
        _persist_state(STATE_KEYS["cart"], CART)
    total = sum(ci.quantity * ci.price for ci in CART.get(user_id, []))
    return {"success": True, "cart_items": len(CART.get(user_id, [])), "total": total}

@app.post("/cart/{user_id}/clear")
async def clear_cart(user_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    _require_user_access(user_id, current_user)
    CART[user_id] = []
    _persist_state(STATE_KEYS["cart"], CART)
    return {"success": True, "message": "Cart cleared"}

# Order endpoints
@app.post("/checkout/{user_id}")
async def checkout(user_id: int, address: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    _require_user_access(user_id, current_user)
    if user_id not in CART or not CART[user_id]:
        return {"error": "Cart is empty"}
    
    total = sum(item.quantity * item.price for item in CART[user_id])
    order_id = max([o.id for o in ORDERS]) + 1 if ORDERS else 1
    order = Order(
        id=order_id,
        user_id=user_id,
        items=CART[user_id],
        total_price=total,
        shipping_address=address,
        status=OrderStatus.PENDING,
        created_at="Now",
        estimated_delivery="3-5 business days"
    )
    ORDERS.append(order)
    CART[user_id] = []
    _persist_state(STATE_KEYS["orders"], ORDERS)
    _persist_state(STATE_KEYS["cart"], CART)
    return {"success": True, "order_id": order_id, "total": total, "status": OrderStatus.PENDING}

@app.get("/orders/{user_id}")
async def get_user_orders(user_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    _require_user_access(user_id, current_user)
    return [o for o in ORDERS if o.user_id == user_id]

@app.get("/orders/{user_id}/{order_id}")
async def get_order(user_id: int, order_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    _require_user_access(user_id, current_user)
    for order in ORDERS:
        if order.id == order_id and order.user_id == user_id:
            return order
    return {"error": "Order not found"}

@app.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: int):
    for order in ORDERS:
        if order.id == order_id and order.status == OrderStatus.PENDING:
            order.status = OrderStatus.CANCELLED
            _persist_state(STATE_KEYS["orders"], ORDERS)
            return {"success": True, "message": "Order cancelled"}
    return {"error": "Order cannot be cancelled"}

# Categories endpoint
@app.get("/categories")
async def get_categories():
    categories = set(p.category for p in PRODUCTS)
    return {"categories": list(categories)}

# ========== STOCKS & FOREX ENDPOINTS ==========

# Stock endpoints
@app.get("/stocks", response_model=List[Stock])
async def get_stocks():
    return STOCKS

@app.get("/stocks/{stock_id}", response_model=Stock)
async def get_stock(stock_id: int):
    for stock in STOCKS:
        if stock.id == stock_id:
            return stock
    return {"error": "Stock not found"}

@app.get("/stocks/symbol/{symbol}", response_model=Stock)
async def get_stock_by_symbol(symbol: str):
    for stock in STOCKS:
        if stock.symbol.upper() == symbol.upper():
            return stock
    return {"error": "Stock not found"}

@app.get("/market/top-gainers")
async def get_top_gainers():
    sorted_stocks = sorted(STOCKS, key=lambda x: x.change, reverse=True)[:5]
    return sorted_stocks

@app.get("/market/top-losers")
async def get_top_losers():
    sorted_stocks = sorted(STOCKS, key=lambda x: x.change)[:5]
    return sorted_stocks

# Forex endpoints
@app.get("/forex", response_model=List[ForexPair])
async def get_forex_pairs():
    return FOREX_PAIRS

@app.get("/forex/{pair_id}", response_model=ForexPair)
async def get_forex_pair(pair_id: int):
    for pair in FOREX_PAIRS:
        if pair.id == pair_id:
            return pair
    return {"error": "Forex pair not found"}

@app.get("/forex/symbol/{symbol}", response_model=ForexPair)
async def get_forex_by_symbol(symbol: str):
    for pair in FOREX_PAIRS:
        if pair.symbol.upper() == symbol.upper():
            return pair
    return {"error": "Forex pair not found"}

# Portfolio endpoints
@app.get("/portfolio/{user_id}", response_model=Portfolio)
async def get_portfolio(user_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    _require_user_access(user_id, current_user)
    return PORTFOLIOS.get(user_id, {"error": "Portfolio not found"})

@app.get("/portfolio/{user_id}/holdings")
async def get_portfolio_holdings(user_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    _require_user_access(user_id, current_user)
    return [h for h in PORTFOLIO_HOLDINGS if h.portfolio_id in [p.id for p in PORTFOLIOS.values() if p.user_id == user_id]]

# Watchlist endpoints
@app.get("/watchlists/{user_id}")
async def get_watchlists(user_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    _require_user_access(user_id, current_user)
    return [w for w in WATCHLISTS if w.user_id == user_id]

@app.post("/watchlists/{user_id}")
async def create_watchlist(user_id: int, name: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    _require_user_access(user_id, current_user)
    new_id = max([w.id for w in WATCHLISTS]) + 1 if WATCHLISTS else 1
    watchlist = Watchlist(id=new_id, user_id=user_id, name=name, created_at="2026-02-22", items=[])
    WATCHLISTS.append(watchlist)
    _persist_state(STATE_KEYS["watchlists"], WATCHLISTS)
    return {"success": True, "watchlist_id": new_id}

@app.post("/watchlists/{watchlist_id}/add/{asset_id}")
async def add_to_watchlist(watchlist_id: int, asset_id: int):
    for watchlist in WATCHLISTS:
        if watchlist.id == watchlist_id:
            if asset_id not in watchlist.items:
                watchlist.items.append(asset_id)
                _persist_state(STATE_KEYS["watchlists"], WATCHLISTS)
            return {"success": True, "items": watchlist.items}
    return {"error": "Watchlist not found"}

# Trading endpoints
@app.get("/trades/{user_id}")
async def get_user_trades(user_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    _require_user_access(user_id, current_user)
    return [t for t in TRADES if t.user_id == user_id]

@app.post("/trade/buy")
async def execute_buy_trade(
    user_id: int,
    symbol: str,
    quantity: float,
    price: float,
    asset_type: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    _require_user_access(user_id, current_user)
    new_id = max([t.id for t in TRADES]) + 1 if TRADES else 1
    total = quantity * price
    trade = Trade(
        id=new_id,
        user_id=user_id,
        symbol=symbol,
        asset_name=symbol,
        type="buy",
        quantity=quantity,
        price=price,
        total_amount=total,
        timestamp="Now",
        asset_type=asset_type
    )
    TRADES.append(trade)
    
    # Update portfolio
    if user_id in PORTFOLIOS:
        PORTFOLIOS[user_id].cash -= total
        PORTFOLIOS[user_id].invested += total
        PORTFOLIOS[user_id].total_value = PORTFOLIOS[user_id].cash + PORTFOLIOS[user_id].invested
    _persist_state(STATE_KEYS["trades"], TRADES)
    _persist_state(STATE_KEYS["portfolios"], PORTFOLIOS)
    
    return {"success": True, "trade_id": new_id, "total_amount": total}

@app.post("/trade/sell")
async def execute_sell_trade(
    user_id: int,
    symbol: str,
    quantity: float,
    price: float,
    asset_type: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    _require_user_access(user_id, current_user)
    new_id = max([t.id for t in TRADES]) + 1 if TRADES else 1
    total = quantity * price
    trade = Trade(
        id=new_id,
        user_id=user_id,
        symbol=symbol,
        asset_name=symbol,
        type="sell",
        quantity=quantity,
        price=price,
        total_amount=total,
        timestamp="Now",
        asset_type=asset_type
    )
    TRADES.append(trade)
    
    # Update portfolio
    if user_id in PORTFOLIOS:
        PORTFOLIOS[user_id].cash += total
        PORTFOLIOS[user_id].invested -= total
        PORTFOLIOS[user_id].total_value = PORTFOLIOS[user_id].cash + PORTFOLIOS[user_id].invested
    _persist_state(STATE_KEYS["trades"], TRADES)
    _persist_state(STATE_KEYS["portfolios"], PORTFOLIOS)
    
    return {"success": True, "trade_id": new_id, "total_amount": total}

# Notifications
class Notification(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str  # order, message, follow, trading, review
    read: bool
    created_at: str

class Review(BaseModel):
    id: int
    product_id: int
    user_id: int
    username: str
    rating: int  # 1-5
    comment: str
    helpful_count: int
    created_at: str

class Wishlist(BaseModel):
    id: int
    user_id: int
    product_id: int
    added_at: str

class Wallet(BaseModel):
    id: int
    user_id: int
    balance: float
    total_spent: float
    total_earned: float
    created_at: str

class ChatMessage(BaseModel):
    id: int
    user_id: int
    seller_id: int
    message: str
    timestamp: str
    read: bool

class Follow(BaseModel):
    id: int
    follower_id: int
    following_id: int
    created_at: str

class Cryptocurrency(BaseModel):
    id: int
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    market_cap: str
    volume: str

class CopyTrade(BaseModel):
    id: int
    trader_id: int
    trader_name: str
    followers: int
    win_rate: float
    roi: float
    total_trades: int
    created_at: str

class LoyaltyPoint(BaseModel):
    id: int
    user_id: int
    points: int
    tier: str  # bronze, silver, gold, platinum
    created_at: str

class Analytics(BaseModel):
    id: int
    user_id: int
    type: str  # seller_sales, user_spending, trade_performance
    data: dict
    timestamp: str

class Settings(BaseModel):
    id: int
    user_id: int
    dark_mode: bool
    language: str  # en, es, fr, de, zh
    notifications_enabled: bool
    created_at: str

# Mock Data
NOTIFICATIONS = [
    {"id": 1, "user_id": 1, "title": "Order Confirmed", "message": "Your order #101 has been confirmed", "type": "order", "read": False, "created_at": "2026-02-22T09:00:00"},
    {"id": 2, "user_id": 1, "title": "New Follower", "message": "jane_smith started following you", "type": "follow", "read": True, "created_at": "2026-02-22T08:30:00"},
    {"id": 3, "user_id": 1, "title": "Trade Alert", "message": "Your stock AAPL gained 5%", "type": "trading", "read": False, "created_at": "2026-02-22T08:00:00"},
]

REVIEWS = [
    {"id": 1, "product_id": 1, "user_id": 2, "username": "jane_smith", "rating": 5, "comment": "Excellent quality, fast shipping!", "helpful_count": 12, "created_at": "2026-02-20"},
    {"id": 2, "product_id": 1, "user_id": 3, "username": "mike_tech", "rating": 4, "comment": "Good product, packaging could be better", "helpful_count": 8, "created_at": "2026-02-19"},
]

WISHLISTS = [
    {"id": 1, "user_id": 1, "product_id": 2, "added_at": "2026-02-21"},
    {"id": 2, "user_id": 1, "product_id": 3, "added_at": "2026-02-20"},
]

WALLETS = [
    {"id": 1, "user_id": 1, "balance": 2500.50, "total_spent": 5200.00, "total_earned": 1200.00, "created_at": "2026-01-01"},
    {"id": 2, "user_id": 2, "balance": 3100.00, "total_spent": 4500.00, "total_earned": 3500.00, "created_at": "2026-01-01"},
]

CHAT_MESSAGES = [
    {"id": 1, "user_id": 1, "seller_id": 101, "message": "Is this product available?", "timestamp": "2026-02-22T10:00:00", "read": True},
    {"id": 2, "user_id": 1, "seller_id": 101, "message": "Yes, it's in stock!", "timestamp": "2026-02-22T10:05:00", "read": False},
]

FOLLOWS = [
    {"id": 1, "follower_id": 1, "following_id": 2, "created_at": "2026-02-18"},
    {"id": 2, "follower_id": 1, "following_id": 3, "created_at": "2026-02-17"},
    {"id": 3, "follower_id": 2, "following_id": 1, "created_at": "2026-02-16"},
]

CRYPTOCURRENCIES = [
    {"id": 1, "symbol": "BTC", "name": "Bitcoin", "price": 43560.00, "change": 1250.00, "change_percent": 2.96, "market_cap": "$850B", "volume": "$28B"},
    {"id": 2, "symbol": "ETH", "name": "Ethereum", "price": 2280.50, "change": 85.50, "change_percent": 3.89, "market_cap": "$273B", "volume": "$12B"},
    {"id": 3, "symbol": "XRP", "name": "Ripple", "price": 2.45, "change": -0.05, "change_percent": -2.0, "market_cap": "$130B", "volume": "$2.5B"},
    {"id": 4, "symbol": "ADA", "name": "Cardano", "price": 0.95, "change": 0.02, "change_percent": 2.15, "market_cap": "$35B", "volume": "$500M"},
]

COPY_TRADERS = [
    {"id": 1, "trader_id": 101, "trader_name": "Pro_Trader_Mike", "followers": 1250, "win_rate": 82.5, "roi": 185.3, "total_trades": 320, "created_at": "2025-06-01"},
    {"id": 2, "trader_id": 102, "trader_name": "Sarah_FX_Expert", "followers": 890, "win_rate": 76.2, "roi": 142.8, "total_trades": 215, "created_at": "2025-08-15"},
    {"id": 3, "trader_id": 103, "trader_name": "Crypto_King_Alex", "followers": 2100, "win_rate": 71.5, "roi": 298.5, "total_trades": 450, "created_at": "2025-04-20"},
]

LOYALTY_POINTS = [
    {"id": 1, "user_id": 1, "points": 2850, "tier": "gold", "created_at": "2026-01-01"},
    {"id": 2, "user_id": 2, "points": 1200, "tier": "silver", "created_at": "2026-01-01"},
    {"id": 3, "user_id": 3, "points": 5600, "tier": "platinum", "created_at": "2026-01-01"},
]

ANALYTICS_DATA = [
    {"id": 1, "user_id": 101, "type": "seller_sales", "data": {"total_sales": 15000, "orders": 342, "revenue": 8500, "avg_rating": 4.7}, "timestamp": "2026-02-22"},
    {"id": 2, "user_id": 1, "type": "user_spending", "data": {"total_spent": 5200, "orders": 28, "avg_order": 185.71, "favorite_category": "Electronics"}, "timestamp": "2026-02-22"},
    {"id": 3, "user_id": 1, "type": "trade_performance", "data": {"total_trades": 45, "win_trades": 32, "loss_trades": 13, "roi": 18.5}, "timestamp": "2026-02-22"},
]

SETTINGS_DATA = [
    {"id": 1, "user_id": 1, "dark_mode": False, "language": "en", "notifications_enabled": True, "created_at": "2026-01-01"},
    {"id": 2, "user_id": 2, "dark_mode": True, "language": "es", "notifications_enabled": True, "created_at": "2026-01-01"},
]

# Notification endpoints
@app.get("/notifications/{user_id}")
async def get_notifications(user_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    _require_user_access(user_id, current_user)
    return [n for n in NOTIFICATIONS if n["user_id"] == user_id]

@app.post("/notifications/{user_id}/read/{notification_id}")
async def mark_notification_read(
    user_id: int,
    notification_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    _require_user_access(user_id, current_user)
    for notif in NOTIFICATIONS:
        if notif["id"] == notification_id and notif["user_id"] == user_id:
            notif["read"] = True
            _persist_state(STATE_KEYS["notifications"], NOTIFICATIONS)
            return {"success": True}
    return {"error": "Notification not found"}

@app.get("/notifications/{user_id}/unread-count")
async def get_unread_count(user_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    _require_user_access(user_id, current_user)
    count = len([n for n in NOTIFICATIONS if n["user_id"] == user_id and not n["read"]])
    return {"unread_count": count}

# Review endpoints
@app.get("/products/{product_id}/reviews")
async def get_product_reviews(product_id: int):
    return [r for r in REVIEWS if r["product_id"] == product_id]

@app.post("/products/{product_id}/reviews")
async def add_review(product_id: int, user_id: int, username: str, rating: int, comment: str):
    new_id = max([r["id"] for r in REVIEWS]) + 1 if REVIEWS else 1
    review = {"id": new_id, "product_id": product_id, "user_id": user_id, "username": username, "rating": rating, "comment": comment, "helpful_count": 0, "created_at": "2026-02-22"}
    REVIEWS.append(review)
    _persist_state(STATE_KEYS["reviews"], REVIEWS)
    return {"success": True, "review_id": new_id}

@app.post("/reviews/{review_id}/helpful")
async def mark_review_helpful(review_id: int):
    for review in REVIEWS:
        if review["id"] == review_id:
            review["helpful_count"] += 1
            _persist_state(STATE_KEYS["reviews"], REVIEWS)
            return {"success": True, "helpful_count": review["helpful_count"]}
    return {"error": "Review not found"}

# Wishlist endpoints
@app.get("/wishlists/{user_id}")
async def get_wishlist(user_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    _require_user_access(user_id, current_user)
    wishlist_items = [w for w in WISHLISTS if w["user_id"] == user_id]
    result = []
    for item in wishlist_items:
        for product in PRODUCTS:
            if product.id == item["product_id"]:
                result.append({**item, "product": product})
    return result

@app.post("/wishlists/{user_id}/add/{product_id}")
async def add_to_wishlist(
    user_id: int,
    product_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    _require_user_access(user_id, current_user)
    if not any(w["user_id"] == user_id and w["product_id"] == product_id for w in WISHLISTS):
        new_id = max([w["id"] for w in WISHLISTS]) + 1 if WISHLISTS else 1
        wishlist = {"id": new_id, "user_id": user_id, "product_id": product_id, "added_at": "2026-02-22"}
        WISHLISTS.append(wishlist)
        _persist_state(STATE_KEYS["wishlists"], WISHLISTS)
        return {"success": True, "wishlist_id": new_id}
    return {"error": "Already in wishlist"}

@app.delete("/wishlists/{user_id}/remove/{product_id}")
async def remove_from_wishlist(
    user_id: int,
    product_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    _require_user_access(user_id, current_user)
    global WISHLISTS
    WISHLISTS = [w for w in WISHLISTS if not (w["user_id"] == user_id and w["product_id"] == product_id)]
    _persist_state(STATE_KEYS["wishlists"], WISHLISTS)
    return {"success": True}

# Wallet endpoints
@app.get("/wallet/{user_id}")
async def get_wallet(user_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    _require_user_access(user_id, current_user)
    for wallet in WALLETS:
        if wallet["user_id"] == user_id:
            return wallet
    return {"error": "Wallet not found"}

@app.post("/wallet/{user_id}/deposit")
async def deposit_to_wallet(
    user_id: int,
    amount: float,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    _require_user_access(user_id, current_user)
    for wallet in WALLETS:
        if wallet["user_id"] == user_id:
            wallet["balance"] += amount
            wallet["total_earned"] += amount
            _persist_state(STATE_KEYS["wallets"], WALLETS)
            return {"success": True, "new_balance": wallet["balance"]}
    return {"error": "Wallet not found"}

@app.post("/wallet/{user_id}/withdraw")
async def withdraw_from_wallet(
    user_id: int,
    amount: float,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    _require_user_access(user_id, current_user)
    for wallet in WALLETS:
        if wallet["user_id"] == user_id:
            if wallet["balance"] >= amount:
                wallet["balance"] -= amount
                wallet["total_spent"] += amount
                _persist_state(STATE_KEYS["wallets"], WALLETS)
                return {"success": True, "new_balance": wallet["balance"]}
            return {"error": "Insufficient balance"}
    return {"error": "Wallet not found"}

# Chat endpoints
@app.get("/chat/{user_id}/{seller_id}")
async def get_chat(
    user_id: int,
    seller_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    _require_user_access(user_id, current_user)
    return [m for m in CHAT_MESSAGES if (m["user_id"] == user_id and m["seller_id"] == seller_id)]

@app.post("/chat/{user_id}/{seller_id}/send")
async def send_chat_message(
    user_id: int,
    seller_id: int,
    message: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    _require_user_access(user_id, current_user)
    new_id = max([m["id"] for m in CHAT_MESSAGES]) + 1 if CHAT_MESSAGES else 1
    msg = {"id": new_id, "user_id": user_id, "seller_id": seller_id, "message": message, "timestamp": "2026-02-22T10:00:00", "read": False}
    CHAT_MESSAGES.append(msg)
    _persist_state(STATE_KEYS["chat_messages"], CHAT_MESSAGES)
    return {"success": True, "message_id": new_id}

# Follow endpoints
@app.get("/followers/{user_id}")
async def get_followers(user_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    _require_user_access(user_id, current_user)
    return [f for f in FOLLOWS if f["following_id"] == user_id]

@app.get("/following/{user_id}")
async def get_following(user_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    _require_user_access(user_id, current_user)
    return [f for f in FOLLOWS if f["follower_id"] == user_id]

@app.post("/follow/{follower_id}/{following_id}")
async def follow_user(
    follower_id: int,
    following_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    _require_user_access(follower_id, current_user)
    if not any(f["follower_id"] == follower_id and f["following_id"] == following_id for f in FOLLOWS):
        new_id = max([f["id"] for f in FOLLOWS]) + 1 if FOLLOWS else 1
        follow = {"id": new_id, "follower_id": follower_id, "following_id": following_id, "created_at": "2026-02-22"}
        FOLLOWS.append(follow)
        _persist_state(STATE_KEYS["follows"], FOLLOWS)
        return {"success": True, "follow_id": new_id}
    return {"error": "Already following"}

@app.delete("/unfollow/{follower_id}/{following_id}")
async def unfollow_user(
    follower_id: int,
    following_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    _require_user_access(follower_id, current_user)
    global FOLLOWS
    FOLLOWS = [f for f in FOLLOWS if not (f["follower_id"] == follower_id and f["following_id"] == following_id)]
    _persist_state(STATE_KEYS["follows"], FOLLOWS)
    return {"success": True}

# Cryptocurrency endpoints
@app.get("/crypto")
async def get_cryptocurrencies():
    coingecko = _fetch_json(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h"
    )
    if isinstance(coingecko, list) and coingecko:
        live = []
        for idx, item in enumerate(coingecko, start=1):
            if not isinstance(item, dict):
                continue
            live.append(
                {
                    "id": idx,
                    "symbol": str(item.get("symbol", "")).upper(),
                    "name": str(item.get("name", "")),
                    "price": float(item.get("current_price", 0)),
                    "change": float(item.get("price_change_24h", 0) or 0),
                    "change_percent": float(item.get("price_change_percentage_24h", 0) or 0),
                    "market_cap": f"${float(item.get('market_cap', 0)) / 1_000_000_000:.2f}B",
                    "volume": f"${float(item.get('total_volume', 0)) / 1_000_000_000:.2f}B",
                }
            )
        if live:
            return live
    return CRYPTOCURRENCIES

@app.get("/crypto/{crypto_id}")
async def get_crypto(crypto_id: int):
    for crypto in CRYPTOCURRENCIES:
        if crypto["id"] == crypto_id:
            return crypto
    return {"error": "Crypto not found"}

@app.post("/crypto/trade/buy")
async def buy_crypto(
    user_id: int,
    symbol: str,
    quantity: float,
    price: float,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    _require_user_access(user_id, current_user)
    total = quantity * price
    if user_id in PORTFOLIOS:
        portfolio = PORTFOLIOS[user_id]
        if isinstance(portfolio, dict):
            portfolio["cash"] -= total
            portfolio["total_value"] -= total
        else:
            portfolio.cash -= total
            portfolio.total_value -= total
        _persist_state(STATE_KEYS["portfolios"], PORTFOLIOS)
    return {"success": True, "symbol": symbol, "quantity": quantity, "total": total}

# Copy Trading endpoints
@app.get("/copy-traders")
async def get_copy_traders():
    return COPY_TRADERS

@app.post("/copy-traders/{trader_id}/follow")
async def follow_copy_trader(
    user_id: int,
    trader_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    _require_user_access(user_id, current_user)
    for trader in COPY_TRADERS:
        if trader["trader_id"] == trader_id:
            trader["followers"] += 1
            _persist_state(STATE_KEYS["copy_traders"], COPY_TRADERS)
            break
    return {"success": True, "message": f"Now copying trades from trader {trader_id}"}

# Loyalty endpoints
@app.get("/loyalty/{user_id}")
async def get_loyalty_points(user_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    _require_user_access(user_id, current_user)
    for lp in LOYALTY_POINTS:
        if lp["user_id"] == user_id:
            return lp
    return {"error": "Loyalty points not found"}

@app.post("/loyalty/{user_id}/add-points")
async def add_loyalty_points(
    user_id: int,
    points: int,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    _require_user_access(user_id, current_user)
    for lp in LOYALTY_POINTS:
        if lp["user_id"] == user_id:
            lp["points"] += points
            if lp["points"] >= 5000:
                lp["tier"] = "platinum"
            elif lp["points"] >= 3000:
                lp["tier"] = "gold"
            elif lp["points"] >= 1000:
                lp["tier"] = "silver"
            _persist_state(STATE_KEYS["loyalty_points"], LOYALTY_POINTS)
            return {"success": True, "new_points": lp["points"], "tier": lp["tier"]}
    return {"error": "User not found"}

# Analytics endpoints
@app.get("/analytics/{user_id}/{analytics_type}")
async def get_analytics(
    user_id: int,
    analytics_type: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    _require_user_access(user_id, current_user)
    analytics = [a for a in ANALYTICS_DATA if a["user_id"] == user_id and a["type"] == analytics_type]
    return analytics if analytics else {"error": "Analytics not found"}

# Settings endpoints
@app.get("/settings/{user_id}")
async def get_settings(user_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    _require_user_access(user_id, current_user)
    for setting in SETTINGS_DATA:
        if setting["user_id"] == user_id:
            return setting
    return {"error": "Settings not found"}

@app.post("/settings/{user_id}/update")
async def update_settings(
    user_id: int,
    dark_mode: bool = None,
    language: str = None,
    notifications_enabled: bool = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    _require_user_access(user_id, current_user)
    for setting in SETTINGS_DATA:
        if setting["user_id"] == user_id:
            if dark_mode is not None:
                setting["dark_mode"] = dark_mode
            if language is not None:
                setting["language"] = language
            if notifications_enabled is not None:
                setting["notifications_enabled"] = notifications_enabled
            _persist_state(STATE_KEYS["settings_data"], SETTINGS_DATA)
            return {"success": True, "settings": setting}
    return {"error": "Settings not found"}


@app.get("/external/news")
async def external_news(query: str = "technology"):
    news_api_key = os.getenv("NEWSAPI_KEY", "").strip()
    if not news_api_key:
        return {"items": [], "source": "newsapi", "note": "Set NEWSAPI_KEY to enable live news"}

    encoded_query = urllib.parse.quote(query)
    url = (
        "https://newsapi.org/v2/everything"
        f"?q={encoded_query}&language=en&sortBy=publishedAt&pageSize=20&apiKey={news_api_key}"
    )
    payload = _fetch_json(url)
    if not isinstance(payload, dict):
        return {"items": [], "source": "newsapi", "note": "News API unavailable"}

    items = payload.get("articles", [])
    return {"items": items if isinstance(items, list) else [], "source": "newsapi"}


@app.get("/external/photos")
async def external_photos(query: str = "market"):
    pexels_key = os.getenv("PEXELS_API_KEY", "").strip()
    if not pexels_key:
        return {"items": [], "source": "pexels", "note": "Set PEXELS_API_KEY to enable live photos"}

    encoded_query = urllib.parse.quote(query)
    url = f"https://api.pexels.com/v1/search?query={encoded_query}&per_page=20&page=1"
    payload = _fetch_json(url, headers={"Authorization": pexels_key})
    if not isinstance(payload, dict):
        return {"items": [], "source": "pexels", "note": "Pexels API unavailable"}

    items = payload.get("photos", [])
    return {"items": items if isinstance(items, list) else [], "source": "pexels"}

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to Social Commerce App API",
        "version": "3.0.0",
        "features": ["Social Media", "E-Commerce", "Messaging", "Stories", "Products", "Orders", "Stocks", "Forex", "Trading"]
    }
