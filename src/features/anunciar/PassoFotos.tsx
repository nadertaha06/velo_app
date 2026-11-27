import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { userMessage } from '@/api/errors';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Checkbox } from '@/components/Checkbox';
import { FormMessage } from '@/components/FormMessage';
import { IconButton } from '@/components/IconButton';
import { erroFotoLocal, escolherFoto, type Origem } from '@/lib/foto';
import { colors, radius, spacing } from '@/theme/tokens';

import { MAX_FOTOS, type VagaGestao } from './api';
import { useFotos } from './hooks';

/** Texto do aviso (spec do app, seção 6; design Foto.dc.html). */
export const AVISO_FOTO = 'Fotografe só a vaga vazia: sem carros, placas ou pessoas';

/**
 * Fotos da vaga. O aviso precisa ser confirmado antes de abrir a câmera ou a
 * galeria (a API exige `aviso_confirmado: true`). Toda foto vira JPEG antes de subir.
 */
export function PassoFotos({ vaga, onVoltar, onContinuar }: { vaga: VagaGestao; onVoltar: () => void; onContinuar: () => void }) {
  const { enviar, remover } = useFotos(vaga.id);
  const [aviso, setAviso] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const [recusada, setRecusada] = useState(false);
  // Pendentes ainda contam no limite do backend; rejeitadas não.
  const fotos = vaga.fotos.filter((f) => f.status !== 'rejeitada');
  const cheio = fotos.length >= MAX_FOTOS;

  async function adicionar(origem: Origem) {
    setErroLocal(null);
    setRecusada(false);
    try {
      const foto = await escolherFoto(origem);
      if (!foto) return;
      const r = await enviar.mutateAsync(foto);
      if (r.status === 'rejeitada') setRecusada(true);
    } catch (err) {
      setErroLocal(erroFotoLocal(err) ?? userMessage(err));
    }
  }

  return (
    <>
      <Card dark>
        <AppText weight={800} tone="onInk">
          Fotografe só a vaga vazia
        </AppText>
        <AppText tone="onInk">• Sem carros, nem o seu nem o dos vizinhos</AppText>
        <AppText tone="onInk">• Sem placas visíveis</AppText>
        <AppText tone="onInk">• Sem pessoas</AppText>
        <AppText variant="small" tone="onInk">
          Fotos com placas ou pessoas podem ser removidas pelo síndico.
        </AppText>
      </Card>
      <Checkbox label="Entendi. Minhas fotos mostram só a vaga vazia." checked={aviso} onChange={setAviso} />

      <View style={styles.grade}>
        {fotos.map((f, i) => (
          <View key={f.id} style={styles.foto}>
            {f.url ? (
              <Image source={{ uri: f.url }} style={styles.img} accessibilityLabel={`Foto ${i + 1} da vaga`} />
            ) : (
              <View style={[styles.img, styles.processando]}>
                <AppText variant="small" tone="muted">
                  Processando…
                </AppText>
              </View>
            )}
            {i === 0 ? (
              <View style={styles.capa}>
                <AppText variant="caption" weight={700}>
                  Capa
                </AppText>
              </View>
            ) : null}
            <View style={styles.remover}>
              <IconButton accessibilityLabel={`Remover foto ${i + 1}`} onPress={() => remover.mutate(f.id)}>
                <X color={colors.ink} size={18} />
              </IconButton>
            </View>
          </View>
        ))}
      </View>

      <AppText variant="small" tone="muted">
        {fotos.length} de {MAX_FOTOS} fotos · a localização e outros dados da foto são removidos.
      </AppText>
      {recusada ? (
        <FormMessage message="Essa foto não foi aceita (o arquivo não parece uma imagem válida). Tente outra." />
      ) : null}
      <FormMessage message={erroLocal ?? (remover.error ? userMessage(remover.error) : null)} />

      {!cheio ? (
        <View style={styles.linha}>
          <View style={styles.flex}>
            <Button
              variant="secondary"
              label="Câmera"
              disabled={!aviso}
              loading={enviar.isPending}
              onPress={() => void adicionar('camera')}
            />
          </View>
          <View style={styles.flex}>
            <Button
              variant="secondary"
              label="Galeria"
              disabled={!aviso}
              loading={enviar.isPending}
              onPress={() => void adicionar('galeria')}
            />
          </View>
        </View>
      ) : null}
      {!aviso && !cheio ? (
        <AppText variant="small" tone="subtle">
          Confirme o aviso para adicionar fotos.
        </AppText>
      ) : null}
      <Button label="Continuar" onPress={onContinuar} />
      <Button variant="ghost" label="Voltar" onPress={onVoltar} />
    </>
  );
}

const styles = StyleSheet.create({
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  foto: { width: '48%' },
  img: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.card, backgroundColor: colors.surface },
  processando: { alignItems: 'center', justifyContent: 'center' },
  capa: {
    position: 'absolute',
    left: spacing.sm,
    top: spacing.sm,
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  remover: { position: 'absolute', right: spacing.xs, top: spacing.xs },
  linha: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
