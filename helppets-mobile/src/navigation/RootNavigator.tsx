import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, useNavigationContainerRef, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { analytics } from '../observability/analytics';
import { AccountScreen } from '../screens/AccountScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { ChatDetailScreen } from '../screens/ChatDetailScreen';
import { ChatsScreen } from '../screens/ChatsScreen';
import { CreateAlertScreen } from '../screens/CreateAlertScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { PetDetailScreen } from '../screens/PetDetailScreen';
import { PetListScreen } from '../screens/PetListScreen';
import { ZonesScreen } from '../screens/ZonesScreen';
import { useAppSelector } from '../store/hooks';
import { colors } from '../theme';
import type { AppStackParamList, AuthStackParamList, TabParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

const tabIcon = (emoji: string) => ({ focused }: { focused: boolean }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
);

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="Home" component={HomeScreen} options={{ title: 'HelpPets', tabBarLabel: 'Inicio', tabBarIcon: tabIcon('🏠') }} />
      <Tabs.Screen name="Zones" component={ZonesScreen} options={{ title: 'Alertas por zona', tabBarLabel: 'Zonas', tabBarIcon: tabIcon('📍') }} />
      <Tabs.Screen name="CreateAlert" component={CreateAlertScreen} options={{ title: 'Crear alerta', tabBarLabel: 'Publicar', tabBarIcon: tabIcon('➕') }} />
      <Tabs.Screen name="Chats" component={ChatsScreen} options={{ title: 'Chats', tabBarIcon: tabIcon('💬') }} />
      <Tabs.Screen name="Account" component={AccountScreen} options={{ title: 'Cuenta', tabBarIcon: tabIcon('👤') }} />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const status = useAppSelector((s) => s.auth.status);
  const navRef = useNavigationContainerRef();
  const currentRoute = useRef<string | undefined>(undefined);

  /** Tracking de pantallas en un solo lugar: cada cambio de ruta se informa a Clarity. */
  const onStateChange = () => {
    const name = navRef.getCurrentRoute()?.name;
    if (name && name !== currentRoute.current) {
      currentRoute.current = name;
      analytics.screen(name);
    }
  };

  if (status === 'checking') {
    // Mientras Firebase restaura la sesión desde AsyncStorage (evita "parpadeo" del login).
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy }}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navRef}
      theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: colors.primary, background: colors.bg } }}
      onReady={onStateChange}
      onStateChange={onStateChange}
    >
      {/* Navegación condicional por estado de auth: no hay "redirect" manual tras login/logout. */}
      {status === 'authenticated' ? (
        <AppStack.Navigator screenOptions={{ headerTintColor: colors.primary, headerBackButtonDisplayMode: 'minimal' }}>
          <AppStack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
          <AppStack.Screen name="PetList" component={PetListScreen} options={({ route }) => ({ title: route.params.title })} />
          <AppStack.Screen name="PetDetail" component={PetDetailScreen} options={{ title: 'Detalle de mascota' }} />
          <AppStack.Screen name="ChatDetail" component={ChatDetailScreen} options={({ route }) => ({ title: route.params.title })} />
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
