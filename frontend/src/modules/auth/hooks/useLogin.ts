import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../store';
import { setCredentials } from '../store/auth.slice';
import { loginSchema, type LoginInput } from '../schemas/auth.schema';
import { loginApi } from '../api/auth.api';
import { mapApiError } from '../../../config/axios.config';
import { ROUTES } from '../../../config/routes.config';
import { useToast } from '../../../components/feedback/useToast';

export const useLogin = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (input: LoginInput) => {
    setIsLoading(true);
    setError(null);

    const validation = loginSchema.safeParse(input);
    if (!validation.success) {
      const firstErr = validation.error.issues[0]?.message || 'Invalid login details';
      setError(firstErr);
      setIsLoading(false);
      return;
    }

    try {
      const res = await loginApi(input.email, input.password);
      const isSuperAdmin = res.user.email === 'superadmin@gov.in';
      dispatch(
        setCredentials({
          user: {
            id: res.user.id,
            name: res.user.name,
            email: res.user.email,
            isActive: true,
            isSuperAdmin,
            organizationId: isSuperAdmin ? null : (res.user.organizationId || null),
          },
          token: res.token,
        })
      );

      toast.success('Identity Authenticated', `Welcome back, ${res.user.name}`);
      navigate(ROUTES.PROTECTED.DASHBOARD);
    } catch (err: any) {
      const mapped = mapApiError(err);
      setError(mapped);
      toast.error('Authentication Failed', mapped);
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
};
