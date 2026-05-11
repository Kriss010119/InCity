jest.mock('./Landing.module.css', () => ({}));

import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Landing } from './Landing';
import { ThemeProvider } from '../../context/ThemeContext';

jest.mock('../transport-icon/TransportIcon', () => ({
  TransportIcon: ({ type }: { type: string }) => <div data-testid={`transport-${type}`}>Icon</div>,
}));

describe('Landing Component', () => {
  const renderLanding = () => {
    return render(
      <BrowserRouter>
        <ThemeProvider>
          <Landing />
        </ThemeProvider>
      </BrowserRouter>,
    );
  };

  beforeEach(() => {
    window.scrollTo = jest.fn();
    document.getElementById = jest.fn().mockReturnValue({
      getBoundingClientRect: () => ({ top: 100 }),
    });
  });

  test('отображает заголовок', () => {
    renderLanding();
    expect(
      screen.getByText(/Исследуй маршруты и открывай новое вместе с InCity/i),
    ).toBeInTheDocument();
  });

  test('отображает подзаголовок', () => {
    renderLanding();
    expect(screen.getByText(/Путешествия, события и достопримечательности/i)).toBeInTheDocument();
  });

  test('отображает кнопку "Построить маршрут"', () => {
    renderLanding();
    const button = screen.getByRole('link', { name: /Построить маршрут/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('href', '#form');
  });

  test('отображает анимированные иконки транспорта', () => {
    renderLanding();
    expect(screen.getByTestId('transport-car')).toBeInTheDocument();
    expect(screen.getByTestId('transport-plane')).toBeInTheDocument();
    expect(screen.getByTestId('transport-train')).toBeInTheDocument();
  });

  test('клик по кнопке вызывает плавный скролл к форме', () => {
    renderLanding();
    const button = screen.getByRole('link', { name: /Построить маршрут/i });
    fireEvent.click(button);
    expect(window.scrollTo).toHaveBeenCalled();
  });
});
