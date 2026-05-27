export default function WaFab() {
  return (
    <a
      href="https://wa.me/573000000000?text=Hola%2C+me+interesa+Zyncra+para+mi+negocio"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 18px",
        background: "linear-gradient(135deg, #25D366, #128C7E)",
        borderRadius: 999,
        boxShadow: "0 16px 40px -10px rgba(37,211,102,0.5), 0 0 30px rgba(37,211,102,0.3)",
        color: "white",
        fontSize: 13.5,
        fontWeight: 500,
        zIndex: 40,
        textDecoration: "none",
        fontFamily: "var(--font-sans)",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.3-4.5A9 9 0 1 1 21 12z" />
        <path d="M9 9.5c0-.5.4-1 1-1h.5c.3 0 .6.2.7.5l.6 1.5c.1.3 0 .6-.2.8L11 12c.6 1.2 1.6 2.2 2.8 2.8l.7-.6c.2-.2.5-.3.8-.2l1.5.6c.3.1.5.4.5.7v.5c0 .6-.4 1-1 1-3.5 0-6.5-3-6.5-6.5 0 0-.5-1.3-.8-.8z" />
      </svg>
      Hablemos
    </a>
  );
}
