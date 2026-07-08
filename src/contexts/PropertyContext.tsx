import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { propertiesApi, PROPERTY_ID_KEY } from '../lib/api';
import { useAuth } from './AuthContext';
import type { Property } from '../types/database';

interface PropertyContextValue {
  properties: Property[];
  selectedPropertyId: string | null;
  selectedProperty: Property | null;
  loading: boolean;
  setSelectedPropertyId: (id: string | null) => void;
  refreshProperties: () => Promise<void>;
}

const PropertyContext = createContext<PropertyContextValue | null>(null);

export function PropertyProvider({ children }: { children: ReactNode }) {
  const { isStaff, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyIdState] = useState<string | null>(() => {
    return localStorage.getItem(PROPERTY_ID_KEY);
  });
  const [loading, setLoading] = useState(false);

  const refreshProperties = useCallback(async () => {
    if (authLoading || !isStaff) {
      if (!isStaff) setProperties([]);
      return;
    }
    setLoading(true);
    try {
      const data = await propertiesApi.list();
      setProperties(data);
      if (selectedPropertyId && !data.some((p) => p.id === selectedPropertyId)) {
        setSelectedPropertyIdState(null);
        localStorage.removeItem(PROPERTY_ID_KEY);
      }
    } catch {
      setProperties([]);
    }
    setLoading(false);
  }, [authLoading, isStaff, selectedPropertyId]);

  useEffect(() => {
    refreshProperties();
  }, [refreshProperties]);

  function setSelectedPropertyId(id: string | null) {
    setSelectedPropertyIdState(id);
    if (id) localStorage.setItem(PROPERTY_ID_KEY, id);
    else localStorage.removeItem(PROPERTY_ID_KEY);
  }

  const selectedProperty =
    selectedPropertyId != null
      ? properties.find((p) => p.id === selectedPropertyId) ?? null
      : null;

  return (
    <PropertyContext.Provider
      value={{
        properties,
        selectedPropertyId,
        selectedProperty,
        loading,
        setSelectedPropertyId,
        refreshProperties,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty() {
  const ctx = useContext(PropertyContext);
  if (!ctx) throw new Error('useProperty must be used within PropertyProvider');
  return ctx;
}
