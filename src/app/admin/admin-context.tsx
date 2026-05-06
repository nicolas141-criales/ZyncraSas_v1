"use client";

import { createContext, useContext } from "react";

interface AdminContextType {
  tenantId: string | null;
  tenantSlug: string | null;
  businessName: string | null;
  logoUrl: string | null;
}

export const AdminContext = createContext<AdminContextType>({
  tenantId: null,
  tenantSlug: null,
  businessName: null,
  logoUrl: null,
});

export const useAdmin = () => useContext(AdminContext);
