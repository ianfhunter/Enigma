import { useNavigate } from 'react-router-dom';
import GameCard from '../../components/GameCard';
import { categories, enabledGames, allGames } from '../../data/gameRegistry';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();

  const handleSurpriseMe = () => {
    const randomGame = enabledGames[Math.floor(Math.random() * enabledGames.length)];
    navigate(`/${randomGame.slug}`);
  };

  // Count total games and games in development
  const totalGames = allGames.length;
  const devGames = allGames.filter(game => game.version === 'DEV').length;
  const releasedGames = totalGames - devGames;

  return (
    <div className={styles.home}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Welcome to Game Hub</h1>
        <p className={styles.subtitle}>
          A collection of classic word and number puzzles. Challenge yourself and have fun!
        </p>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{releasedGames}</span>
            <span className={styles.statLabel}>Games</span>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{devGames}</span>
            <span className={styles.statLabel}>In Development</span>
          </div>
        </div>
        <button className={styles.surpriseButton} onClick={handleSurpriseMe}>
          <span className={styles.surpriseIcon}>🎲</span>
          Surprise Me!
        </button>
      </div>

      {categories.map((category) => (
        <section key={category.name} className={styles.category}>
          <h2 className={styles.categoryTitle}>
            <span className={styles.categoryIcon}>{category.icon}</span>
            {category.name}
            <span className={styles.gameCount}>{category.games.length}</span>
          </h2>
          <div className={styles.grid}>
            {category.games.map((game) => (
              <GameCard
                key={game.slug}
                title={game.title}
                slug={game.slug}
                description={game.description}
                disabled={game.disabled}
                tag={game.tag}
                version={game.version}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
