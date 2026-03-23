import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from './Layout';

// Stub out Sidebar to keep the Layout test focused on Layout itself.
vi.mock('./Sidebar', () => ({
  default: () => <aside data-testid="sidebar">Sidebar</aside>,
}));

describe('Layout', () => {
  const renderLayout = (children = <p>Child content</p>) =>
    render(
      <MemoryRouter>
        <Layout>{children}</Layout>
      </MemoryRouter>
    );

  it('renders the sidebar', () => {
    renderLayout();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('renders its children inside the main element', () => {
    renderLayout(<p>Hello Layout</p>);
    expect(screen.getByText('Hello Layout')).toBeInTheDocument();
  });

  it('wraps content in an app-container div', () => {
    const { container } = renderLayout();
    expect(container.querySelector('.app-container')).not.toBeNull();
  });

  it('wraps children in a main.main-content element', () => {
    const { container } = renderLayout(<span>Main child</span>);
    const main = container.querySelector('main.main-content');
    expect(main).not.toBeNull();
    expect(main).toHaveTextContent('Main child');
  });
});
