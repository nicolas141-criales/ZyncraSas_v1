import ComingSoon from "../ComingSoon";
import { IconCreditCard } from "../ZyncraIcons";

export default function PosPage() {
  return (
    <ComingSoon
      icon={<IconCreditCard size={32} color="#fb0f05" strokeWidth={1.5} />}
      title="Sistema POS"
      description="Cobra más rápido con un punto de venta integrado a tu agenda. Acepta efectivo, tarjeta, Nequi y Daviplata en un solo lugar."
      features={[
        "Cobro integrado a la cita",
        "Efectivo, tarjeta, Nequi, Daviplata",
        "Cierre de caja diario",
        "Descuentos y cupones",
        "Historial de pagos",
        "Recibo digital al cliente",
      ]}
    />
  );
}
