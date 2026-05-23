import ComingSoon from "../ComingSoon";
import { IconStar } from "../ZyncraIcons";

export default function ReviewsGooglePage() {
  return (
    <ComingSoon
      icon={<IconStar size={32} color="#fb0f05" strokeWidth={1.5} />}
      title="Reseñas Google Maps"
      description="Solicita reseñas a tus clientes automáticamente después de cada visita exitosa. Sube tu calificación y aparece primero en búsquedas locales."
      features={[
        "Solicitud automática post-servicio",
        "Link directo a Google Reviews",
        "Seguimiento de calificación",
        "Filtro anti-reseñas negativas",
        "Reportes de evolución",
        "Integración WhatsApp",
      ]}
    />
  );
}
