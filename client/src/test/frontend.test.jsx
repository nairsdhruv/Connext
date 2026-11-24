import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage } from '../pages/SignupPage';
import { HotspotCard } from '../components/HotspotCard';
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import {
  calculateHaversineDistance,
  formatDistance,
  formatDuration,
  CATEGORY_CONFIG
} from '../services/mapService';

const renderWithProviders = (ui) => {
  return render(
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>{ui}</AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
};

describe('1. Map Utilities & Telemetry Calculations', () => {
  it('correctly calculates Haversine distance in meters between two points', () => {
    // Distance between Cubbon Park and Indiranagar 100ft road (~5.5km)
    const dist = calculateHaversineDistance(12.9763, 77.5925, 12.9719, 77.6412);
    expect(dist).toBeGreaterThan(5000);
    expect(dist).toBeLessThan(6000);
  });

  it('formats distance in meters and kilometers nicely', () => {
    expect(formatDistance(450)).toBe('450 m');
    expect(formatDistance(1250)).toBe('1.3 km');
    expect(formatDistance(5000)).toBe('5.0 km');
  });

  it('formats duration in minutes and hours', () => {
    expect(formatDuration(300)).toBe('5 mins');
    expect(formatDuration(3600)).toBe('1 hr 0 min');
    expect(formatDuration(5400)).toBe('1 hr 30 min');
  });

  it('contains all required social categories with styling configs', () => {
    const requiredCategories = [
      'cafes',
      'parks',
      'college',
      'libraries',
      'walking_running',
      'study_groups',
      'board_games',
      'music',
      'food',
      'casual_chat',
      'sports'
    ];
    for (const cat of requiredCategories) {
      expect(CATEGORY_CONFIG[cat]).toBeDefined();
      expect(CATEGORY_CONFIG[cat].color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('2. Frontend Views & UI Components', () => {
  it('renders the LandingPage with clear headline and navigation links', () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByText(/Break the isolation/i)).toBeInTheDocument();
    expect(screen.getByText(/Discover real-world moments/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explore Live Map/i })).toBeInTheDocument();
  });

  it('renders the LoginPage with email, password fields, and demo accounts', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('heading', { name: /Sign in to your account/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Alex \(Demo\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Priya \(Demo\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Sam \(Demo\)/i)).toBeInTheDocument();
  });

  it('renders the SignupPage with registration fields', () => {
    renderWithProviders(<SignupPage />);
    expect(screen.getByRole('heading', { name: /Join the Community/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Maya Patel/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/At least 6 characters/i)).toBeInTheDocument();
  });

  it('renders a HotspotCard with category badge, address, and view button', () => {
    const mockHotspot = {
      _id: 'mock-1',
      name: 'Cubbon Park Morning Walk',
      description: 'Meet at the bamboo grove for an open mindful morning walk.',
      category: 'walking_running',
      type: 'meetup',
      location: { coordinates: [77.5925, 12.9763] },
      address: 'Cubbon Park Central Gate, Bengaluru',
      attendees: [{ user: 'user-1' }],
      capacity: 25,
      startDateTime: new Date().toISOString()
    };

    render(
      <HotspotCard
        hotspot={mockHotspot}
        isSelected={false}
        onSelect={() => {}}
      />
    );

    expect(screen.getByText('Cubbon Park Morning Walk')).toBeInTheDocument();
    expect(screen.getByText(/Cubbon Park Central Gate/i)).toBeInTheDocument();
    expect(screen.getByText(/Scheduled Meetup/i)).toBeInTheDocument();
    expect(screen.getByText(/View & Chat/i)).toBeInTheDocument();
  });
});
