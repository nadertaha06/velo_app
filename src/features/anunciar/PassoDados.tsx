import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { TextField } from '@/components/TextField';
import { PORTES, porteLabel } from '@/features/pedidos/labels';
import { spacing } from '@/theme/tokens';

import type { VagaGestao } from './api';

const medida = z
  .string()
  .trim()
  .regex(/^\d{2,4}$/, 'Em centímetros, só números.')
  .refine((v) => Number(v) >= 50 && Number(v) <= 2000, 'Entre 50 e 2000 cm.');
const texto = (max: number, msg: string) =>
  z
    .string()
    .trim()
    .min(1, msg)
    .max(max)
    .regex(/^[\p{L}\p{N}_ .\-/]+$/u, 'Use letras, números, espaço, ponto, hífen ou barra.');

/** Espelha os limites do backend (VagaIn) só para feedback; quem valida é o backend. */
export const dadosSchema = z.object({
  numero: texto(20, 'Informe o número da vaga.'),
  andar: texto(10, 'Informe o andar.'),
  coberta: z.boolean(),
  largura_cm: medida,
  comprimento_cm: medida,
  altura_cm: medida,
  porte_maximo: z.enum(PORTES),
});
export type Dados = z.infer<typeof dadosSchema>;

export function dadosIniciais(v: VagaGestao | undefined): Dados {
  return {
    numero: v?.numero ?? '',
    andar: v?.andar ?? '',
    coberta: v?.coberta ?? true,
    largura_cm: v ? String(v.largura_cm) : '',
    comprimento_cm: v ? String(v.comprimento_cm) : '',
    altura_cm: v ? String(v.altura_cm) : '',
    porte_maximo: (v?.porte_maximo as Dados['porte_maximo']) ?? 'M',
  };
}

export function dadosParaApi(d: Dados) {
  return {
    numero: d.numero.trim(),
    andar: d.andar.trim(),
    coberta: d.coberta,
    largura_cm: Number(d.largura_cm),
    comprimento_cm: Number(d.comprimento_cm),
    altura_cm: Number(d.altura_cm),
    porte_maximo: d.porte_maximo,
  };
}

export function PassoDados({ inicial, onContinuar }: { inicial: Dados; onContinuar: (d: Dados) => void }) {
  const { control, handleSubmit, formState } = useForm<Dados>({
    resolver: zodResolver(dadosSchema),
    defaultValues: inicial,
  });
  const e = formState.errors;
  const campo = (name: 'numero' | 'andar' | 'largura_cm' | 'comprimento_cm' | 'altura_cm', label: string, numeric = false) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <TextField
          label={label}
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={e[name]?.message}
          keyboardType={numeric ? 'number-pad' : 'default'}
          autoCapitalize="characters"
        />
      )}
    />
  );
  return (
    <>
      {campo('andar', 'Andar')}
      {campo('numero', 'Número da vaga')}
      <AppText weight={700}>Coberta?</AppText>
      <Controller
        control={control}
        name="coberta"
        render={({ field }) => (
          <View style={styles.chips}>
            <Chip label="Coberta" selected={field.value} onPress={() => field.onChange(true)} />
            <Chip label="Descoberta" selected={!field.value} onPress={() => field.onChange(false)} />
          </View>
        )}
      />
      <AppText weight={700}>Medidas (cm)</AppText>
      {campo('largura_cm', 'Largura (cm)', true)}
      {campo('comprimento_cm', 'Comprimento (cm)', true)}
      {campo('altura_cm', 'Altura livre (cm)', true)}
      <AppText weight={700}>Maior porte que cabe</AppText>
      <Controller
        control={control}
        name="porte_maximo"
        render={({ field }) => (
          <View style={styles.chips}>
            {PORTES.map((p) => (
              <Chip key={p} label={porteLabel[p]} selected={field.value === p} onPress={() => field.onChange(p)} />
            ))}
          </View>
        )}
      />
      <Button label="Continuar" onPress={handleSubmit(onContinuar)} />
    </>
  );
}

const styles = StyleSheet.create({ chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm } });
