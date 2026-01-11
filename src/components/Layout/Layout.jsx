import { Link, Outlet } from 'react-router-dom';
import { useFavicon } from '../../hooks/useFavicon';
import logo from '../../branding/logo.svg';
import styles from './Layout.module.css';

export default function Layout() {
  useFavicon();

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link to="/" className={styles.logo}>
            <img src={logo} alt="Enigma" className={styles.logoIcon} />
            <span className={styles.logoText}>Enigma</span>
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
