"use client";

import { createContext, useContext } from "react";

export interface Location {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
}

interface AdminContextType {
  tenantId: string | null;
  tenantSlug: string | null;
  businessName: string | null;
  logoUrl: string | null;
  currency: string;
  locale: string;
  refreshCurrency: () => Promise<void>;
  /** Sede activa. null mientras carga o si el tenant no tiene sedes. */
  locationId: string | null;
  locationName: string | null;
  /** Todas las sedes activas del tenant. */
  locations: Location[];
  /** Cambia la sede activa y la persiste en localStorage. null = todas las sedes. */
  setLocationId: (id: string | null) => void;
  /** true cuando el usuario es admin de sede (no propietario del tenant) */
  isLocationAdmin: boolean;
}

export const AdminContext = createContext<AdminContextType>({
  tenantId: null,
  tenantSlug: null,
  businessName: null,
  logoUrl: null,
  currency: "COP",
  locale: "es-CO",
  refreshCurrency: async () => {},
  locationId: null,
  locationName: null,
  locations: [],
  setLocationId: () => {},
  isLocationAdmin: false,
});

export const useAdmin = () => useContext(AdminContext);
