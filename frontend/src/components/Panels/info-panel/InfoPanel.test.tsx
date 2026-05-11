import { render } from '@testing-library/react';
import { InfoPanel } from './InfoPanel';

jest.mock('./InfoPanel.module.css', () => ({}));

describe('InfoPanel', () => {
  test('renders without crashing', () => {
    render(
      <InfoPanel
        activeTab={'route'}
        onTabChange={function (): void {
          throw new Error('Function not implemented.');
        }}
      />,
    );
    expect(true).toBe(true);
  });
});
