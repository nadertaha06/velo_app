import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { userMessage } from '@/api/errors';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { applyFieldErrors } from '@/features/auth/useApplyFieldErrors';
import { useFiltro } from '@/features/explorar/FiltroProvider';
import { PORTES, porteLabel } from '@/features/pedidos/labels';
import { spacing } from '@/theme/tokens';

import { useCriarVeiculo } from './hooks';
import { veiculoSchema, type VeiculoForm } from './schemas';

/**
 * Cadastro mínimo de veículo, para conseguir pedir vaga na etapa 2.
 * Editar e apagar ficam no Perfil (etapa 4).
 */
export function NovoVeiculoScreen() {
  const filtro = useFiltro();
  const criar = useCriarVeiculo();
  const { control, handleSubmit, formState, setError } = useForm<VeiculoForm>({
    resolver: zodResolver(veiculoSchema),
    defaultValues: { placa: '', modelo: '', porte: undefined },
  });

  const onSubmit = handleSubmit((raw) => {
    const v = veiculoSchema.parse(raw);
    criar.mutate(v, {
      onSuccess: (novo) => {
        filtro.set({ veiculoId: novo.id });
        router.back();
      },
      onError: (err) => applyFieldErrors(err, setError, { placa: 'placa', modelo: 'modelo', porte: 'porte' }),
    });
  });

  return (
    <Screen
      title="Novo veículo"
      edges={['bottom']}
      footer={<Button label="Salvar veículo" loading={criar.isPending} onPress={onSubmit} />}
    >
      <AppText tone="muted">A placa só aparece para o dono da vaga e para a portaria depois que a reserva é confirmada.</AppText>
      <FormMessage message={criar.error ? userMessage(criar.error) : null} />
      <Controller
        control={control}
        name="placa"
        render={({ field }) => (
          <TextField
            label="Placa"
            value={field.value}
            onChangeText={(t) => field.onChange(t.toUpperCase())}
            onBlur={field.onBlur}
            error={formState.errors.placa?.message}
            autoCapitalize="characters"
            maxLength={8}
          />
        )}
      />
      <Controller
        control={control}
        name="modelo"
        render={({ field }) => (
          <TextField
            label="Modelo"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={formState.errors.modelo?.message}
            maxLength={60}
          />
        )}
      />
      <Controller
        control={control}
        name="porte"
        render={({ field }) => (
          <View style={styles.porte}>
            <AppText variant="small" weight={600} tone="muted">
              Porte
            </AppText>
            <View style={styles.row}>
              {PORTES.map((p) => (
                <Chip key={p} label={`${p} · ${porteLabel[p]}`} selected={field.value === p} onPress={() => field.onChange(p)} />
              ))}
            </View>
            {formState.errors.porte ? (
              <AppText variant="small" tone="danger">
                {formState.errors.porte.message}
              </AppText>
            ) : null}
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  porte: { gap: spacing.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
