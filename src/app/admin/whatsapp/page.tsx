import ComingSoon from "../ComingSoon";
import { IconChat } from "../ZyncraIcons";

export default function WhatsappPage() {
  return (
    <ComingSoon
      icon={<IconChat size={32} color="#fb0f05" strokeWidth={1.5} />}
      title="Marketing vía WhatsApp"
      description="Envía campañas segmentadas a tus clientes directamente por WhatsApp. Recupera clientes inactivos, promociona servicios y genera más reservas."
      features={[
        "Campañas por cumpleaños",
        "Clientes inactivos (+30 días)",
        "Segmentar por tipo de servicio",
        "Mensajes personalizados",
        "Métricas de apertura",
        "Programar envíos",
      ]}
    />
  );
}
