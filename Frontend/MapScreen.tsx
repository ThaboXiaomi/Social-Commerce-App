import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';

const API_BASE =
  ((((globalThis as any)?.process?.env?.EXPO_PUBLIC_API_BASE_URL as string) || 'http://localhost:8000')
    .trim() || 'http://localhost:8000'
  ).replace(/\/+$/, '');
const DEFAULT_LAT = 40.7128;
const DEFAULT_LON = -74.006;

interface MapScreenProps {
  onBack: () => void;
}

interface MapSpot {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  lat: number;
  lon: number;
  distance_km?: number;
}

interface RouteInfo {
  distance_km?: number;
  duration_minutes?: number;
  eta_minutes?: number;
}

interface MapPoint extends MapSpot {
  x: number;
  y: number;
}

export default function MapScreen({onBack}: MapScreenProps) {
  const [query, setQuery] = useState('');
  const [origin, setOrigin] = useState({lat: DEFAULT_LAT, lon: DEFAULT_LON, label: 'New York'});
  const [spots, setSpots] = useState<MapSpot[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [routeById, setRouteById] = useState<Record<string, RouteInfo>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const visibleSpots = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return spots;
    }
    return spots.filter(
      spot =>
        spot.title.toLowerCase().includes(keyword) ||
        spot.subtitle.toLowerCase().includes(keyword) ||
        spot.category.toLowerCase().includes(keyword)
    );
  }, [query, spots]);

  const mapPoints = useMemo<MapPoint[]>(() => {
    if (visibleSpots.length === 0) {
      return [];
    }
    const lats = visibleSpots.map(spot => spot.lat);
    const lons = visibleSpots.map(spot => spot.lon);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const latRange = Math.max(maxLat - minLat, 0.01);
    const lonRange = Math.max(maxLon - minLon, 0.01);

    return visibleSpots.map(spot => ({
      ...spot,
      x: 10 + ((spot.lon - minLon) / lonRange) * 80,
      y: 10 + ((maxLat - spot.lat) / latRange) * 80,
    }));
  }, [visibleSpots]);

  const selectedSpot = useMemo(() => {
    return spots.find(spot => spot.id === selectedId) ?? visibleSpots[0] ?? null;
  }, [selectedId, spots, visibleSpots]);

  const fetchNearby = async (lat: number, lon: number) => {
    setIsLoading(true);
    setErrorText('');
    try {
      const response = await fetch(
        `${API_BASE}/map/nearby?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(
          String(lon)
        )}&radius_m=2500&limit=24`
      );
      const payload = await response.json();
      if (!response.ok || !Array.isArray(payload)) {
        throw new Error('Unable to load nearby places.');
      }

      const normalized: MapSpot[] = payload
        .map((item: any, index: number) => ({
          id: String(item?.id ?? `poi_${index}`),
          title: String(item?.title ?? 'Nearby place'),
          subtitle: String(item?.subtitle ?? ''),
          category: String(item?.category ?? 'place'),
          lat: Number(item?.lat ?? 0),
          lon: Number(item?.lon ?? 0),
          distance_km:
            typeof item?.distance_km === 'number' ? Number(item.distance_km) : undefined,
        }))
        .filter(item => Number.isFinite(item.lat) && Number.isFinite(item.lon));

      setSpots(normalized);
      setSelectedId(normalized[0]?.id ?? '');
      setRouteById({});
      if (normalized.length === 0) {
        setErrorText('No nearby places found for this area.');
      }
    } catch {
      setErrorText('Unable to load map data from backend.');
      setSpots([]);
      setSelectedId('');
    } finally {
      setIsLoading(false);
    }
  };

  const searchLocation = async () => {
    const term = query.trim();
    if (!term) {
      await fetchNearby(origin.lat, origin.lon);
      return;
    }

    setIsLoading(true);
    setErrorText('');
    try {
      const response = await fetch(
        `${API_BASE}/map/geocode?q=${encodeURIComponent(term)}&limit=1`
      );
      const payload = await response.json();
      if (!response.ok || !Array.isArray(payload) || payload.length === 0) {
        throw new Error('Location not found');
      }

      const first = payload[0] || {};
      const lat = Number(first.lat);
      const lon = Number(first.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        throw new Error('Invalid coordinates');
      }
      setOrigin({
        lat,
        lon,
        label: String(first.title || first.subtitle || term),
      });
      await fetchNearby(lat, lon);
    } catch {
      setIsLoading(false);
      setErrorText('Could not geocode that location.');
    }
  };

  const openSpot = async (spot: MapSpot) => {
    setSelectedId(spot.id);
    if (routeById[spot.id]) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/map/route?start_lat=${origin.lat}&start_lon=${origin.lon}&end_lat=${spot.lat}&end_lon=${spot.lon}&profile=driving`
      );
      const payload = await response.json();
      if (!response.ok) {
        return;
      }
      setRouteById(prev => ({
        ...prev,
        [spot.id]: {
          distance_km:
            typeof payload?.distance_km === 'number' ? Number(payload.distance_km) : undefined,
          duration_minutes:
            typeof payload?.duration_minutes === 'number'
              ? Number(payload.duration_minutes)
              : undefined,
          eta_minutes:
            typeof payload?.eta_minutes === 'number' ? Number(payload.eta_minutes) : undefined,
        },
      }));
    } catch {}
  };

  useEffect(() => {
    fetchNearby(origin.lat, origin.lon);
  }, []);

  const selectedRoute = selectedSpot ? routeById[selectedSpot.id] : undefined;
  const selectedEta =
    selectedRoute?.eta_minutes ??
    (typeof selectedSpot?.distance_km === 'number' ? Math.max(2, Math.round(selectedSpot.distance_km * 3)) : null);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={18} color="#0f172a" />
          <Text style={styles.backText}>Back to Shop</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Map</Text>
      </View>

      <Text style={styles.subtitle}>Live nearby places around {origin.label}.</Text>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={16} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search a city or address"
            placeholderTextColor="#94a3b8"
            onSubmitEditing={searchLocation}
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={searchLocation}>
          <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

      <View style={styles.mapCard}>
        <View style={styles.mapSurface}>
          <View style={styles.horizontalLineTop} />
          <View style={styles.horizontalLineMid} />
          <View style={styles.horizontalLineBottom} />
          <View style={styles.verticalLineLeft} />
          <View style={styles.verticalLineMid} />
          <View style={styles.verticalLineRight} />

          {isLoading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="small" color="#2563eb" />
            </View>
          ) : (
            mapPoints.map(spot => (
              <TouchableOpacity
                key={spot.id}
                style={[
                  styles.pin,
                  {left: `${spot.x}%`, top: `${spot.y}%`},
                  selectedId === spot.id && styles.pinActive,
                ]}
                onPress={() => openSpot(spot)}>
                <MaterialCommunityIcons name="map-marker" size={16} color="#fff" />
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>

      <View style={styles.listSection}>
        <Text style={styles.listTitle}>Nearby Places</Text>
        {visibleSpots.length === 0 ? (
          <Text style={styles.emptyText}>No places match your search.</Text>
        ) : (
          visibleSpots.map(spot => (
            <TouchableOpacity
              key={spot.id}
              style={[styles.spotCard, selectedId === spot.id && styles.spotCardActive]}
              onPress={() => openSpot(spot)}>
              <View style={styles.spotTextWrap}>
                <Text style={styles.spotTitle}>{spot.title}</Text>
                <Text style={styles.spotSubtitle}>{spot.subtitle || spot.category}</Text>
              </View>
              <Text style={styles.spotEta}>
                {typeof spot.distance_km === 'number' ? `${spot.distance_km.toFixed(1)} km` : '--'}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {selectedSpot && (
        <View style={styles.footerCard}>
          <Text style={styles.footerLabel}>Selected</Text>
          <Text style={styles.footerTitle}>{selectedSpot.title}</Text>
          <Text style={styles.footerMeta}>{selectedSpot.subtitle || selectedSpot.category}</Text>
          <Text style={styles.footerMeta}>
            ETA: {selectedEta !== null ? `${selectedEta} min` : '--'} | Distance:{' '}
            {typeof selectedRoute?.distance_km === 'number'
              ? `${selectedRoute.distance_km.toFixed(1)} km`
              : typeof selectedSpot.distance_km === 'number'
                ? `${selectedSpot.distance_km.toFixed(1)} km`
                : '--'}
          </Text>
        </View>
      )}
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  searchButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    marginLeft: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    marginBottom: 10,
  },
  mapCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
    padding: 10,
  },
  mapSurface: {
    height: 260,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    overflow: 'hidden',
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalLineTop: {
    position: 'absolute',
    top: '25%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(37,99,235,0.18)',
  },
  horizontalLineMid: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(37,99,235,0.18)',
  },
  horizontalLineBottom: {
    position: 'absolute',
    top: '75%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(37,99,235,0.18)',
  },
  verticalLineLeft: {
    position: 'absolute',
    left: '25%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(37,99,235,0.18)',
  },
  verticalLineMid: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(37,99,235,0.18)',
  },
  verticalLineRight: {
    position: 'absolute',
    left: '75%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(37,99,235,0.18)',
  },
  pin: {
    position: 'absolute',
    marginLeft: -12,
    marginTop: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinActive: {
    backgroundColor: '#0f172a',
  },
  listSection: {
    marginTop: 12,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
  },
  spotCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spotCardActive: {
    borderColor: '#93c5fd',
    backgroundColor: '#eff6ff',
  },
  spotTextWrap: {
    flex: 1,
    marginRight: 10,
  },
  spotTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  spotSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  spotEta: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  footerCard: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 12,
  },
  footerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  footerTitle: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  footerMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748b',
  },
});
