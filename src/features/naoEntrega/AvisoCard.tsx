import { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { userMessage } from '@/api/errors';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Countdown } from '@/components/Countdown';
import { FormMessage } from '@/components/FormMessage';
import { TextField } from '@/components/TextField';
import { formatDateTime } from '@/lib/format';
import { serverNow } from '@/lib/serverClock';
import { spacing } from '@/theme/tokens';

import type { AvisoNaoEntrega } from './api';
import { useResponderAviso } from './hooks';
import { avisoResumo } from './labels';

const MAX_TEXTO = 500;

/** Situação do aviso, para quem alugou (só leitura). */
export function AvisoLocatarioCard({ aviso }: { aviso: AvisoNaoEntrega }) {
  const { titulo, texto } = avisoResumo(aviso, 'feito');
  return (
    <Card>
      <AppText weight={700}>{titulo}</AppText>
      <AppText variant="small" tone="muted">
        Vaga ocupada desde {formatDateTime(aviso.desde)}.
      </AppText>
      <AppText tone="muted">{texto}</AppText>
      {aviso.status === 'aguardando_dono' ? (
        <AppText variant="small" tone="subtle">
          Prazo do responsável até {formatDateTime(aviso.prazo_dono_em)}
        </AppText>
      ) : null}
    </Card>
  );
}

/**
 * Para o responsável da vaga: confirmar (a vaga estava ocupada) ou contestar, com
 * contador do prazo. O contador é visual; quem decide o prazo é o backend.
 */
export function AvisoDonoCard({ pedidoId, aviso }: { pedidoId: string; aviso: AvisoNaoEntrega }) {
  const qc = useQueryClient();
  const responder = useResponderAviso(pedidoId);
  const [modo, setModo] = useState<'nada' | 'confirmar' | 'contestar'>('nada');
  const [texto, setTexto] = useState('');
  const onFim = useCallback(() => void qc.invalidateQueries({ queryKey: ['aviso-nao-entrega'] }), [qc]);
  const { titulo, texto: resumo } = avisoResumo(aviso, 'recebido');
  const aguardando = aviso.status === 'aguardando_dono';

  return (
    <Card>
      <AppText weight={700}>{titulo}</AppText>
      <AppText variant="small" tone="muted">
        Ocupada desde {formatDateTime(aviso.desde)}.
      </AppText>
      {aviso.relato ? <AppText>“{aviso.relato}”</AppText> : null}
      <AppText tone="muted">{resumo}</AppText>
      {aguardando ? (
        <>
          <AppText variant="small" tone="muted">
            Responda até {formatDateTime(aviso.prazo_dono_em)}
          </AppText>
          <Countdown ate={aviso.prazo_dono_em} onFim={onFim} now={serverNow} />
        </>
      ) : null}
      {aviso.contestacao ? (
        <AppText variant="small" tone="muted">
          Sua contestação: “{aviso.contestacao}”
        </AppText>
      ) : null}
      <FormMessage message={responder.error ? userMessage(responder.error) : null} />
      {aguardando && modo === 'nada' ? (
        <View style={styles.acoes}>
          <Button label="Confirmar que estava ocupada" onPress={() => setModo('confirmar')} />
          <Button variant="secondary" label="Contestar" onPress={() => setModo('contestar')} />
        </View>
      ) : null}
      {aguardando && modo === 'confirmar' ? (
        <>
          <AppText variant="small" tone="muted">
            Quem alugou recebe o reembolso, e a não entrega conta para a suspensão da vaga.
          </AppText>
          <Button
            label="Confirmar"
            loading={responder.isPending}
            onPress={() => responder.mutate({ acao: 'confirmar' })}
          />
          <Button variant="ghost" label="Voltar" onPress={() => setModo('nada')} />
        </>
      ) : null}
      {aguardando && modo === 'contestar' ? (
        <>
          <TextField
            label="O que aconteceu?"
            hint="A equipe do Velo lê os dois lados e decide."
            value={texto}
            onChangeText={setTexto}
            maxLength={MAX_TEXTO}
            multiline
          />
          <Button
            label="Enviar contestação"
            disabled={texto.trim().length === 0}
            loading={responder.isPending}
            onPress={() => responder.mutate({ acao: 'contestar', texto: texto.trim() })}
          />
          <Button variant="ghost" label="Voltar" onPress={() => setModo('nada')} />
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({ acoes: { gap: spacing.sm } });
