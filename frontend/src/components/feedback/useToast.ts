import { useAppDispatch } from '../../store';
import { addToast, removeToast, type ToastType } from './toast.slice';

export const useToast = () => {
  const dispatch = useAppDispatch();

  const notify = (type: ToastType, title: string, message: string) => {
    dispatch(addToast({ type, title, message }));
  };

  return {
    info: (title: string, msg: string) => notify('info', title, msg),
    success: (title: string, msg: string) => notify('success', title, msg),
    warning: (title: string, msg: string) => notify('warning', title, msg),
    error: (title: string, msg: string) => notify('error', title, msg),
    security: (title: string, msg: string) => notify('security', title, msg),
    dismiss: (id: string) => dispatch(removeToast(id)),
  };
};
