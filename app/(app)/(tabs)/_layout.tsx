import { CalendarCheck, Search, User } from 'lucide-react-native';
import { Tabs } from 'expo-router';

import { colors } from '@/theme/tokens';
import { fontFamily } from '@/theme/typography';

export default function TabsLayout() {
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
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tabs>
  );
}
