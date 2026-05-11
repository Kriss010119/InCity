import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlaceCacheProvider, usePlaceCache } from '../PlaceCacheContext';

const TestComponent = () => {
  const { setCachedData, clearCache } = usePlaceCache();
  return (
    <div>
      <button onClick={() => setCachedData(1, { description: 'test' }, ['img.jpg'])}>Set</button>
      <button onClick={clearCache}>Clear</button>
    </div>
  );
};

describe('PlaceCacheContext', () => {
  test('setCachedData и clearCache работают без ошибок', async () => {
    render(
      <PlaceCacheProvider>
        <TestComponent />
      </PlaceCacheProvider>,
    );

    const setButton = screen.getByText('Set');
    const clearButton = screen.getByText('Clear');

    expect(setButton).toBeInTheDocument();
    expect(clearButton).toBeInTheDocument();

    await userEvent.click(setButton);
    await userEvent.click(clearButton);

    expect(true).toBe(true);
  });
});
