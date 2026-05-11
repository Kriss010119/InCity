import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from './Header';
import { ThemeProvider } from '../../context/ThemeContext';

jest.mock('../../context/ThemeContext', () => ({
  ...jest.requireActual('../../context/ThemeContext'),
  useTheme: () => ({
    theme: 'light',
    toggleTheme: jest.fn(),
    themeIcon: '/icons/lightTheme.svg',
  }),
}));

describe('Header Component', () => {
  const renderHeader = () => {
    return render(
      <BrowserRouter>
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      </BrowserRouter>,
    );
  };

  test('отображает логотип и название', () => {
    renderHeader();
    expect(screen.getByText('InCity')).toBeInTheDocument();
    expect(screen.getByAltText('T-Bank')).toBeInTheDocument();
  });

  test('отображает навигационные ссылки', () => {
    renderHeader();
    expect(screen.getByText('Главная')).toBeInTheDocument();
    expect(screen.getByText('Карта')).toBeInTheDocument();
  });

  test('имеет ссылку на Т-Путешествия', () => {
    renderHeader();
    const link = screen.getByRole('link', { name: /t-bank/i });
    expect(link).toHaveAttribute('href', 'https://www.tbank.ru/travel/');
  });

  test('кнопка переключения темы присутствует', () => {
    renderHeader();
    const themeButton = screen.getByRole('button', { name: /toggle theme/i });
    expect(themeButton).toBeInTheDocument();
  });
});
