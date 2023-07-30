import styles from "./footer.module.css";
import Image from 'next/image';

export default function Footer() {
  return (
    <div className={styles.footer}>
      <p className={styles.get_started}>
        Made with 💜 love by <span>J. Valeska</span>
      </p>
      <div className={styles.icons_container}>
        <div>
          <a
            href="https://github.com/jvaleskadevs/sba"
            target={"_blank"}
          >
            Leave a star on Github
          </a>
        </div>
        <div>
          <a href="https://warpcast.com/j-valeska" target={"_blank"}>
            Follow us on Farcaster
          </a>
        </div>
      </div>
    </div>
  );
}
