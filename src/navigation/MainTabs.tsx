import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  FolderClosed,
  User,
  Home,
  Calendar,
  Stethoscope,
} from 'lucide-react-native';
import { colors } from '../theme';

// Telas
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { AgendaScreen } from '../screens/main/AgendaScreen';
import { EvolutionScreen } from '../screens/main/EvolutionScreen';
import { VaultScreen } from '../screens/main/VaultScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';

import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          height: 65,
          paddingBottom: 10,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="AgendaTab"
        component={AgendaScreen}
        options={{
          tabBarLabel: 'Agenda',
          tabBarIcon: ({ color, size }) => (
            <Calendar color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="EvolutionTab"
        component={EvolutionScreen}
        options={{
          tabBarLabel: 'Saúde',
          tabBarIcon: ({ color, size }) => (
            <Stethoscope color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="VaultTab"
        component={VaultScreen}
        options={{
          tabBarLabel: 'Cofre',
          tabBarIcon: ({ color, size }) => (
            <FolderClosed color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};
