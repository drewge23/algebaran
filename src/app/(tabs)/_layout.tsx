import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';

export const unstable_settings = { initialRouteName: 'home' };

export default function TabsLayout() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.backgroundElement,
          borderTopColor: theme.border,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <Icon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: t('tabs.shop'),
          tabBarIcon: ({ color }) => <Icon name="shop" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => <Icon name="profile" color={color} />,
        }}
      />
    </Tabs>
  );
}
