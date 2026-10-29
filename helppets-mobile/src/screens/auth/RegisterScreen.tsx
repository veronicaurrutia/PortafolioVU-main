import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, TextField } from '../../components/ui';
import type { AuthStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearAuthError, register } from '../../store/slices/authSlice';
import { spacing } from '../../theme';
import { authStyles as styles } from './LoginScreen';

type Form = { fullName: string; email: string; password: string; confirm: string };

/** Validación pura y separada de la UI → fácil de testear. */
export function validateRegister(f: Form): Partial<Record<keyof Form, string>> {
  const e: Partial<Record<keyof Form, string>> = {};
  if (f.fullName.trim().length < 3) e.fullName = 'Ingresa tu nombre completo';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Correo no válido';
  if (f.password.length < 6) e.password = 'Mínimo 6 caracteres';
  if (f.confirm !== f.password) e.confirm = 'Las contraseñas no coinciden';
  return e;
}

export function RegisterScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'Register'>) {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [form, setForm] = useState<Form>({ fullName: '', email: '', password: '', confirm: '' });
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? validateRegister(form) : {};

  useEffect(() => () => void dispatch(clearAuthError()), [dispatch]);

  const set = (k: keyof Form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = () => {
    setSubmitted(true);
    if (Object.keys(validateRegister(form)).length) return;
    dispatch(register({ fullName: form.fullName.trim(), email: form.email, password: form.password }));
  };

  return (
    <SafeAreaView style={styles.shell}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityLabel="Volver">
            <Text style={styles.back}>←</Text>
          </Pressable>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Únete a la comunidad y ayuda a reencontrar mascotas.</Text>

          <TextField dark label="Nombre completo" value={form.fullName} onChangeText={set('fullName')} error={errors.fullName} autoComplete="name" />
          <TextField dark label="Correo" value={form.email} onChangeText={set('email')} error={errors.email} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <TextField dark label="Contraseña" value={form.password} onChangeText={set('password')} error={errors.password} secureTextEntry autoComplete="new-password" />
          <TextField dark label="Repetir contraseña" value={form.confirm} onChangeText={set('confirm')} error={errors.confirm} secureTextEntry />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Crear cuenta" loading={loading} onPress={onSubmit} style={{ marginTop: spacing.lg }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
