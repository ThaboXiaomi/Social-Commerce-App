/**
 * Memoized market row component for efficient list rendering
 */
import React from 'react';
import {View, TouchableOpacity, Image, Text} from 'react-native';
import Sparkline from './Sparkline';

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

interface MarketRowProps {
  stock: Stock;
  index: number;
  onSelect: (stock: Stock) => void;
  styles: any;
}

function MarketRowComponent({stock, index, onSelect, styles}: MarketRowProps) {
  return (
    <TouchableOpacity 
      key={stock.id} 
      style={styles.marketRow} 
      onPress={() => onSelect(stock)}
      activeOpacity={0.7}
    >
      <View style={styles.marketLeft}> 
        <Text style={styles.marketRank}>{index + 1}</Text>
        <Image 
          source={{uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(stock.symbol)}&background=2563eb&color=ffffff`}} 
          style={styles.marketLogo} 
        />
        <View style={styles.marketNameBlock}>
          <Text style={styles.marketName}>{stock.name}</Text>
          <Text style={styles.marketSymbol}>@{stock.symbol}</Text>
        </View>
      </View>

      {/* Sparkline Chart */}
      {stock.chart_data && stock.chart_data.length > 1 && (
        <View style={{marginHorizontal: 8}}>
          <Sparkline 
            data={stock.chart_data} 
            width={50} 
            height={18}
            color={stock.change >= 0 ? '#25D366' : '#FF3B30'}
            lineColor={stock.change >= 0 ? '#d1fae5' : '#fee2e2'}
          />
        </View>
      )}

      <View style={styles.marketMiddle}>
        <Text style={styles.marketPrice}>${stock.price.toFixed(2)}</Text>
        <Text style={[styles.marketChange, {color: stock.change >= 0 ? '#25D366' : '#FF3B30'} as any]}>
          {stock.change >= 0 ? '+' : ''}{stock.change}%
        </Text>
      </View>

      <View style={styles.marketRight}>
        <Text style={styles.marketCap}>{stock.market_cap}</Text>
        <Text style={styles.marketVolume}>{stock.volume}</Text>
      </View>
    </TouchableOpacity>
  );
}

export const MarketRow = React.memo(MarketRowComponent);
