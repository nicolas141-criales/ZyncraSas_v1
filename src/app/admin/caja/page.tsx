import ComingSoon from "../ComingSoon";
import { IconBanknotes } from "../ZyncraIcons";

export default function CajaPage() {
  return (
    <ComingSoon
      icon={<IconBanknotes size={32} color="#fb0f05" strokeWidth={1.5} />}
      title="Sistema de Caja"
      description="Control total de ingresos y egresos del día. Abre y cierra caja con un clic, y obtén reportes claros para tu contabilidad."
      features={[
        "Apertura y cierre de caja",
        "Ingresos y egresos manuales",
        "Reporte por fecha y colaborador",
        "Exportar a Excel o PDF",
        "Cuadre de efectivo",
        "Historial de movimientos",
      ]}
    />
  );
}
