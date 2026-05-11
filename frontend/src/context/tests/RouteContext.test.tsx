import { render, screen, fireEvent } from '@testing-library/react';
import { RouteProvider, useRoute } from '../RouteContext';

const TestComponent = () => {
  const { route, setRoute } = useRoute();
  return (
    <div>
      <span data-testid="from">{route.from?.name || 'none'}</span>
      <button
        onClick={() =>
          setRoute({
            from: { id: '1', name: 'Москва', lat: 55.7558, lng: 37.6173 },
            to: null,
            places: [],
          })
        }
      >
        Set Route
      </button>
    </div>
  );
};

describe('RouteContext', () => {
  test('начинается с пустым маршрутом', () => {
    render(
      <RouteProvider>
        <TestComponent />
      </RouteProvider>,
    );
    expect(screen.getByTestId('from')).toHaveTextContent('none');
  });

  test('setRoute обновляет маршрут', () => {
    render(
      <RouteProvider>
        <TestComponent />
      </RouteProvider>,
    );
    const setButton = screen.getByText('Set Route');
    fireEvent.click(setButton);
    expect(screen.getByTestId('from')).toHaveTextContent('Москва');
  });

  test('useRoute выбрасывает ошибку вне провайдера', () => {
    expect(() => render(<TestComponent />)).toThrow('useRoute must be used within RouteProvider');
  });
});
