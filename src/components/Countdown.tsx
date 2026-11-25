import { useEffect, useState } from 'react';

import { formatDuration } from '@/lib/format';

import { AppText } from './AppText';

type Props = {
  /** Instante ISO do fim do prazo, vindo do backend. */
  ate: string;
  /** Chamado uma vez quando o contador chega a zero (ex.: consultar o pedido de novo). */
  onFim?: () => void;
  now?: () => number;
};

/**
 * Contador visual. Quem decide se o prazo expirou é o backend (spec, seção 4):
 * ao chegar a zero, o texto muda e a tela consulta o pedido de novo.
 */
export function Countdown({ ate, onFim, now = Date.now }: Props) {
  const alvo = new Date(ate).getTime();
  const [agora, setAgora] = useState(now);
  const restante = alvo - agora;

  useEffect(() => {
    if (alvo - now() <= 0) return;
    const id = setInterval(() => {
      const t = now();
      setAgora(t);
      if (alvo - t <= 0) {
        clearInterval(id);
        onFim?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [alvo, now, onFim]);

  const texto = restante > 0 ? formatDuration(restante) : 'Prazo encerrado';
  return (
    <AppText variant="titleLarge" weight={800} accessibilityLabel={`Tempo restante: ${texto}`}>
      {texto}
    </AppText>
  );
}
