import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, TextField, type TextInputRef } from '../../components/ui';
import type { AuthStackParamList } from '../../navigation/types';
import { authService } from '../../services/authService';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearAuthError, login } from '../../store/slices/authSlice';
import { colors, spacing } from '../../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'Login'>) {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [touched, setTouched] = useState(false);
  const passRef = useRef<TextInputRef>(null);

  useEffect(() => () => void dispatch(clearAuthError()), [dispatch]);

  const emailError = touched && !EMAIL_RE.test(email) ? 'Ingresa un correo válido' : undefined;
  const passError = touched && password.length < 6 ? 'Mínimo 6 caracteres' : undefined;

  const onSubmit = () => {
    setTouched(true);
    if (!EMAIL_RE.test(email) || password.length < 6) return;
    // La navegación a Home ocurre sola: RootNavigator reacciona a auth.status.
    dispatch(login({ email, password }));
  };

  const onForgot = async () => {
    if (!EMAIL_RE.test(email)) return Alert.alert('Recuperar contraseña', 'Primero escribe tu correo.');
    try {
      await authService.resetPassword(email);
      Alert.alert('Revisa tu correo', 'Te enviamos un enlace para restablecer tu contraseña.');
    } catch {
      Alert.alert('Error', 'No pudimos enviar el correo. Intenta más tarde.');
    }
  };

  return (
    <SafeAreaView style={styles.shell}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityLabel="Volver">
            <Text style={styles.back}>←</Text>
          </Pressable>
          <Text style={styles.title}>¡Bienvenido(a)!</Text>
          <Text style={styles.subtitle}>Nos alegra tenerte de nuevo.</Text>

          <TextField
            dark
            label="Correo"
            placeholder="Ingresa tu correo"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            returnKeyType="next"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={() => passRef.current?.focus()}
            error={emailError}
          />
          <TextField
            dark
            ref={passRef}
            label="Contraseña"
            placeholder="Ingresa tu contraseña"
            secureTextEntry={!showPass}
            autoComplete="password"
            returnKeyType="go"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={onSubmit}
            error={passError}
          />
          <Pressable onPress={() => setShowPass((v) => !v)} hitSlop={8}>
            <Text style={styles.link}>{showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}</Text>
          </Pressable>
          <Pressable onPress={onForgot} hitSlop={8}>
            <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
          </Pressable>

          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}

          <Button title="Ingresar" loading={loading} onPress={onSubmit} style={{ marginTop: spacing.lg }} />
          <Pressable onPress={() => navigation.replace('Register')} style={{ marginTop: spacing.lg }}>
            <Text style={[styles.link, { textAlign: 'center' }]}>¿Aún no tienes cuenta? Crear cuenta</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const authStyles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.navy },
  content: { padding: spacing.xxl, flexGrow: 1 },
  back: { color: '#fff', fontSize: 24, marginBottom: spacing.lg },
  title: { color: '#fff', fontSize: 26, fontWeight: '800' },
  subtitle: { color: '#c7c9d9', fontSize: 14, marginBottom: spacing.xxl, marginTop: 4 },
  link: { color: '#c4b5fd', fontSize: 13, marginBottom: spacing.sm },
  error: { color: '#fecaca', backgroundColor: '#7f1d1d55', padding: spacing.md, borderRadius: 10, marginTop: spacing.md },
});
const styles = authStyles;
