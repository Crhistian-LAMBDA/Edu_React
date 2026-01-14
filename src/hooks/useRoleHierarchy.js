import { useMemo } from 'react';
import { useAuth } from './AuthContext';

export const ROLE_HIERARCHY = {
  super_admin: 5,
  admin: 4,
  coordinador: 3,
  profesor: 2,
  estudiante: 1,
};

export const useRoleHierarchy = () => {
  const { user } = useAuth();

  const userLevel = useMemo(() => {
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    const legacy = user?.rol;
    const all = [...roles, legacy].filter(Boolean);
    if (all.length === 0) return 0;
    const principal = all.reduce((mayor, actual) => {
      const pesoActual = ROLE_HIERARCHY[actual] || 0;
      const pesoMayor = ROLE_HIERARCHY[mayor] || 0;
      return pesoActual > pesoMayor ? actual : mayor;
    });
    return ROLE_HIERARCHY[principal] || 0;
  }, [user]);

  const canEditRole = (targetRole) => {
    const targetLevel = ROLE_HIERARCHY[targetRole] || 0;
    return userLevel > targetLevel;
  };

  return { canEditRole, userLevel };
};
