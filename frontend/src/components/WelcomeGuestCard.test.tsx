import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { WelcomeGuestCard } from './WelcomeGuestCard';

describe('WelcomeGuestCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('does not render when visible is false', () => {
    const { container } = render(
      <WelcomeGuestCard nome="João Silva" fotoUrl="/api/clientes/1/foto/1" visible={false} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders welcome message with first name and photo', () => {
    render(
      <WelcomeGuestCard
        nome="João Silva"
        fotoUrl="/api/clientes/1/foto/1"
        visible
      />,
    );

    expect(screen.getByTestId('welcome-guest-card')).toBeInTheDocument();
    expect(screen.getByText('Bem-vindo(a)')).toBeInTheDocument();
    expect(screen.getByText('João')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'João Silva' })).toHaveAttribute(
      'src',
      '/api/clientes/1/foto/1',
    );
    expect(screen.queryByText(/acesso liberado/i)).not.toBeInTheDocument();
  });
});
