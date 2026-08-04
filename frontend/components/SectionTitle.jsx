import styles from "./SectionTitle.module.css";

export default function SectionTitle({ fa, en }) {
  return (
    <div className={styles.sectionTitleContainer}>
      {en && <div className={styles.sectionTitleGhost}>{en}</div>}
      <h2 className={styles.sectionTitleMain}>{fa}</h2>
    </div>
  );
}
