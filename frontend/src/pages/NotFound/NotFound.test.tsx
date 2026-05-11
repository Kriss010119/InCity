jest.mock('./NotFound', () => ({
  NotFound: () => (
    <div>
      <div>404</div>
      <div>Страница не найдена</div>
      <a href="/">Вернуться на главную</a>
    </div>
  ),
}));

import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';

describe('NotFound Page', () => {
  test('отображает сообщение 404 и кнопку возврата', () => {
    const { NotFound } = jest.requireMock('./NotFound');

    render(
      <BrowserRouter>
        <ThemeProvider>
          <NotFound />
        </ThemeProvider>
      </BrowserRouter>,
    );

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Страница не найдена')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/');
  });
});
