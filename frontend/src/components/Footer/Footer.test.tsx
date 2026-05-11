import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Footer } from './Footer';
import { ThemeProvider } from '../../context/ThemeContext';

describe('Footer Component', () => {
  const renderFooter = () => {
    return render(
      <BrowserRouter>
        <ThemeProvider>
          <Footer />
        </ThemeProvider>
      </BrowserRouter>,
    );
  };

  test('отображает название приложения', () => {
    renderFooter();
    expect(screen.getByText('InCity')).toBeInTheDocument();
  });

  test('отображает навигационные ссылки', () => {
    renderFooter();
    expect(screen.getByText('Главная')).toBeInTheDocument();
    expect(screen.getByText('Карта')).toBeInTheDocument();
    expect(screen.getByText('Т-Путешествия')).toBeInTheDocument();
    expect(screen.getByText('НИУ ВШЭ')).toBeInTheDocument();
  });

  test('ссылка на Т-Путешествия открывается в новой вкладке', () => {
    renderFooter();
    const link = screen.getByText('Т-Путешествия').closest('a');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('отображает информацию о разработчиках', () => {
    renderFooter();
    expect(screen.getByText(/Осиной Дарьей и Кудрявцевым Георгием/i)).toBeInTheDocument();
  });

  test('отображает копирайт', () => {
    renderFooter();
    expect(screen.getByText(/© 2026 InCity/i)).toBeInTheDocument();
  });
});
