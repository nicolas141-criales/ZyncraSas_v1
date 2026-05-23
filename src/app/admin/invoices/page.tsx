import ComingSoon from "../ComingSoon";
import { IconDocument } from "../ZyncraIcons";

export default function InvoicesPage() {
  return (
    <ComingSoon
      icon={<IconDocument size={32} color="#fb0f05" strokeWidth={1.5} />}
      title="Factura Electrónica DIAN"
      description="Genera y envía facturas electrónicas automáticamente al cerrar cada venta. Cumple con la DIAN sin salir de Zyncra."
      features={[
        "CUFE automático",
        "Envío al correo del cliente",
        "XML y PDF incluidos",
        "Habilitación DIAN",
        "Notas crédito y débito",
        "Historial de facturas",
      ]}
    />
  );
}
