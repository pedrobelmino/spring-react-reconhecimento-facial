import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AccessFeedbackOverlay } from './AccessFeedbackOverlay';

describe('AccessFeedbackOverlay', () => {
  afterEach(() => {
    cleanup();
  });

  it('does not render when visible is false', () => {
    const { container } = render(
      <AccessFeedbackOverlay
        outcome="LIBERADO"
        nome="João Silva"
        fotoUrl="/api/clientes/1/foto/1"
        visible={false}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders liberado variant with green background, photo, name and message', () => {
    render(
      <AccessFeedbackOverlay
        outcome="LIBERADO"
        nome="João Silva"
        fotoUrl="/api/clientes/1/foto/1"
        visible
      />,
    );

    const overlay = screen.getByTestId('access-feedback-overlay');
    expect(overlay).toHaveClass('bg-access-granted/90');
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Acesso liberado')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'João Silva' })).toHaveAttribute(
      'src',
      '/api/clientes/1/foto/1',
    );
  });

  it('renders negado variant without photo for unknown face', () => {
    render(<AccessFeedbackOverlay outcome="NEGADO" visible />);

    const overlay = screen.getByTestId('access-feedback-overlay');
    expect(overlay).toHaveClass('bg-access-denied/90');
    expect(screen.getByText('Acesso negado')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders negado variant with photo and name for inactive client', () => {
    render(
      <AccessFeedbackOverlay
        outcome="NEGADO"
        nome="Maria Santos"
        fotoUrl="/api/clientes/2/foto/1"
        visible
      />,
    );

    const overlay = screen.getByTestId('access-feedback-overlay');
    expect(overlay).toHaveClass('bg-access-denied/90');
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    expect(screen.getByText('Acesso negado')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Maria Santos' })).toBeInTheDocument();
  });
});
