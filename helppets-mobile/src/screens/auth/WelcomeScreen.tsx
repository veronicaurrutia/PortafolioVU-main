import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui';
import type { AuthStackParamList } from '../../navigation/types';
import { colors, radius, spacing } from '../../theme';

export function WelcomeScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'Welcome'>) {
  return (
    <SafeAreaView style={styles.shell}>
      <View style={styles.center}>
        <View style={styles.logo}>
          <Text style={{ fontSize: 48 }}>🐾</Text>
        </View>
        <Text style={styles.title}>HelpPets</Text>
        <Text style={styles.subtitle}>Bienvenido(a) a nuestra hermosa comunidad de reencuentros.</Text>
      </View>
      <View style={styles.actions}>
        <Button title="Iniciar sesión" onPress={() => navigation.navigate('Login')} />
        <Button
          title="Crear cuenta"
          variant="outline"
          style={{ borderColor: '#fff' }}
          onPress={() => navigation.navigate('Register')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.navy, padding: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  logo: {
    width: 110,
    height: 110,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 32, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 15, color: '#c7c9d9', textAlign: 'center', maxWidth: 280 },
  actions: { gap: spacing.md },
});
