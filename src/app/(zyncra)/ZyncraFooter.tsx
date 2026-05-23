import Link from "next/link";
import ZyncraLogo from "./ZyncraLogo";

export default function ZyncraFooter() {
  return (
    <footer className="z-footer">
      <div className="z-footer-top">
        <div>
          <div className="z-footer-logo"><ZyncraLogo height={32} dark /></div>
          <p className="z-footer-desc">Software de gestión todo en uno para negocios de servicios con citas en Colombia y Latinoamérica.</p>
        </div>
        <div>
          <div className="z-footer-col-title">Producto</div>
          <ul className="z-footer-links">
            <li><Link href="/features">Funciones</Link></li>
            <li><Link href="/features">WhatsApp</Link></li>
            <li><Link href="/features">POS</Link></li>
            <li><Link href="/features">Facturación</Link></li>
          </ul>
        </div>
        <div>
          <div className="z-footer-col-title">Empresa</div>
          <ul className="z-footer-links">
            <li><Link href="#">Nosotros</Link></li>
            <li><Link href="#">Blog</Link></li>
            <li><Link href="/pricing">Precios</Link></li>
            <li><Link href="#">Contacto</Link></li>
          </ul>
        </div>
        <div>
          <div className="z-footer-col-title">Soporte</div>
          <ul className="z-footer-links">
            <li><Link href="#">Centro de ayuda</Link></li>
            <li><Link href="#">Estado del sistema</Link></li>
            <li><Link href="#">Soporte por WhatsApp</Link></li>
            <li><Link href="#">Demo gratuita</Link></li>
          </ul>
        </div>
      </div>
      <div className="z-footer-bottom">
        <span className="z-footer-copy">© 2025 Zyncra. Hecho con 💈 en Colombia.</span>
        <div className="z-footer-legal">
          <Link href="#">Privacidad</Link>
          <Link href="#">Términos</Link>
          <Link href="#">Contacto</Link>
        </div>
      </div>
    </footer>
  );
}
