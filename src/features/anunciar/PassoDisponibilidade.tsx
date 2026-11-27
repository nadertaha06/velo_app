import { useState } from 'react';

import { userMessage } from '@/api/errors';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FormMessage } from '@/components/FormMessage';
import { TextField } from '@/components/TextField';
import { formatPeriod } from '@/lib/format';

import type { VagaGestao } from './api';
import { periodoDeDias } from './campos';
import { useDisponibilidade } from './hooks';

/**
 * Períodos em que a vaga pode ser alugada, de um dia a outro (inclusive), no fuso
 * de São Paulo. Sobreposição e outras regras quem confere é o backend.
 */
export function PassoDisponibilidade({
  vaga,
  final,
  onVoltar,
}: {
  vaga: VagaGestao;
  final: React.ReactNode;
  onVoltar: () => void;
}) {
  const { add, remover } = useDisponibilidade(vaga.id);
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [local, setLocal] = useState<string | null>(null);

  function adicionar() {
    const p = periodoDeDias(de, ate);
    if (!p) {
      setLocal('Use datas no formato DD/MM/AAAA, com o fim igual ou depois do início.');
      return;
    }
    setLocal(null);
    add.mutate(p, {
      onSuccess: () => {
        setDe('');
        setAte('');
      },
    });
  }

  return (
    <>
      <AppText tone="muted">Quando a vaga pode ser alugada. Os pedidos só cabem dentro desses períodos.</AppText>
      {vaga.disponibilidades.length === 0 ? <AppText tone="muted">Nenhum período ainda.</AppText> : null}
      {vaga.disponibilidades.map((d) => (
        <Card key={d.id}>
          <AppText weight={600}>{formatPeriod(d.inicio, d.fim)}</AppText>
          <Button variant="ghost" label="Remover período" onPress={() => remover.mutate(d.id)} />
        </Card>
      ))}
      <TextField label="De (DD/MM/AAAA)" value={de} onChangeText={setDe} keyboardType="numbers-and-punctuation" placeholder="01/12/2026" />
      <TextField label="Até (DD/MM/AAAA)" value={ate} onChangeText={setAte} keyboardType="numbers-and-punctuation" placeholder="31/12/2026" />
      <FormMessage message={local ?? (add.error ? userMessage(add.error) : remover.error ? userMessage(remover.error) : null)} />
      <Button variant="secondary" label="Adicionar período" loading={add.isPending} onPress={adicionar} />
      {final}
      <Button variant="ghost" label="Voltar" onPress={onVoltar} />
    </>
  );
}
