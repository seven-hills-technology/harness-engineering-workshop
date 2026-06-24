import { useQuery } from '@tanstack/react-query';
import * as api from '../lib/api';
import type { AdminDashboard } from '../lib/types';

export function useDashboard() {
  return useQuery<AdminDashboard>({
    queryKey: ['admin', 'dashboard'],
    queryFn: api.getAdminDashboard,
  });
}
