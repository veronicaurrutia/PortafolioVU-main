import type { NavigatorScreenParams } from '@react-navigation/native';
import type { PetStatus } from '../types/models';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type TabParamList = {
  Home: undefined;
  Zones: undefined;
  CreateAlert: undefined;
  Chats: undefined;
  Account: undefined;
};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  PetList: { status: PetStatus; title: string };
  PetDetail: { petId: string };
  ChatDetail: { chatId: string; title: string };
};

// Tipado global: useNavigation() queda tipado en toda la app sin genéricos.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends AppStackParamList, AuthStackParamList {}
  }
}
