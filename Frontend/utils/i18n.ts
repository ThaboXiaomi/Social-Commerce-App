/**
 * Internationalization (i18n) configuration
 */

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'pt';

export const i18nStrings: Record<Locale, Record<string, string>> = {
  en: {
    'app.title': 'UniHub',
    'app.tagline': 'Connect, shop, and trade in one place',
    'nav.home': 'Home',
    'nav.market': 'Market',
    'nav.shop': 'Shop',
    'nav.chat': 'Chat',
    'nav.profile': 'Profile',
    'feed.title': 'Your Daily Feed',
    'feed.subtitle': 'Curated social updates from your communities',
    'market.title': 'Trade Smarter',
    'market.subtitle': 'Monitor stocks and your portfolio in one place',
    'btn.buy': 'Buy',
    'btn.sell': 'Sell',
    'btn.loading': 'Loading...',
    'error.network': 'Network error. Please try again.',
    'error.auth': 'Authentication failed.',
    'success.tradeComplete': 'Trade completed successfully',
    'placeholder.search': 'Search...',
    'label.price': 'Price',
    'label.change24h': '24h Change',
    'label.marketCap': 'Market Cap',
  },
  es: {
    'app.title': 'UniHub',
    'nav.home': 'Inicio',
    'nav.market': 'Mercado',
    'nav.shop': 'Tienda',
    'nav.chat': 'Chat',
    'nav.profile': 'Perfil',
    'btn.buy': 'Comprar',
    'btn.sell': 'Vender',
  },
  fr: {
    'app.title': 'UniHub',
    'nav.home': 'Accueil',
    'nav.market': 'Marché',
    'nav.shop': 'Boutique',
    'nav.chat': 'Chat',
    'nav.profile': 'Profil',
    'btn.buy': 'Acheter',
    'btn.sell': 'Vendre',
  },
  de: {
    'app.title': 'UniHub',
    'nav.home': 'Startseite',
    'nav.market': 'Markt',
    'nav.shop': 'Shop',
    'nav.chat': 'Chat',
    'nav.profile': 'Profil',
    'btn.buy': 'Kaufen',
    'btn.sell': 'Verkaufen',
  },
  pt: {
    'app.title': 'UniHub',
    'nav.home': 'Início',
    'nav.market': 'Mercado',
    'nav.shop': 'Loja',
    'nav.chat': 'Chat',
    'nav.profile': 'Perfil',
    'btn.buy': 'Comprar',
    'btn.sell': 'Vender',
  },
};

export const getLocalizedString = (key: string, locale: Locale = 'en'): string => {
  return i18nStrings[locale][key] || i18nStrings.en[key] || key;
};

export const formatNumber = (num: number, locale: Locale = 'en'): string => {
  const formatterMap: Record<Locale, Intl.Locale> = {
    en: new Intl.Locale('en-US'),
    es: new Intl.Locale('es-ES'),
    fr: new Intl.Locale('fr-FR'),
    de: new Intl.Locale('de-DE'),
    pt: new Intl.Locale('pt-BR'),
  };
  return new Intl.NumberFormat(formatterMap[locale]).format(num);
};

export const formatCurrency = (num: number, locale: Locale = 'en'): string => {
  const currencyMap: Record<Locale, string> = {en: 'USD', es: 'EUR', fr: 'EUR', de: 'EUR', pt: 'BRL'};
  return new Intl.NumberFormat(locale, {style: 'currency', currency: currencyMap[locale]}).format(num);
};
