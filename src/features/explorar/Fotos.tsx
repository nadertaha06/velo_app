import { useState } from 'react';
import { Image, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, radius, spacing } from '@/theme/tokens';

import type { VagaAnuncio } from './api';

/** Fotos válidas da vaga (URL assinada de curta duração, vinda da API). */
export function Fotos({ fotos }: { fotos: VagaAnuncio['fotos'] }) {
  const { width } = useWindowDimensions();
  const [atual, setAtual] = useState(0);
  const validas = fotos.filter((f): f is typeof f & { url: string } => !!f.url);
  const w = width - spacing.xl * 2;

  if (validas.length === 0) {
    return (
      <View style={[styles.vazio, { width: w }]}>
        <AppText variant="small" tone="subtle">
          Sem fotos
        </AppText>
      </View>
    );
  }
  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setAtual(Math.round(e.nativeEvent.contentOffset.x / w))}
        style={{ width: w, borderRadius: radius.cardLarge }}
      >
        {validas.map((f, i) => (
          <Image
            key={f.id}
            source={{ uri: f.url }}
            style={{ width: w, height: w * 0.62 }}
            accessibilityLabel={`Foto ${i + 1} de ${validas.length} da vaga`}
          />
        ))}
      </ScrollView>
      <AppText variant="caption" tone="subtle" style={styles.contador}>
        foto {atual + 1}/{validas.length}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  vazio: {
    height: 120,
    borderRadius: radius.cardLarge,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contador: { marginTop: spacing.xs },
});
