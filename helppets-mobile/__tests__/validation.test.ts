import { validateAlert } from '../src/screens/CreateAlertScreen';
import { validateRegister } from '../src/screens/auth/RegisterScreen';
import type { NewPetAlert } from '../src/types/models';

jest.mock('../src/store/hooks', () => ({}));
jest.mock('@react-navigation/native', () => ({}));

const base: NewPetAlert = {
  status: 'lost',
  petType: 'dog',
  name: 'Luna',
  age: '',
  breed: '',
  area: 'Ñuñoa',
  lastSeen: 'Plaza Ñuñoa',
  description: 'Collar rosado, muy dócil',
};

describe('validateAlert', () => {
  it('acepta una alerta válida', () => expect(validateAlert(base)).toEqual({}));
  it('exige nombre solo si la mascota está perdida', () => {
    expect(validateAlert({ ...base, name: '' }).name).toBeDefined();
    expect(validateAlert({ ...base, name: '', status: 'seen' }).name).toBeUndefined();
  });
  it('valida teléfono opcional', () => {
    expect(validateAlert({ ...base, phone: 'abc' }).phone).toBeDefined();
    expect(validateAlert({ ...base, phone: '+56 9 1234 5678' }).phone).toBeUndefined();
  });
});

describe('validateRegister', () => {
  it('detecta contraseñas distintas', () => {
    const e = validateRegister({ fullName: 'Verónica U', email: 'v@u.cl', password: '123456', confirm: '654321' });
    expect(e).toEqual({ confirm: 'Las contraseñas no coinciden' });
  });
});
