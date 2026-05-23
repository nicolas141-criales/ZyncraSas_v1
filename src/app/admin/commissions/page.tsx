import ComingSoon from "../ComingSoon";
import { IconChartBar } from "../ZyncraIcons";

export default function CommissionsPage() {
  return (
    <ComingSoon
      icon={<IconChartBar size={32} color="#fb0f05" strokeWidth={1.5} />}
      title="Gestión de Comisiones"
      description="Liquida las comisiones de tu equipo de forma automática según los servicios cobrados. Sin errores, sin disputas."
      features={[
        "Porcentaje por servicio",
        "Comisión fija o variable",
        "Liquidación semanal o mensual",
        "Reporte por colaborador",
        "Historial de pagos",
        "Exportar para nómina",
      ]}
    />
  );
}
