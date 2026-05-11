import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeContext';

const TestComponent = () => {
  const { theme, toggleTheme, themeIcon } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="theme-icon">{themeIcon}</span>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  test('использует значение по умолчанию "light"', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
  });

  test('восстанавливает тему из localStorage', () => {
    localStorage.setItem('theme', 'dark');
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });

  test('переключает тему при вызове toggleTheme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );
    const button = screen.getByText('Toggle');
    fireEvent.click(button);
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });

  test('сохраняет тему в localStorage при переключении', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );
    const button = screen.getByText('Toggle');
    fireEvent.click(button);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  test('устанавливает атрибут data-theme на html элементе', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );
    const button = screen.getByText('Toggle');
    fireEvent.click(button);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  test('возвращает правильную иконку для темы', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme-icon')).toHaveTextContent('/icons/lightTheme.svg');
  });
});
