import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, View } from 'react-native';

import { userMessage } from '@/api/errors';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { vagaTitulo } from '@/features/explorar/VagaCard';
import { formatDate } from '@/lib/format';
import { colors, radius, spacing } from '@/theme/tokens';

import type { Convite, Membro, VagaGestao } from './api';
import {
  useConvidar,
  useConvites,
  useMembros,
  useReenviarConvite,
  useRemoverMembro,
  useRevogarConvite,
  useSubconta,
  useVagasDaUnidade,
} from './hooks';
import { vagaSituacao } from './labels';

/** Responsável: vaga da unidade, membros e convites (spec do app, etapa 3). */
export function MinhaUnidadeScreen() {
  return (
    <Screen title="Minha unidade" edges={['bottom']}>
      <Vagas />
      <Membros />
      <Convites />
    </Screen>
  );
}

function Titulo({ children }: { children: string }) {
  return (
    <AppText variant="bodyLarge" weight={800} accessibilityRole="header">
      {children}
    </AppText>
  );
}

function Vagas() {
  const vagas = useVagasDaUnidade();
  const subconta = useSubconta();
  return (
    <>
      <Titulo>Vaga</Titulo>
      {vagas.isLoading ? <ActivityIndicator color={colors.ink} accessibilityLabel="Carregando vagas" /> : null}
      <FormMessage message={vagas.error ? userMessage(vagas.error) : null} />
      {vagas.data?.map((v) => <ItemVaga key={v.id} vaga={v} />)}
      {subconta.data && subconta.data.status !== 'ativa' ? (
        <AppText variant="small" tone="muted">
          A vaga só aparece para os vizinhos com a conta de recebimento ativa. O cadastro dessa conta chega
          junto com o pagamento real.
        </AppText>
      ) : null}
      <Button
        variant={vagas.data?.length ? 'secondary' : 'primary'}
        label="Anunciar vaga"
        onPress={() => router.push({ pathname: '/anunciar/[id]', params: { id: 'nova' } })}
      />
    </>
  );
}

function ItemVaga({ vaga: v }: { vaga: VagaGestao }) {
  const s = vagaSituacao(v);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${vagaTitulo(v)}. ${s.label}. Editar`}
      onPress={() => router.push({ pathname: '/anunciar/[id]', params: { id: v.id } })}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <Badge label={s.label} tone={s.tone} />
      <AppText weight={700}>{vagaTitulo(v)}</AppText>
      {s.detalhe ? (
        <AppText variant="small" tone="muted">
          {s.detalhe}
        </AppText>
      ) : null}
    </Pressable>
  );
}

function Membros() {
  const membros = useMembros();
  const remover = useRemoverMembro();
  const [removendo, setRemovendo] = useState<string | null>(null);
  const lista = membros.data?.filter((m) => m.papel === 'membro') ?? [];
  return (
    <>
      <Titulo>Membros</Titulo>
      <AppText variant="small" tone="muted">
        Cada pessoa da unidade tem a própria conta. Membros alugam vagas de outras unidades com o próprio
        pagamento, mas não anunciam nem aprovam pedidos.
      </AppText>
      {membros.isLoading ? <ActivityIndicator color={colors.ink} accessibilityLabel="Carregando membros" /> : null}
      <FormMessage message={membros.error ? userMessage(membros.error) : null} />
      {membros.data && lista.length === 0 ? <AppText tone="muted">Nenhum membro ainda.</AppText> : null}
      {lista.map((m: Membro) => (
        <Card key={m.id}>
          <AppText weight={700}>{m.nome}</AppText>
          {removendo === m.id ? (
            <>
              <AppText variant="small" tone="muted">
                A pessoa perde o acesso na hora. As reservas futuras que ela fez são canceladas com reembolso
                integral.
              </AppText>
              <FormMessage message={remover.error ? userMessage(remover.error) : null} />
              <Button
                label={`Remover ${m.nome}`}
                loading={remover.isPending}
                onPress={() => remover.mutate(m.id, { onSuccess: () => setRemovendo(null) })}
              />
              <Button variant="ghost" label="Voltar" onPress={() => setRemovendo(null)} />
            </>
          ) : (
            <Button variant="ghost" label="Remover da unidade" onPress={() => setRemovendo(m.id)} />
          )}
        </Card>
      ))}
    </>
  );
}

async function compartilhar(link: string) {
  // O link tem o token do convite: só vai para a folha de compartilhar, nunca para log.
  await Share.share({ message: `Convite para entrar na unidade no Velo: ${link}` });
}

function Convites() {
  const convites = useConvites();
  const convidar = useConvidar();
  const reenviar = useReenviarConvite();
  const revogar = useRevogarConvite();
  const [email, setEmail] = useState('');
  // Link só em memória, enquanto a tela está aberta.
  const [link, setLink] = useState<string | null>(null);
  const abertos = convites.data?.filter((c) => c.status === 'aberto') ?? [];
  const erro = convidar.error ?? reenviar.error ?? revogar.error;

  return (
    <>
      <Titulo>Convidar membro</Titulo>
      <TextField
        label="E-mail (opcional)"
        hint="Com e-mail, o convite vai por e-mail. Sem, você compartilha o link."
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <Button
        label="Criar convite"
        loading={convidar.isPending}
        onPress={() =>
          convidar.mutate(email.trim() || null, {
            onSuccess: (r) => {
              setLink(r.link);
              setEmail('');
            },
          })
        }
      />
      <FormMessage message={erro ? userMessage(erro) : null} />
      {link ? (
        <View style={styles.link}>
          <AppText variant="small" weight={600} tone="muted">
            Link do convite (vale por 7 dias, uma vez só)
          </AppText>
          <AppText mono selectable variant="small" accessibilityLabel="Link do convite">
            {link}
          </AppText>
          <Button variant="secondary" label="Compartilhar link" onPress={() => void compartilhar(link)} />
        </View>
      ) : null}
      {abertos.length > 0 ? (
        <AppText variant="small" weight={700} tone="subtle" accessibilityRole="header">
          Convites em aberto
        </AppText>
      ) : null}
      {abertos.map((c: Convite) => (
        <Card key={c.id}>
          <AppText variant="small" tone="muted">
            Criado em {formatDate(c.created_at)} · vale até {formatDate(c.expires_at)}
          </AppText>
          <Button
            variant="ghost"
            label="Gerar link novo"
            onPress={() => reenviar.mutate(c.id, { onSuccess: (r) => setLink(r.link) })}
          />
          <Button variant="ghost" label="Revogar convite" onPress={() => revogar.mutate(c.id)} />
        </Card>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  item: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg, gap: spacing.xs },
  pressed: { opacity: 0.85 },
  link: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border },
});
