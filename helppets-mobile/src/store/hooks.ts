import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './index';

// Hooks tipados: evitan repetir tipos en cada componente.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
