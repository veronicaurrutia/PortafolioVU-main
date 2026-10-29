// Mocks de los SDKs nativos / de red: los tests prueban NUESTRA lógica, no la de los proveedores.
jest.mock('@microsoft/react-native-clarity', () => ({
  initialize: jest.fn(),
  setCustomUserId: jest.fn(),
  setCustomTag: jest.fn(),
  setCurrentScreenName: jest.fn(),
  sendCustomEvent: jest.fn(),
  LogLevel: { Verbose: 'Verbose', None: 'None' },
}));

jest.mock('@dynatrace/react-native-plugin', () => {
  const action = { leaveAction: jest.fn(), reportError: jest.fn(), reportStringValue: jest.fn() };
  return {
    Dynatrace: {
      identifyUser: jest.fn(),
      enterAutoAction: jest.fn(() => action),
      reportErrorStacktrace: jest.fn(),
      endSession: jest.fn(),
    },
  };
});

jest.mock('./src/services/firebase', () => ({ auth: {}, db: {} }));
jest.mock('firebase/firestore', () => ({}));
jest.mock('firebase/auth', () => ({}));
jest.mock('@react-native-async-storage/async-storage', () => ({}));
