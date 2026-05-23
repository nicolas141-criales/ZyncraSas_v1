import ComingSoon from "../ComingSoon";
import { IconSliders } from "../ZyncraIcons";

export default function CustomFieldsPage() {
  return (
    <ComingSoon
      icon={<IconSliders size={32} color="#fb0f05" strokeWidth={1.5} />}
      title="Campos Personalizados"
      description="Agrega campos adicionales a tus clientes y citas según las necesidades de tu negocio. Captura la información que realmente importa."
      features={[
        "Campos de texto libre",
        "Listas desplegables",
        "Fechas y números",
        "Campos obligatorios u opcionales",
        "Visibles en el formulario de cita",
        "Exportables en reportes",
      ]}
    />
  );
}
