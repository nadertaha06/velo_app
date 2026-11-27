import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { userMessage } from '@/api/errors';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { erroFotoLocal, escolherFoto, type FotoPronta, type Origem } from '@/lib/foto';
import { toApiInstant } from '@/lib/format';
import { serverNow } from '@/lib/serverClock';
import { colors, radius, spacing } from '@/theme/tokens';

import { useAvisar } from './hooks';

const DESDE = [
  { label: 'Agora', min: 0 },
  { label: 'Há 15 min', min: 15 },
  { label: 'Há 30 min', min: 30 },
  { label: 'Há 1 hora', min: 60 },
] as const;

/**
 * Quem alugou avisa que a vaga não estava livre (backend D78). O app manda desde
 * quando, um relato e uma foto opcionais; prazo, janela e reembolso são do backend.
 */
export function NaoEntregueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const avisar = useAvisar(id);
  const [desde, setDesde] = useState<number>(0);
  const [relato, setRelato] = useState('');
  const [foto, setFoto] = useState<FotoPronta | null>(null);
  const [erroFoto, setErroFoto] = useState<string | null>(null);
  const [fotoFalhou, setFotoFalhou] = useState(false);

  async function pegar(origem: Origem) {
    setErroFoto(null);
    try {
      const f = await escolherFoto(origem);
      if (f) setFoto(f);
    } catch (err) {
      setErroFoto(erroFotoLocal(err) ?? userMessage(err));
    }
  }

  function enviar() {
    avisar.mutate(
      {
        desde: toApiInstant(new Date(serverNow() - desde * 60_000)),
        relato: relato.trim() || null,
        foto,
      },
      {
        onSuccess: (r) => {
          if (r.fotoFalhou) setFotoFalhou(true);
          else router.back();
        },
      },
    );
  }

  if (fotoFalhou) {
    return (
      <Screen title="Aviso enviado" edges={['bottom']}>
        <AppText tone="muted">
          O aviso chegou ao responsável, mas a foto não foi enviada. O aviso vale sem ela.
        </AppText>
        <Button label="Voltar ao pedido" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen
      title="A vaga não estava livre"
      edges={['bottom']}
      footer={<Button label="Enviar aviso" loading={avisar.isPending} onPress={enviar} />}
    >
      <AppText tone="muted">
        O responsável pela vaga tem um prazo para confirmar ou contestar. Confirmado, ou sem resposta,
        você recebe o reembolso. Se ele contestar, a equipe do Velo decide.
      </AppText>
      <AppText weight={700} accessibilityRole="header">
        Desde quando a vaga está ocupada?
      </AppText>
      <View style={styles.chips}>
        {DESDE.map((d) => (
          <Chip key={d.min} label={d.label} selected={desde === d.min} onPress={() => setDesde(d.min)} />
        ))}
      </View>
      <TextField
        label="O que você encontrou? (opcional)"
        value={relato}
        onChangeText={setRelato}
        maxLength={500}
        multiline
      />
      <AppText weight={700} accessibilityRole="header">
        Foto (opcional)
      </AppText>
      <AppText variant="small" tone="muted">
        Só a equipe do Velo vê esta foto. A localização e os outros dados da foto são removidos.
      </AppText>
      {foto ? (
        <View style={styles.preview}>
          <Image source={{ uri: foto.uri }} style={styles.img} accessibilityLabel="Foto escolhida" />
          <Button variant="ghost" label="Remover foto" onPress={() => setFoto(null)} />
        </View>
      ) : (
        <View style={styles.chips}>
          <Button variant="secondary" label="Câmera" onPress={() => void pegar('camera')} />
          <Button variant="secondary" label="Galeria" onPress={() => void pegar('galeria')} />
        </View>
      )}
      <FormMessage message={erroFoto} />
      <FormMessage message={avisar.error ? userMessage(avisar.error) : null} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  preview: { gap: spacing.sm },
  img: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.card, backgroundColor: colors.surface },
});
