import { useStore } from '../store';

/**
 * useAuth — abstracts authentication state from Zustand.
 * Swap internals for JWT/session logic when backend is ready.
 */
export const useAuth = () => {
    const { user, login, logout } = useStore();

    const role = user?.role || 'AGENT'; // Default to AGENT if not set (for safety)

    // RBAC Flags
    const isAgent = role === 'AGENT';
    const isPlanner = role === 'PLANNER';
    const isSupplier = role === 'SUPPLIER';

    const canSeeFinance = !isPlanner;
    const canSeeMargin = !isPlanner && !isSupplier;
    const canEditContract = !isSupplier;

    return {
        user, login, logout, isAuthenticated: !!user,
        role, isAgent, isPlanner, isSupplier,
        canSeeFinance, canSeeMargin, canEditContract
    };
};
