import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Home } from './Home';
import { ThemeProvider } from '../../context/ThemeContext';

jest.mock('../../components/transport-icon/TransportIcon', () => ({
  TransportIcon: () => null,
}));

jest.mock('../../components/Panels/map-panel/MapPanel', () => ({
  MapPanel: () => null,
}));

jest.mock('../../components/Panels/input-panel/InputPanel', () => ({
  InputPanel: () => <div data-testid="mock-input-panel">Input Panel</div>,
}));

jest.mock('../../components/Panels/info-panel/InfoPanel', () => ({
  InfoPanel: () => <div data-testid="mock-info-panel">Info Panel</div>,
}));

jest.mock('../../components/Header/Header', () => ({
  Header: () => <div data-testid="mock-header">Header</div>,
}));

jest.mock('../../components/Landing/Landing', () => ({
  Landing: () => <div data-testid="mock-landing">Landing Section</div>,
}));

jest.mock('../../components/home-info/HomeInfo', () => ({
  HomeInfo: () => <div data-testid="mock-home-info">Home Info Section</div>,
}));

jest.mock('../../components/Footer/Footer', () => ({
  Footer: () => <div data-testid="mock-footer">Footer</div>,
}));

jest.mock('../../hooks/useReverseGeocode', () => ({
  useReverseGeocode: () => ({
    reverseGeocode: jest.fn().mockResolvedValue('Mock Address'),
  }),
}));

jest.mock('../../context/PlaceCacheContext', () => ({
  usePlaceCache: () => ({
    preloadPlace: jest.fn(),
    getCachedData: jest.fn(),
    setCachedData: jest.fn(),
  }),
  PlaceCacheProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Home Page', () => {
  test('отображает все основные секции', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <Home />
        </ThemeProvider>
      </BrowserRouter>,
    );

    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-landing')).toBeInTheDocument();
    expect(screen.getByTestId('mock-home-info')).toBeInTheDocument();
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
  });
});
