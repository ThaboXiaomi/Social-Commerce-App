import React, {useState} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';

const API_BASE =
  ((((globalThis as any)?.process?.env?.EXPO_PUBLIC_API_BASE_URL as string) || 'http://localhost:8000')
    .trim() || 'http://localhost:8000'
  ).replace(/\/+$/, '');

interface MiniAppsScreenProps {
  onBack: () => void;
  onOpenMap: () => void;
}

interface MiniApp {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  badge?: string;
}

const MINI_APPS: MiniApp[] = [
  {
    id: 'nearby-map',
    title: 'Nearby Map',
    description: 'Nearby places, route ETA, local seller points',
    icon: 'map-search-outline',
    color: '#2563eb',
    badge: 'Live',
  },
  {
    id: 'weather',
    title: 'Weather',
    description: 'Real-time weather using Open-Meteo',
    icon: 'weather-partly-cloudy',
    color: '#16a34a',
  },
  {
    id: 'fx-rates',
    title: 'FX Rates',
    description: 'Live currency rates from Frankfurter',
    icon: 'cash-fast',
    color: '#0ea5e9',
  },
  {
    id: 'world-time',
    title: 'World Time',
    description: 'Timezone and date-time reference',
    icon: 'clock-time-four-outline',
    color: '#7c3aed',
  },
  {
    id: 'market-news',
    title: 'Market News',
    description: 'Latest feed from configured News API',
    icon: 'newspaper-variant-outline',
    color: '#ea580c',
  },
];

function pretty(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function MiniAppsScreen({onBack, onOpenMap}: MiniAppsScreenProps) {
  const [activeId, setActiveId] = useState<string>('nearby-map');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [resultText, setResultText] = useState('Select a mini app to run a live backend action.');

  const runMiniApp = async (miniApp: MiniApp) => {
    setActiveId(miniApp.id);
    setErrorText('');

    if (miniApp.id === 'nearby-map') {
      onOpenMap();
      return;
    }

    setIsLoading(true);
    try {
      let path = '';
      if (miniApp.id === 'weather') {
        path = '/mini-apps/weather?lat=40.7128&lon=-74.0060';
      } else if (miniApp.id === 'fx-rates') {
        path = '/mini-apps/fx?base=USD&symbols=EUR,GBP,NGN';
      } else if (miniApp.id === 'world-time') {
        path = '/mini-apps/time?timezone=America/New_York';
      } else if (miniApp.id === 'market-news') {
        path = '/external/news?query=commerce';
      }

      if (!path) {
        setResultText('No backend path configured for this mini app.');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}${path}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error('Mini app request failed.');
      }

      if (miniApp.id === 'market-news') {
        const items = Array.isArray((payload as any)?.items) ? (payload as any).items.slice(0, 3) : [];
        setResultText(
          items.length > 0
            ? items
                .map((item: any, index: number) => `${index + 1}. ${String(item?.title || 'Untitled')}`)
                .join('\n')
            : pretty(payload)
        );
      } else {
        setResultText(pretty(payload));
      }
    } catch {
      setErrorText('Could not run the selected mini app.');
      setResultText('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={18} color="#0f172a" />
          <Text style={styles.backText}>Back to Chat</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mini Apps</Text>
      </View>

      <Text style={styles.subtitle}>Live tools connected to your backend mini-app endpoints.</Text>

      <View style={styles.grid}>
        {MINI_APPS.map(miniApp => (
          <TouchableOpacity
            key={miniApp.id}
            style={[styles.card, activeId === miniApp.id && styles.cardActive]}
            onPress={() => runMiniApp(miniApp)}>
            <View style={[styles.iconWrap, {backgroundColor: `${miniApp.color}20`} as any]}>
              <MaterialCommunityIcons name={miniApp.icon as any} size={18} color={miniApp.color} />
            </View>
            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>{miniApp.title}</Text>
                {miniApp.badge ? <Text style={styles.badge}>{miniApp.badge}</Text> : null}
              </View>
              <Text style={styles.cardDesc}>{miniApp.description}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#64748b" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>Output</Text>
          {isLoading ? <ActivityIndicator size="small" color="#2563eb" /> : null}
        </View>
        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
        <Text style={styles.resultText}>{resultText || 'No output yet.'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  content: {
    padding: 14,
    paddingBottom: 88,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    marginLeft: 6,
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 12,
  },
  grid: {
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActive: {
    borderColor: '#93c5fd',
    backgroundColor: '#eff6ff',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardBody: {
    flex: 1,
    marginRight: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  cardDesc: {
    marginTop: 3,
    fontSize: 12,
    color: '#64748b',
  },
  resultCard: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#334155',
    fontFamily: 'monospace',
  },
});
