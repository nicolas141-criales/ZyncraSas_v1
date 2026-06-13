"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

const CATEGORIES = [
  "Uñas y manicura", "Barbería", "Cabello y peluquería", "Spa y masajes",
  "Maquillaje", "Cuidado de la piel", "Depilación", "Insumos generales",
];

interface SupplierProfile {
  id: string;
  company_name: string;
  description: string | null;
  phone: string | null;
  nit: string | null;
  city: string | null;
  address: string | null;
  categories: string[];
  logo_url: string | null;
  email: string;
}

export default function SupplierProfilePage() {
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [form, setForm] = useState({ company_name: "", description: "", phone: "", nit: "", city: "", address: "", categories: [] as string[] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("suppliers")
        .select("id, company_name, description, phone, nit, city, address, categories, logo_url, email")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!data) return;
      setProfile(data as SupplierProfile);
      setForm({
        company_name: data.company_name ?? "",
        description: data.description ?? "",
        phone: data.phone ?? "",
        nit: data.nit ?? "",
        city: data.city ?? "",
        address: data.address ?? "",
        categories: data.categories ?? [],
      });
      setLogoUrl(data.logo_url ?? null);
      // Cover stored in logos bucket at supplier-covers/{id}/cover.*
      if (data.id) {
        const { data: coverObj } = await supabase.storage.from("logos").list(`supplier-covers/${data.id}`);
        if (coverObj && coverObj.length > 0) {
          const { data: { publicUrl } } = supabase.storage.from("logos").getPublicUrl(`supplier-covers/${data.id}/${coverObj[0].name}`);
          setCoverUrl(publicUrl);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  const uploadImage = async (
    file: File,
    bucket: string,
    path: string,
    onDone: (url: string) => void,
    setUploading: (v: boolean) => void,
  ) => {
    if (file.size > 5 * 1024 * 1024) { setError("La imagen no puede superar 5 MB."); return; }
    setUploading(true);
    setError(null);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const fullPath = `${path}.${ext}`;
      const { error: err } = await supabase.storage.from(bucket).upload(fullPath, file, { upsert: true });
      if (err) throw err;
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fullPath);
      onDone(publicUrl + `?t=${Date.now()}`);
    } catch {
      setError("Error al subir la imagen. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    uploadImage(file, "logos", `supplier-logos/${profile.id}/logo`, (url) => {
      setLogoUrl(url);
      // Persist logo_url to suppliers table
      supabase.from("suppliers").update({ logo_url: url.split("?")[0] }).eq("id", profile.id);
    }, setUploadingLogo);
    e.target.value = "";
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    uploadImage(file, "logos", `supplier-covers/${profile.id}/cover`, (url) => {
      setCoverUrl(url);
    }, setUploadingCover);
    e.target.value = "";
  };

  const toggleCategory = (c: string) =>
    setForm(f => ({
      ...f,
      categories: f.categories.includes(c) ? f.categories.filter(x => x !== c) : [...f.categories, c],
    }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!form.company_name.trim()) { setError("El nombre de la empresa es requerido."); return; }
    setSaving(true);
    setError(null);
    setSuccess(false);
    const { error: err } = await supabase.from("suppliers").update({
      company_name: form.company_name.trim(),
      description: form.description.trim() || null,
      phone: form.phone.trim() || null,
      nit: form.nit.trim() || null,
      city: form.city.trim() || null,
      address: form.address.trim() || null,
      categories: form.categories,
    }).eq("id", profile.id);
    setSaving(false);
    if (err) { setError("Error al guardar. Intenta de nuevo."); return; }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "white", margin: 0 }}>Perfil del proveedor</h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "4px 0 0" }}>
          Información visible para los negocios que compran tus productos
        </p>
      </div>

      {/* Toast fijo arriba-derecha */}
      {success && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 300,
          background: "#0d2b1c", border: "1px solid rgba(52,211,153,0.4)",
          borderRadius: 12, padding: "14px 18px",
          fontSize: 13, color: "#34d399", fontWeight: 700,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          ✓ Cambios guardados correctamente
        </div>
      )}

      {/* ── Portada ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
          Imagen de portada
        </div>
        <div style={{ position: "relative", height: 160, borderRadius: 14, overflow: "hidden", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="Portada" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(255,255,255,0.15)", fontSize: 13, fontWeight: 600 }}>
              Sin portada
            </div>
          )}
          <button
            type="button"
            disabled={uploadingCover}
            onClick={() => coverRef.current?.click()}
            style={{
              position: "absolute", bottom: 12, right: 12,
              padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(7,7,26,0.75)", backdropFilter: "blur(12px)",
              color: uploadingCover ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.85)",
              fontSize: 12, fontWeight: 700, cursor: uploadingCover ? "default" : "pointer",
            }}
          >
            {uploadingCover ? "Subiendo..." : coverUrl ? "✎ Cambiar portada" : "＋ Agregar portada"}
          </button>
          <input ref={coverRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={handleCoverChange} />
        </div>
      </div>

      {/* ── Logo + nombre ── */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 20, marginBottom: 28 }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Logo</div>
          <div style={{ position: "relative", width: 96, height: 96 }}>
            <div style={{
              width: 96, height: 96, borderRadius: 16, overflow: "hidden",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 28 }}>🏢</span>
              )}
            </div>
            <button
              type="button"
              disabled={uploadingLogo}
              onClick={() => logoRef.current?.click()}
              style={{
                position: "absolute", bottom: -6, right: -6,
                width: 28, height: 28, borderRadius: "50%", border: "2px solid #07071a",
                background: uploadingLogo ? "rgba(255,255,255,0.15)" : "#fb0f05",
                color: "white", fontSize: 14, cursor: uploadingLogo ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              }}
            >
              {uploadingLogo ? "…" : "✎"}
            </button>
            <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={handleLogoChange} />
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Correo (no editable)</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 500, padding: "9px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)" }}>
            {profile?.email}
          </div>
        </div>
      </div>

      {/* ── Formulario ── */}
      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Fl label="Nombre de la empresa *">
          <input required type="text" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} style={inp} placeholder="Distribuidora Bella Colombia" />
        </Fl>

        <Fl label="Descripción">
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inp, height: 90, resize: "none" } as React.CSSProperties} placeholder="Qué productos venden, años de experiencia, zona de cobertura..." />
        </Fl>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Fl label="Teléfono / WhatsApp">
            <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inp} placeholder="3001234567" />
          </Fl>
          <Fl label="NIT">
            <input type="text" value={form.nit} onChange={e => setForm(f => ({ ...f, nit: e.target.value }))} style={inp} placeholder="900.123.456-7" />
          </Fl>
          <Fl label="Ciudad">
            <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={inp} placeholder="Bogotá, Medellín..." />
          </Fl>
          <Fl label="Dirección">
            <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} style={inp} placeholder="Calle 123 #45-67" />
          </Fl>
        </div>

        <Fl label="Categorías de productos">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 2 }}>
            {CATEGORIES.map(cat => {
              const active = form.categories.includes(cat);
              return (
                <button key={cat} type="button" onClick={() => toggleCategory(cat)} style={{
                  padding: "7px 13px", borderRadius: 8, border: "1px solid", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .15s",
                  borderColor: active ? "#fb0f05" : "rgba(255,255,255,0.12)",
                  background: active ? "rgba(251,15,5,0.15)" : "rgba(255,255,255,0.03)",
                  color: active ? "#ff7d72" : "rgba(255,255,255,0.45)",
                }}>
                  {cat}
                </button>
              );
            })}
          </div>
        </Fl>

        <div style={{ paddingTop: 4 }}>
          {error && (
            <div style={{ background: "rgba(251,15,5,0.1)", border: "1px solid rgba(251,15,5,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#ff7d72" }}>
              ⚠ {error}
            </div>
          )}
          <button type="submit" disabled={saving} style={{
            padding: "12px 28px", borderRadius: 10, border: "none", cursor: saving ? "default" : "pointer",
            background: saving ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #fb0f05, #cc0a03)",
            color: saving ? "rgba(255,255,255,0.4)" : "white",
            fontSize: 14, fontWeight: 700,
            boxShadow: saving ? "none" : "0 4px 20px rgba(251,15,5,0.3)",
          }}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Fl({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <div style={{ width: 32, height: 32, border: "3px solid rgba(255,255,255,0.06)", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 13px", borderRadius: 9,
  border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
  color: "white", fontSize: 13, fontWeight: 500, outline: "none", boxSizing: "border-box",
};
