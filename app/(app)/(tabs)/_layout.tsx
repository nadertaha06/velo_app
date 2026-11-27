import { CalendarCheck, Inbox, Search, User } from 'lucide-react-native';
import { Tabs } from 'expo-router';

import { useActiveVinculo } from '@/features/vinculo/useActiveVinculo';
import { colors } from '@/theme/tokens';
import { fontFamily } from '@/theme/typography';

export default function TabsLayout() {
  // Pedidos recebidos: só o responsável vê a aba (conforto; a permissão real é do backend).
  const responsavel = useActiveVinculo().papel === 'responsavel';
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fontFamily(600) },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Explorar', tabBarIcon: ({ color, size }) => <Search color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="reservas"
        options={{ title: 'Reservas', tabBarIcon: ({ color, size }) => <CalendarCheck color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="recebidos"
        options={{
          title: 'Recebidos',
          href: responsavel ? undefined : null,
          tabBarIcon: ({ color, size }) => <Inbox color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tabs>
  );
}
