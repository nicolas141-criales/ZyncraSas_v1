import ComingSoon from "../ComingSoon";
import { IconBell } from "../ZyncraIcons";

export default function RemindersPage() {
  return (
    <ComingSoon
      icon={<IconBell size={32} color="#fb0f05" strokeWidth={1.5} />}
      title="Recordatorios & Confirmaciones"
      description="Automatiza recordatorios por WhatsApp y email. Tus clientes podrán confirmar, cancelar o reprogramar su cita con un solo mensaje."
      features={[
        "Recordatorio 24h antes por WhatsApp",
        "Recordatorio 1h antes por email",
        "Confirmación con un clic",
        "Reprogramar cita fácilmente",
        "Cancelación automática por no-show",
        "Historial de notificaciones",
      ]}
    />
  );
}
