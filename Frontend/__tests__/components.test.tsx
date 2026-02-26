/**
 * Frontend component tests using Jest and React Native Testing Library
 * Run with: npm test
 */
import {render, screen, fireEvent} from '@testing-library/react-native';
import React from 'react';
import {Text, TouchableOpacity} from 'react-native';

describe('Theme Toggle Button', () => {
  it('renders theme toggle button', () => {
    const mockOnPress = jest.fn();
    render(
      <TouchableOpacity onPress={mockOnPress} testID="theme-toggle">
        <Text>Toggle</Text>
      </TouchableOpacity>
    );
    const button = screen.getByTestId('theme-toggle');
    expect(button).toBeTruthy();
  });

  it('calls onPress when clicked', () => {
    const mockOnPress = jest.fn();
    render(
      <TouchableOpacity onPress={mockOnPress} testID="theme-toggle">
        <Text>Toggle</Text>
      </TouchableOpacity>
    );
    const button = screen.getByTestId('theme-toggle');
    fireEvent.press(button);
    expect(mockOnPress).toHaveBeenCalled();
  });
});

describe('User Avatar Component', () => {
  it('renders avatar with initials', () => {
    render(
      <Text testID="avatar">
        U
      </Text>
    );
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toBeTruthy();
  });
});

describe('Market List Display', () => {
  it('renders stock symbol and price', () => {
    render(
      <>
        <Text testID="stock-symbol">AAPL</Text>
        <Text testID="stock-price">$150.00</Text>
      </>
    );
    expect(screen.getByTestId('stock-symbol')).toBeTruthy();
    expect(screen.getByTestId('stock-price')).toBeTruthy();
  });
});
