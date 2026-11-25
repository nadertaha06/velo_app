import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import { SYMBOL_PATH, SYMBOL_VIEWBOX } from './symbolPath';

type Props = { size: number; color?: string };

/** Símbolo da marca (vetor do kit). Decorativo: quem usa decide o rótulo acessível. */
export function VeloSymbol({ size, color = colors.ink }: Props) {
  return (
    <Svg width={size} height={size} viewBox={SYMBOL_VIEWBOX} accessible={false}>
      <Path d={SYMBOL_PATH} fill={color} fillRule="evenodd" />
    </Svg>
  );
}
