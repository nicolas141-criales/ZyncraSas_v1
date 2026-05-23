import styles from "./admin.module.css";

interface ComingSoonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}

export default function ComingSoon({ icon, title, description, features }: ComingSoonProps) {
  return (
    <div className={styles.comingSoonPage}>
      <div className={styles.comingSoonIcon}>{icon}</div>
      <div className={styles.comingSoonBadge}>✦ Próximamente</div>
      <h1 className={styles.comingSoonTitle}>{title}</h1>
      <p className={styles.comingSoonSub}>{description}</p>
      {features.length > 0 && (
        <div className={styles.comingSoonFeats}>
          {features.map((f, i) => (
            <div key={i} className={styles.comingSoonFeat}>
              <div className={styles.comingSoonFeatDot} />
              {f}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
