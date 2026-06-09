"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";

interface Cost {
  id: string; name: string; category: string; amount: number;
  type: "fixed" | "variable"; month: string; template_id: string | null; note: string | null;
}
interface Template {
  id: string; name: string; category: string; amount: number;
  type: "fixed" | "variable"; active: boolean;
}
interface CommissionPayment {
  id: string; commission_amount: number; paid_at: string; note: string | null;
  professionals: { name: string } | null;
}

const CATS = ["arriendo","salarios","servicios","insumos","marketing","equipos","otros"];
const CAT_COLOR: Record<string,string> = {
  arriendo:"#6366f1", salarios:"#0027fe", servicios:"#0891b2",
  insumos:"#10b981", marketing:"#f59e0b", equipos:"#8b5cf6", otros:"#8E879B",
};
const GRAD = "linear-gradient(135deg,#fb0f05,#0027fe)";
const FONT = "var(--font-space-grotesk),'Space Grotesk',sans-serif";
const GREEN = "#10b981";
const RED   = "#ef4444";

const iStyle: React.CSSProperties = {
  width:"100%", padding:"10px 12px", borderRadius:9, border:"1px solid #e8e6e2",
  fontSize:13, color:"#14111C", background:"white", outline:"none",
  boxSizing:"border-box", fontFamily:FONT,
};

function mKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`;
}
function mLabel(d: Date) {
  return d.toLocaleDateString("es-CO",{month:"long",year:"numeric"});
}
function mAdd(d: Date, n: number): Date {
  const r = new Date(d); r.setMonth(r.getMonth()+n); return r;
}

export default function TabRentabilidad() {
  const { tenantId, currency, locale } = useAdmin();
  const fmt = (n: number) =>
    new Intl.NumberFormat(locale,{style:"currency",currency,maximumFractionDigits:0}).format(n);

  const [month, setMonth] = useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d;
  });
  const [revenue,     setRevenue]     = useState(0);
  const [costs,       setCosts]       = useState<Cost[]>([]);
  const [commissions, setCommissions] = useState<CommissionPayment[]>([]);
  const [templates,   setTemplates]   = useState<Template[]>([]);
  const [trend,       setTrend]       = useState<{label:string;revenue:number;costs:number}[]>([]);
  const [loading,     setLoading]     = useState(true);

  const [showAddCost,    setShowAddCost]    = useState(false);
  const [showTemplates,  setShowTemplates]  = useState(false);
  const [newCost, setNewCost] = useState({name:"",category:"arriendo",amount:"",type:"fixed",note:""});
  const [newTpl,  setNewTpl]  = useState({name:"",category:"arriendo",amount:"",type:"fixed"});
  const [saving,  setSaving]  = useState(false);

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);

    const start = mKey(month);
    const end   = mKey(mAdd(month, 1));

    const [{ data: sales }, { data: costData }, { data: tplData }, { data: commData }] =
      await Promise.all([
        supabase.from("pos_sales").select("total")
          .eq("tenant_id", tenantId)
          .gte("created_at", `${start}T00:00:00`)
          .lt("created_at",  `${end}T00:00:00`),
        supabase.from("business_costs").select("*")
          .eq("tenant_id", tenantId).eq("month", start),
        supabase.from("business_cost_templates").select("*")
          .eq("tenant_id", tenantId).order("created_at"),
        supabase.from("commission_payments")
          .select("id, commission_amount, paid_at, note, professionals(name)")
          .eq("tenant_id", tenantId)
          .gte("paid_at", `${start}T00:00:00`)
          .lt("paid_at",  `${end}T00:00:00`),
      ]);

    setRevenue((sales||[]).reduce((a,s)=>a+Number(s.total),0));
    setCosts((costData as unknown as Cost[])||[]);
    setTemplates((tplData as unknown as Template[])||[]);
    setCommissions((commData as unknown as CommissionPayment[])||[]);

    // 6-month trend
    const trendArr: {label:string;revenue:number;costs:number}[] = [];
    for (let i = 5; i >= 0; i--) {
      const m  = mAdd(month, -i);
      const mS = mKey(m);
      const mE = mKey(mAdd(m, 1));
      const [{ data: mSales }, { data: mCosts }, { data: mComms }] = await Promise.all([
        supabase.from("pos_sales").select("total").eq("tenant_id", tenantId)
          .gte("created_at", `${mS}T00:00:00`).lt("created_at", `${mE}T00:00:00`),
        supabase.from("business_costs").select("amount")
          .eq("tenant_id", tenantId).eq("month", mS),
        supabase.from("commission_payments").select("commission_amount")
          .eq("tenant_id", tenantId)
          .gte("paid_at", `${mS}T00:00:00`).lt("paid_at", `${mE}T00:00:00`),
      ]);
      trendArr.push({
        label:   m.toLocaleDateString("es-CO",{month:"short"}),
        revenue: (mSales||[]).reduce((a,s)=>a+Number(s.total),0),
        costs:   (mCosts||[]).reduce((a,c)=>a+Number(c.amount),0)
                 + (mComms||[]).reduce((a,c)=>a+Number(c.commission_amount),0),
      });
    }
    setTrend(trendArr);
    setLoading(false);
  }, [tenantId, month]);

  useEffect(() => { loadData(); }, [loadData]);

  const commTotal   = commissions.reduce((a,c)=>a+Number(c.commission_amount),0);
  const manualTotal = costs.reduce((a,c)=>a+Number(c.amount),0);
  const totalCosts  = manualTotal + commTotal;
  const profit      = revenue - totalCosts;
  const margin      = revenue > 0 ? (profit / revenue) * 100 : 0;
  const profitable  = profit >= 0;

  const activeTpls    = templates.filter(t=>t.active);
  const appliedTplIds = new Set(costs.filter(c=>c.template_id).map(c=>c.template_id));
  const pendingTpls   = activeTpls.filter(t=>!appliedTplIds.has(t.id));

  async function applyTemplates() {
    if (!tenantId || pendingTpls.length===0) return;
    await supabase.from("business_costs").insert(
      pendingTpls.map(t=>({
        tenant_id:tenantId, name:t.name, category:t.category,
        amount:t.amount, type:t.type, month:mKey(month), template_id:t.id,
      }))
    );
    loadData();
  }

  async function addCost() {
    if (!tenantId || !newCost.name || !newCost.amount) return;
    setSaving(true);
    await supabase.from("business_costs").insert({
      tenant_id:tenantId, name:newCost.name, category:newCost.category,
      amount:parseFloat(newCost.amount), type:newCost.type,
      month:mKey(month), note:newCost.note||null,
    });
    setNewCost({name:"",category:"arriendo",amount:"",type:"fixed",note:""});
    setShowAddCost(false); setSaving(false); loadData();
  }

  async function deleteCost(id: string) {
    await supabase.from("business_costs").delete().eq("id",id);
    loadData();
  }

  async function addTemplate() {
    if (!tenantId || !newTpl.name || !newTpl.amount) return;
    setSaving(true);
    await supabase.from("business_cost_templates").insert({
      tenant_id:tenantId, name:newTpl.name, category:newTpl.category,
      amount:parseFloat(newTpl.amount), type:newTpl.type,
    });
    setNewTpl({name:"",category:"arriendo",amount:"",type:"fixed"});
    setSaving(false); loadData();
  }

  async function toggleTemplate(id: string, active: boolean) {
    await supabase.from("business_cost_templates").update({active}).eq("id",id);
    loadData();
  }

  async function deleteTemplate(id: string) {
    await supabase.from("business_cost_templates").delete().eq("id",id);
    loadData();
  }

  // Category breakdown (manual costs + commissions under "salarios")
  const catMap: Record<string,number> = {};
  costs.forEach(c=>{ catMap[c.category]=(catMap[c.category]||0)+Number(c.amount); });
  if (commTotal > 0) catMap["salarios"] = (catMap["salarios"]||0) + commTotal;
  const catList = Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
  const maxCat  = catList[0]?.[1]||1;

  const maxTrend       = Math.max(...trend.map(t=>Math.max(t.revenue,t.costs)), 1);
  const isCurrentMonth = mKey(month) >= mKey(new Date());
  const totalEntries   = costs.length + commissions.length;

  if (loading) return (
    <div style={{display:"flex",justifyContent:"center",padding:"60px 0"}}>
      <div style={{width:36,height:36,border:"3px solid #e8e6e2",borderTopColor:"#fb0f05",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20,fontFamily:FONT}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Month nav + actions */}
      <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,background:"white",border:"1px solid #e8e6e2",borderRadius:12,padding:"8px 16px"}}>
          <button onClick={()=>setMonth(mAdd(month,-1))} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#564E66",padding:"0 6px",lineHeight:1}}>←</button>
          <span style={{fontWeight:700,fontSize:14,color:"#14111C",minWidth:150,textAlign:"center",textTransform:"capitalize"}}>{mLabel(month)}</span>
          <button onClick={()=>setMonth(mAdd(month,1))} disabled={isCurrentMonth} style={{background:"none",border:"none",cursor:isCurrentMonth?"default":"pointer",fontSize:16,color:isCurrentMonth?"#d1d0db":"#564E66",padding:"0 6px",lineHeight:1}}>→</button>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:8}}>
          <button onClick={()=>setShowTemplates(true)} style={{padding:"9px 18px",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",border:"1px solid #e8e6e2",background:"white",color:"#564E66",fontFamily:FONT}}>
            Plantillas recurrentes
          </button>
          <button onClick={()=>setShowAddCost(true)} style={{padding:"9px 18px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",border:"none",background:GRAD,color:"#fff",fontFamily:FONT}}>
            + Agregar costo
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        <div style={{background:"white",borderRadius:16,border:"1px solid #e8e6e2",padding:"20px 22px"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#8E879B",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Ingresos del mes</div>
          <div style={{fontSize:22,fontWeight:800,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{fmt(revenue)}</div>
          <div style={{fontSize:12,color:"#8E879B",marginTop:4}}>Ventas POS registradas</div>
        </div>
        <div style={{background:"white",borderRadius:16,border:"1px solid #e8e6e2",padding:"20px 22px"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#8E879B",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Costos totales</div>
          <div style={{fontSize:22,fontWeight:800,color:"#14111C"}}>{fmt(totalCosts)}</div>
          <div style={{fontSize:12,color:"#8E879B",marginTop:4}}>
            {totalEntries} concepto{totalEntries!==1?"s":""}
            {commissions.length>0&&<span style={{marginLeft:6,background:"rgba(245,158,11,.12)",color:"#d97706",borderRadius:4,padding:"1px 5px",fontSize:10,fontWeight:700}}>{commissions.length} comisión{commissions.length>1?"es":""}</span>}
          </div>
        </div>
        <div style={{background:"white",borderRadius:16,border:`1px solid ${profitable?"#d1fae5":"#fee2e2"}`,padding:"20px 22px"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#8E879B",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Utilidad neta</div>
          <div style={{fontSize:22,fontWeight:800,color:profitable?GREEN:RED}}>{profit>=0?"+":""}{fmt(profit)}</div>
          <div style={{fontSize:12,color:"#8E879B",marginTop:4}}>Ingresos − Costos</div>
        </div>
        <div style={{background:profitable?"#f0fdf4":"#fef2f2",borderRadius:16,border:`1px solid ${profitable?"#bbf7d0":"#fecaca"}`,padding:"20px 22px"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#8E879B",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Margen</div>
          <div style={{fontSize:22,fontWeight:800,color:profitable?GREEN:RED}}>{margin.toFixed(1)}%</div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:profitable?GREEN:RED}}/>
            <span style={{fontSize:12,fontWeight:700,color:profitable?GREEN:RED}}>{profitable?"Rentable":"En pérdida"}</span>
          </div>
        </div>
      </div>

      {/* Apply templates banner */}
      {activeTpls.length>0 && (
        <div style={{background:"linear-gradient(135deg,rgba(251,15,5,.04),rgba(0,39,254,.04))",border:"1px solid rgba(0,39,254,.12)",borderRadius:14,padding:"14px 20px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:13,color:"#14111C"}}>
              {pendingTpls.length>0
                ? `${pendingTpls.length} costo${pendingTpls.length>1?"s":""} recurrente${pendingTpls.length>1?"s":""} sin aplicar este mes`
                : "✓ Todos los costos recurrentes ya están aplicados"}
            </div>
            <div style={{fontSize:12,color:"#8E879B",marginTop:2}}>
              {activeTpls.length-pendingTpls.length} de {activeTpls.length} aplicado{activeTpls.length-pendingTpls.length!==1?"s":""}
            </div>
          </div>
          {pendingTpls.length>0 && (
            <button onClick={applyTemplates} style={{padding:"8px 18px",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",border:"none",background:GRAD,color:"#fff",fontFamily:FONT}}>
              Aplicar al mes
            </button>
          )}
        </div>
      )}

      {/* Main grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>

        {/* Combined cost list */}
        <div style={{background:"white",borderRadius:18,border:"1px solid #e8e6e2",overflow:"hidden"}}>
          <div style={{padding:"16px 20px",borderBottom:"1px solid #e8e6e2",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontWeight:700,fontSize:14,color:"#14111C"}}>Costos del mes</div>
              <div style={{fontSize:12,color:"#8E879B",marginTop:2,textTransform:"capitalize"}}>{mLabel(month)}</div>
            </div>
            <div style={{fontSize:14,fontWeight:800,color:"#14111C"}}>{fmt(totalCosts)}</div>
          </div>
          <div style={{padding:"8px 0",maxHeight:360,overflowY:"auto"}}>
            {totalEntries===0 ? (
              <div style={{padding:"32px 20px",textAlign:"center",color:"#8E879B",fontSize:13}}>
                Sin costos registrados este mes.<br/>
                <span style={{cursor:"pointer",color:"#0027fe",fontWeight:600}} onClick={()=>setShowAddCost(true)}>+ Agregar costo</span>
              </div>
            ) : (
              <>
                {/* Commission payments (auto) */}
                {commissions.map((c,i)=>{
                  const proName = (c.professionals as any)?.name || "Profesional";
                  const paidDate = new Date(c.paid_at).toLocaleDateString(locale,{day:"numeric",month:"short"});
                  return (
                    <div key={c.id} style={{padding:"10px 20px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #f7f7fa",background:"rgba(245,158,11,.02)"}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:"#f59e0b",flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,color:"#14111C",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          Comisión — {proName}
                        </div>
                        <div style={{fontSize:11,color:"#8E879B",marginTop:1,display:"flex",gap:6,alignItems:"center"}}>
                          Liquidada el {paidDate}
                          <span style={{background:"rgba(245,158,11,.12)",color:"#d97706",borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:700}}>Auto</span>
                        </div>
                      </div>
                      <div style={{fontWeight:700,fontSize:13,color:"#14111C",flexShrink:0}}>{fmt(Number(c.commission_amount))}</div>
                      <div style={{width:22,flexShrink:0}}/>
                    </div>
                  );
                })}
                {/* Manual costs */}
                {costs.map((c,i)=>(
                  <div key={c.id} style={{padding:"10px 20px",display:"flex",alignItems:"center",gap:12,borderBottom:i<costs.length-1?"1px solid #f7f7fa":"none"}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:CAT_COLOR[c.category]||"#8E879B",flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#14111C",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                      <div style={{fontSize:11,color:"#8E879B",marginTop:1,display:"flex",gap:6,alignItems:"center"}}>
                        {c.category.charAt(0).toUpperCase()+c.category.slice(1)} · {c.type==="fixed"?"Fijo":"Variable"}
                        {c.template_id&&<span style={{background:"rgba(0,39,254,.08)",color:"#0027fe",borderRadius:4,padding:"1px 5px",fontSize:10,fontWeight:700}}>Recurrente</span>}
                      </div>
                    </div>
                    <div style={{fontWeight:700,fontSize:13,color:"#14111C",flexShrink:0}}>{fmt(Number(c.amount))}</div>
                    <button onClick={()=>deleteCost(c.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#d1d0db",fontSize:14,padding:"2px 4px",flexShrink:0,lineHeight:1}} title="Eliminar">✕</button>
                  </div>
                ))}
              </>
            )}
          </div>
          {commissions.length>0 && (
            <div style={{padding:"10px 20px",borderTop:"1px solid #f0eeeb",background:"#fafaf8",display:"flex",justifyContent:"space-between",fontSize:11,color:"#8E879B"}}>
              <span>Las comisiones se gestionan desde <strong style={{color:"#14111C"}}>Comisiones</strong></span>
              <span style={{fontWeight:700,color:"#d97706"}}>{fmt(commTotal)} en comisiones</span>
            </div>
          )}
        </div>

        {/* Right: category breakdown + fixed vs variable */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:"white",borderRadius:18,border:"1px solid #e8e6e2",overflow:"hidden"}}>
            <div style={{padding:"16px 20px",borderBottom:"1px solid #e8e6e2"}}>
              <div style={{fontWeight:700,fontSize:14,color:"#14111C"}}>Costos por categoría</div>
            </div>
            <div style={{padding:"16px 20px"}}>
              {catList.length===0 ? (
                <div style={{color:"#8E879B",fontSize:13}}>Sin datos.</div>
              ) : catList.map(([cat,val])=>(
                <div key={cat} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:13,fontWeight:600,color:"#14111C"}}>{cat.charAt(0).toUpperCase()+cat.slice(1)}</span>
                    <span style={{fontSize:13,fontWeight:700,color:"#14111C"}}>{fmt(val)}</span>
                  </div>
                  <div style={{height:6,background:"#f0eff8",borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${(val/maxCat)*100}%`,background:CAT_COLOR[cat]||"#8E879B",borderRadius:3,transition:"width .5s"}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {totalEntries>0 && (
            <div style={{background:"white",borderRadius:18,border:"1px solid #e8e6e2",padding:"16px 20px"}}>
              <div style={{fontWeight:700,fontSize:13,color:"#14111C",marginBottom:12}}>Desglose de costos</div>
              {([
                ["manual","Costos manuales","#6366f1",manualTotal],
                ["comisiones","Comisiones pagadas","#f59e0b",commTotal],
              ] as [string,string,string,number][]).map(([k,label,color,val])=>(
                <div key={k} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:12,color:"#564E66",fontWeight:600}}>{label}</span>
                    <span style={{fontSize:12,fontWeight:700,color:"#14111C"}}>{fmt(val)}</span>
                  </div>
                  <div style={{height:5,background:"#f0eff8",borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${totalCosts>0?(val/totalCosts)*100:0}%`,background:color,borderRadius:3,transition:"width .5s"}}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trend chart */}
      <div style={{background:"white",borderRadius:18,border:"1px solid #e8e6e2",padding:"20px 22px"}}>
        <div style={{fontWeight:700,fontSize:14,color:"#14111C",marginBottom:4}}>Ingresos vs Costos — últimos 6 meses</div>
        <div style={{fontSize:12,color:"#8E879B",marginBottom:16}}>Costos incluyen comisiones pagadas + gastos manuales</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:6,height:140}}>
          {trend.map((m,i)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div style={{width:"100%",display:"flex",gap:3,alignItems:"flex-end",height:116}}>
                <div title={`Ingresos: ${fmt(m.revenue)}`} style={{flex:1,minHeight:2,height:`${Math.max((m.revenue/maxTrend)*110,m.revenue>0?4:1)}px`,background:GRAD,borderRadius:"3px 3px 0 0",transition:"height .4s"}}/>
                <div title={`Costos: ${fmt(m.costs)}`} style={{flex:1,minHeight:2,height:`${Math.max((m.costs/maxTrend)*110,m.costs>0?4:1)}px`,background:"#6366f1",borderRadius:"3px 3px 0 0",transition:"height .4s"}}/>
              </div>
              <div style={{fontSize:10,color:"#a0a0b0",textTransform:"capitalize"}}>{m.label}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:16,marginTop:12}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:10,height:10,borderRadius:2,background:GRAD}}/><span style={{fontSize:11,color:"#8E879B"}}>Ingresos POS</span></div>
          <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:10,height:10,borderRadius:2,background:"#6366f1"}}/><span style={{fontSize:11,color:"#8E879B"}}>Costos totales</span></div>
        </div>
      </div>

      {/* Modal: Add Cost */}
      {showAddCost && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setShowAddCost(false)}>
          <div style={{background:"white",borderRadius:20,padding:28,width:420,boxShadow:"0 20px 60px rgba(0,0,0,.15)"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:800,fontSize:16,color:"#14111C",marginBottom:20}}>Agregar costo</div>
            {([
              ["Nombre","text",newCost.name,(v:string)=>setNewCost(p=>({...p,name:v})),"Ej: Arriendo local"],
              ["Monto","number",newCost.amount,(v:string)=>setNewCost(p=>({...p,amount:v})),"0"],
              ["Nota (opcional)","text",newCost.note,(v:string)=>setNewCost(p=>({...p,note:v})),"Referencia o detalle"],
            ] as [string,string,string,(v:string)=>void,string][]).map(([l,type,val,onChange,ph])=>(
              <div key={l} style={{marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:700,color:"#564E66",marginBottom:6}}>{l}</div>
                <input type={type} value={val} onChange={e=>onChange(e.target.value)} placeholder={ph} style={iStyle}/>
              </div>
            ))}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:700,color:"#564E66",marginBottom:6}}>Categoría</div>
              <select value={newCost.category} onChange={e=>setNewCost(p=>({...p,category:e.target.value}))} style={iStyle}>
                {CATS.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:12,fontWeight:700,color:"#564E66",marginBottom:6}}>Tipo</div>
              <select value={newCost.type} onChange={e=>setNewCost(p=>({...p,type:e.target.value}))} style={iStyle}>
                <option value="fixed">Fijo (se repite igual cada mes)</option>
                <option value="variable">Variable (cambia mes a mes)</option>
              </select>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowAddCost(false)} style={{flex:1,padding:"11px 0",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",border:"1px solid #e8e6e2",background:"white",color:"#564E66",fontFamily:FONT}}>Cancelar</button>
              <button onClick={addCost} disabled={saving||!newCost.name||!newCost.amount} style={{flex:1,padding:"11px 0",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",border:"none",background:GRAD,color:"#fff",fontFamily:FONT,opacity:(!newCost.name||!newCost.amount)?0.5:1}}>
                {saving?"Guardando...":"Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Templates */}
      {showTemplates && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setShowTemplates(false)}>
          <div style={{background:"white",borderRadius:20,padding:28,width:500,maxHeight:"80vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.15)"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:800,fontSize:16,color:"#14111C",marginBottom:4}}>Plantillas de costos recurrentes</div>
            <div style={{fontSize:12,color:"#8E879B",marginBottom:20}}>Define costos que se repiten cada mes y aplícalos con un clic.</div>

            <div style={{background:"#f7f7fa",borderRadius:14,padding:16,marginBottom:20}}>
              <div style={{fontWeight:700,fontSize:13,color:"#14111C",marginBottom:12}}>Nueva plantilla</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                {([
                  ["Nombre","text",newTpl.name,(v:string)=>setNewTpl(p=>({...p,name:v})),"Ej: Salario empleado"],
                  ["Monto","number",newTpl.amount,(v:string)=>setNewTpl(p=>({...p,amount:v})),"0"],
                ] as [string,string,string,(v:string)=>void,string][]).map(([l,type,val,onChange,ph])=>(
                  <div key={l}>
                    <div style={{fontSize:11,fontWeight:700,color:"#564E66",marginBottom:4}}>{l}</div>
                    <input type={type} value={val} onChange={e=>onChange(e.target.value)} placeholder={ph} style={iStyle}/>
                  </div>
                ))}
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:"#564E66",marginBottom:4}}>Categoría</div>
                  <select value={newTpl.category} onChange={e=>setNewTpl(p=>({...p,category:e.target.value}))} style={iStyle}>
                    {CATS.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:"#564E66",marginBottom:4}}>Tipo</div>
                  <select value={newTpl.type} onChange={e=>setNewTpl(p=>({...p,type:e.target.value}))} style={iStyle}>
                    <option value="fixed">Fijo</option>
                    <option value="variable">Variable</option>
                  </select>
                </div>
              </div>
              <button onClick={addTemplate} disabled={saving||!newTpl.name||!newTpl.amount} style={{width:"100%",padding:"10px 0",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",border:"none",background:GRAD,color:"#fff",fontFamily:FONT}}>
                {saving?"Guardando...":"Crear plantilla"}
              </button>
            </div>

            {templates.length===0 ? (
              <div style={{textAlign:"center",color:"#8E879B",fontSize:13,padding:"16px 0"}}>Sin plantillas aún.</div>
            ) : templates.map((t,i)=>(
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:i<templates.length-1?"1px solid #f0eeeb":"none"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:CAT_COLOR[t.category]||"#8E879B",flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:t.active?"#14111C":"#a0a0b0",textDecoration:t.active?"none":"line-through"}}>{t.name}</div>
                  <div style={{fontSize:11,color:"#8E879B"}}>{t.category} · {t.type==="fixed"?"Fijo":"Variable"} · {fmt(t.amount)}</div>
                </div>
                <button onClick={()=>toggleTemplate(t.id,!t.active)} style={{padding:"4px 10px",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer",border:"none",background:t.active?"#d1fae5":"#f3f4f6",color:t.active?"#059669":"#6b7280",fontFamily:FONT,flexShrink:0}}>
                  {t.active?"Activo":"Inactivo"}
                </button>
                <button onClick={()=>deleteTemplate(t.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#d1d0db",fontSize:14,padding:"2px 4px",lineHeight:1,flexShrink:0}} title="Eliminar">✕</button>
              </div>
            ))}

            <button onClick={()=>setShowTemplates(false)} style={{width:"100%",padding:"11px 0",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",border:"1px solid #e8e6e2",background:"white",color:"#564E66",fontFamily:FONT,marginTop:16}}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
