import ComingSoon from "../ComingSoon";
import { IconStorefront } from "../ZyncraIcons";

export default function ReviewsSitePage() {
  return (
    <ComingSoon
      icon={<IconStorefront size={32} color="#fb0f05" strokeWidth={1.5} />}
      title="Reseñas en tu Sitio"
      description="Muestra las reseñas de tus clientes directamente en tu página de agendamiento. Genera confianza y convierte más visitas en citas."
      features={[
        "Widget de reseñas embebible",
        "Moderación de comentarios",
        "Calificación con estrellas",
        "Reseñas verificadas",
        "Importar de Google",
        "Diseño personalizable",
      ]}
    />
  );
}
