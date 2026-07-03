import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { settingsApi, isApiConfigured } from '../lib/api';

interface BusinessContextValue {
  pgName: string;
  loading: boolean;
  refresh: () => Promise<void>;
  updatePgName: (name: string) => Promise<{ error: string | null }>;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [pgName, setPgName] = useState('Nivas PG');
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!isApiConfigured) {
      setLoading(false);
      return;
    }
    try {
      const data = await settingsApi.get();
      if (data.pg_name) setPgName(data.pg_name);
    } catch {
      // use default name when backend is unavailable
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function updatePgName(name: string) {
    try {
      const data = await settingsApi.update(name);
      setPgName(data.pg_name);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update' };
    }
  }

  return (
    <BusinessContext.Provider value={{ pgName, loading, refresh, updatePgName }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useBusiness must be used within BusinessProvider');
  return ctx;
}
