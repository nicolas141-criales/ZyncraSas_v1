"use client";

import { createContext, useContext } from "react";

interface AdminContextType {
  tenantId: string | null;
  tenantSlug: string | null;
  businessName: string | null;
  logoUrl: string | null;
  currency: string;
  locale: string;
  refreshCurrency: () => Promise<void>;
}

export const AdminContext = createContext<AdminContextType>({
  tenantId: null,
  tenantSlug: null,
  businessName: null,
  logoUrl: null,
  currency: "COP",
  locale: "es-CO",
  refreshCurrency: async () => {},
});

export const useAdmin = () => useContext(AdminContext);
