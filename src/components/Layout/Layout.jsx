import { Link, Outlet } from 'react-router-dom';
import { useFavicon } from '../../hooks/useFavicon';
import styles from './Layout.module.css';

export default function Layout() {
  useFavicon();

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoIcon}>🎮</span>
            <span className={styles.logoText}>Game Hub</span>
          </Link>
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <p>Self-hosted games collection</p>
      </footer>
    </div>
  );
}
