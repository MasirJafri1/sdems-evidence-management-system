import { useAppSelector } from '../../../store';

export const useAuth = () => {
  const { user, token, isAuthenticated } = useAppSelector((state) => state.auth);

  return {
    user,
    token,
    isAuthenticated,
    organization: 'Central Bureau of Investigation',
    role: 'Investigator Lead',
  };
};
