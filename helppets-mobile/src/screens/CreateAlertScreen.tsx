import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, TextField } from '../components/ui';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createAlert } from '../store/slices/petsSlice';
import { colors, radius, spacing } from '../theme';
import type { NewPetAlert, PetStatus, PetType } from '../types/models';

const STATUS_OPTIONS: { value: PetStatus; label: string }[] = [
  { value: 'lost', label: 'Perdida' },
  { value: 'seen', label: 'Vista' },
  { value: 'found', label: 'Encontrada' },
];
const TYPE_OPTIONS: { value: PetType; label: string }[] = [
  { value: 'dog', label: '🐶 Perro' },
  { value: 'cat', label: '🐱 Gato' },
  { value: 'other', label: '🐾 Otro' },
];

const EMPTY: NewPetAlert = {
  status: 'lost',
  petType: 'dog',
  name: '',
  age: '',
  breed: '',
  area: '',
  lastSeen: '',
  description: '',
  phone: '',
};

export function validateAlert(a: NewPetAlert) {
  const e: Partial<Record<keyof NewPetAlert, string>> = {};
  if (!a.name.trim() && a.status === 'lost') e.name = 'El nombre es obligatorio si la mascota es tuya';
  if (!a.area.trim()) e.area = 'Indica la comuna';
  if (a.lastSeen.trim().length < 5) e.lastSeen = 'Agrega una referencia más precisa';
  if (a.description.trim().length < 10) e.description = 'Describe color, tamaño, collar…';
  if (a.phone && !/^\+?[\d\s]{8,15}$/.test(a.phone)) e.phone = 'Teléfono no válido';
  return e;
}

function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.segment}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => onChange(o.value)}
          style={[styles.segmentBtn, value === o.value && styles.segmentActive]}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === o.value }}
        >
          <Text style={[styles.segmentText, value === o.value && { color: '#fff' }]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function CreateAlertScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const creating = useAppSelector((s) => s.pets.creating);
  const [form, setForm] = useState<NewPetAlert>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? validateAlert(form) : {};

  const set = <K extends keyof NewPetAlert>(k: K) => (v: NewPetAlert[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async () => {
    setSubmitted(true);
    if (Object.keys(validateAlert(form)).length) return;
    try {
      const id = await dispatch(
        createAlert({ ...form, name: form.name.trim() || 'Sin nombre', phone: form.phone?.trim() || undefined }),
      ).unwrap();
      setForm(EMPTY);
      setSubmitted(false);
      navigation.navigate('PetDetail', { petId: id });
    } catch {
      // El error ya quedó reportado en Dynatrace por el middleware.
      Alert.alert('No se pudo publicar', 'Revisa tu conexión e intenta nuevamente.');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.xl, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Tipo de alerta</Text>
        <Segmented options={STATUS_OPTIONS} value={form.status} onChange={set('status')} />
        <Text style={styles.label}>Especie</Text>
        <Segmented options={TYPE_OPTIONS} value={form.petType} onChange={set('petType')} />

        <TextField label="Nombre de la mascota" placeholder="Ej: Luna" value={form.name} onChangeText={set('name')} error={errors.name} />
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <TextField label="Raza" placeholder="Ej: Mestizo" value={form.breed} onChangeText={set('breed')} />
          </View>
          <View style={{ flex: 1 }}>
            <TextField label="Edad" placeholder="Ej: 2 años" value={form.age} onChangeText={set('age')} />
          </View>
        </View>
        <TextField label="Comuna" placeholder="Ej: Ñuñoa, Maipú, Providencia…" value={form.area} onChangeText={set('area')} error={errors.area} />
        <TextField label="Dirección o referencia" placeholder="Calle, esquina o punto de referencia" value={form.lastSeen} onChangeText={set('lastSeen')} error={errors.lastSeen} hint="Se usará como referencia en el mapa de zonas." />
        <TextField label="Descripción" placeholder="Color, tamaño, collar, comportamiento, fecha y hora…" value={form.description} onChangeText={set('description')} error={errors.description} multiline style={{ minHeight: 90, textAlignVertical: 'top' }} />
        <TextField label="Teléfono (opcional)" placeholder="+56 9 …" keyboardType="phone-pad" value={form.phone} onChangeText={set('phone')} error={errors.phone} hint="Puedes publicar sin número: te escribirán por el chat de HelpPets." />

        <Button title="Publicar alerta" loading={creating} onPress={onSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  segment: { flexDirection: 'row', backgroundColor: colors.primarySoft, borderRadius: radius.pill, padding: 4, marginBottom: spacing.lg },
  segmentBtn: { flex: 1, paddingVertical: 9, borderRadius: radius.pill, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { fontSize: 13, fontWeight: '600', color: colors.primary },
});
