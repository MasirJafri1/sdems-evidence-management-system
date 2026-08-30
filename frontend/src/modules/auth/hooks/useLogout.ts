import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../store';
import { logout } from '../store/auth.slice';
import { ROUTES } from '../../../config/routes.config';
import { useToast } from '../../../components/feedback/useToast';

export const useLogout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = () => {
    dispatch(logout());
    toast.info('Session Terminated', 'Signed out of SDEMS portal');
    navigate(ROUTES.PUBLIC.LOGIN);
  };

  return { logout: handleLogout };
};
