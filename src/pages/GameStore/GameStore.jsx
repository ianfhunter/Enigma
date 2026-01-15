import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { categories } from '../../data/gameRegistry';
import {
  officialPacks,
  countGamesInPack,
  getPackagePreviewGames
} from '../../data/packageRegistry';
import { useInstalledPackages } from '../../hooks/useInstalledPackages';
import { useCustomPacks } from '../../hooks/useCustomPacks';
import styles from './GameStore.module.css';

/**
 * Common emojis organized by category for the emoji picker
 */
const EMOJI_CATEGORIES = [
  {
    name: 'Games',
    emojis: ['🎮', '🕹️', '🎲', '🎯', '🎪', '🎨', '🎭', '🎰', '🃏', '🀄', '♟️', '🎱'],
  },
  {
    name: 'Puzzles',
    emojis: ['🧩', '🔢', '🔤', '🔠', '📝', '✏️', '🖊️', '📐', '📏', '🧮', '🔍', '🔎'],
  },
  {
    name: 'Symbols',
    emojis: ['⭐', '✨', '💫', '🌟', '⚡', '🔥', '💥', '💯', '🎵', '🎶', '💎', '🏆'],
  },
  {
    name: 'Nature',
    emojis: ['🌈', '🌸', '🌺', '🌻', '🌴', '🌵', '🍀', '🌙', '☀️', '🌊', '❄️', '🔮'],
  },
  {
    name: 'Objects',
    emojis: ['📦', '🎁', '🎈', '🎀', '🏠', '🚀', '✈️', '🚗', '⚙️', '🔧', '💡', '📚'],
  },
  {
    name: 'Food',
    emojis: ['🍕', '🍔', '🍟', '🌮', '🍩', '🍪', '🎂', '🍭', '🍬', '☕', '🧁', '🍿'],
  },
  {
    name: 'Animals',
    emojis: ['🐱', '🐶', '🐼', '🦊', '🦁', '🐸', '🦋', '🐝', '🦄', '🐉', '🦖', '🐙'],
  },
  {
    name: 'Faces',
    emojis: ['😀', '😎', '🤔', '🧐', '🤓', '😈', '👻', '🤖', '👽', '💀', '🎃', '😺'],
  },
];

/**
 * EmojiPicker - A grid of emojis organized by category
 */
function EmojiPicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

  const handleSelect = (emoji) => {
    onChange(emoji);
    setIsOpen(false);
  };

  return (
    <div className={styles.emojiPickerContainer}>
      <button
        type="button"
        className={styles.emojiPickerButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select emoji"
      >
        <span className={styles.emojiPickerValue}>{value}</span>
        <span className={styles.emojiPickerArrow}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className={styles.emojiPickerDropdown}>
          <div className={styles.emojiCategoryTabs}>
            {EMOJI_CATEGORIES.map((cat, idx) => (
              <button
                key={cat.name}
                type="button"
                className={`${styles.emojiCategoryTab} ${activeCategory === idx ? styles.activeEmojiTab : ''}`}
                onClick={() => setActiveCategory(idx)}
                title={cat.name}
              >
                {cat.emojis[0]}
              </button>
            ))}
          </div>
          <div className={styles.emojiGrid}>
            {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`${styles.emojiOption} ${value === emoji ? styles.selectedEmoji : ''}`}
                onClick={() => handleSelect(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * PackCard - Displays a single official package with install/uninstall functionality
 */
function PackCard({ pack, isInstalled, onToggle, gameCount, previewGames }) {
  const handleClick = () => {
    if (pack.removable) {
      onToggle(pack.id);
    }
  };

  return (
    <div
      className={`${styles.packCard} ${isInstalled ? styles.installed : ''}`}
      style={{ '--pack-color': pack.color }}
    >
      <div className={styles.packHeader}>
        <div className={styles.packIcon}>{pack.icon}</div>
        <div className={styles.packInfo}>
          <h3 className={styles.packName}>{pack.name}</h3>
          <span className={styles.packMeta}>
            {gameCount} games
            {pack.type === 'official' && (
              <span className={styles.officialBadge}>✓ Official</span>
            )}
          </span>
        </div>
      </div>

      <p className={styles.packDescription}>{pack.description}</p>

      {previewGames.length > 0 && (
        <div className={styles.previewGames}>
          {previewGames.map((game) => (
            <span key={game.slug} className={styles.previewGame} title={game.title}>
              {typeof game.icon === 'string' && !game.icon.endsWith('.svg')
                ? game.icon
                : game.emojiIcon || '🎮'}
            </span>
          ))}
          {gameCount > previewGames.length && (
            <span className={styles.moreGames}>+{gameCount - previewGames.length}</span>
          )}
        </div>
      )}

      <button
        className={`${styles.packButton} ${isInstalled ? styles.installedButton : ''}`}
        onClick={handleClick}
        disabled={!pack.removable && isInstalled}
      >
        {!pack.removable && isInstalled ? (
          <>Included</>
        ) : isInstalled ? (
          <>
            <span className={styles.checkIcon}>✓</span>
            Installed
          </>
        ) : (
          <>Install</>
        )}
      </button>
    </div>
  );
}

/**
 * CustomPackCard - Displays a user-created custom pack
 */
function CustomPackCard({ pack, onAddGame, onDelete, onEdit, onManageGames }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={`${styles.packCard} ${styles.customPack}`}
      style={{ '--pack-color': pack.color }}
    >
      <div className={styles.packHeader}>
        <div className={styles.packIcon}>{pack.icon}</div>
        <div className={styles.packInfo}>
          <h3 className={styles.packName}>{pack.name}</h3>
          <span className={styles.packMeta}>
            {pack.games.length} game{pack.games.length !== 1 ? 's' : ''}
            <span className={styles.customBadge}>Custom</span>
          </span>
        </div>
        <div className={styles.packMenu}>
          <button
            className={styles.menuButton}
            onClick={() => setShowMenu(!showMenu)}
          >
            ⋮
          </button>
          {showMenu && (
            <div className={styles.menuDropdown}>
              <button onClick={() => { onManageGames(pack); setShowMenu(false); }}>
                📋 Manage Games
              </button>
              <button onClick={() => { onEdit(pack); setShowMenu(false); }}>
                ✏️ Edit Pack
              </button>
              <button
                className={styles.deleteOption}
                onClick={() => { onDelete(pack.id); setShowMenu(false); }}
              >
                🗑️ Delete Pack
              </button>
            </div>
          )}
        </div>
      </div>

      <p className={styles.packDescription}>
        {pack.description || 'Your custom game collection'}
      </p>

      {pack.games.length > 0 && (
        <div className={styles.previewGames}>
          {pack.games.slice(0, 5).map((game) => (
            <Link
              key={game.id}
              to={`/custom/${pack.id}/${game.id}`}
              className={styles.previewGame}
              title={game.title}
            >
              {game.icon || '🎮'}
            </Link>
          ))}
          {pack.games.length > 5 && (
            <span className={styles.moreGames}>+{pack.games.length - 5}</span>
          )}
        </div>
      )}

      <div className={styles.customPackActions}>
        <button
          className={styles.manageGamesButton}
          onClick={() => onManageGames(pack)}
        >
          📋 Manage
        </button>
        <button
          className={styles.addGameButton}
          onClick={() => onAddGame(pack.id)}
        >
          ➕ Add
        </button>
        {pack.games.length > 0 && (
          <Link
            to={`/custom/${pack.id}/${pack.games[0].id}`}
            className={styles.playButton}
          >
            ▶️ Play
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Modal for creating/editing a pack
 */
function PackModal({ pack, onClose, onSave }) {
  const [name, setName] = useState(pack?.name || '');
  const [description, setDescription] = useState(pack?.description || '');
  const [icon, setIcon] = useState(pack?.icon || '🎮');
  const [color, setColor] = useState(pack?.color || '#f59e0b');

  const isEditing = !!pack?.id;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), description: description.trim(), icon, color });
    onClose();
  };

  const colorOptions = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  ];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2>{isEditing ? 'Edit Pack' : 'Create Custom Pack'}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="pack-name">Pack Name</label>
            <input
              id="pack-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My Awesome Games"
              required
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="pack-description">Description (optional)</label>
            <textarea
              id="pack-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A collection of my favorite web games"
              rows={2}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Icon</label>
              <EmojiPicker value={icon} onChange={setIcon} />
            </div>

            <div className={styles.formGroup}>
              <label>Color</label>
              <div className={styles.colorPicker}>
                {colorOptions.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`${styles.colorOption} ${color === c ? styles.selectedColor : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton}>
              {isEditing ? 'Save Changes' : 'Create Pack'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal for adding or editing a game in a pack
 */
function GameModal({ packId, game, onClose, onSave, onUpdate }) {
  const isEditing = !!game;
  const [title, setTitle] = useState(game?.title || '');
  const [url, setUrl] = useState(game?.url || '');
  const [description, setDescription] = useState(game?.description || '');
  const [icon, setIcon] = useState(game?.icon || '🎮');
  const [openExternal, setOpenExternal] = useState(game?.openExternal || false);
  const [urlError, setUrlError] = useState('');

  const validateUrl = (value) => {
    if (!value) {
      setUrlError('');
      return;
    }
    try {
      const parsed = new URL(value);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setUrlError('URL must start with http:// or https://');
      } else {
        setUrlError('');
      }
    } catch {
      setUrlError('Please enter a valid URL');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !url.trim() || urlError) return;

    const gameData = {
      title: title.trim(),
      url: url.trim(),
      description: description.trim(),
      icon,
      openExternal,
    };

    if (isEditing) {
      onUpdate(packId, game.id, gameData);
    } else {
      onSave(packId, gameData);
    }
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2>{isEditing ? 'Edit Game' : 'Add Game'}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="game-title">Game Title</label>
            <input
              id="game-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Cool Puzzle Game"
              required
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="game-url">Game URL</label>
            <input
              id="game-url"
              type="url"
              value={url}
              onChange={e => {
                setUrl(e.target.value);
                validateUrl(e.target.value);
              }}
              placeholder="https://example.com/game"
              required
              className={urlError ? styles.inputError : ''}
            />
            {urlError && <span className={styles.errorText}>{urlError}</span>}
            <span className={styles.helpText}>
              Enter the URL of any web-based game. It will be displayed in an iframe.
            </span>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Icon</label>
              <EmojiPicker value={icon} onChange={setIcon} />
            </div>

            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label htmlFor="game-description">Description (optional)</label>
              <input
                id="game-description"
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="A fun puzzle game"
              />
            </div>
          </div>

          {/* Open Externally Toggle */}
          <div className={styles.toggleGroup}>
            <label className={styles.toggleLabel}>
              <span className={styles.toggleText}>
                <span className={styles.toggleTitle}>Open externally by default</span>
                <span className={styles.toggleDescription}>
                  Opens in a new tab instead of embedding. Use for sites that block iframes.
                </span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={openExternal}
                className={`${styles.toggleSwitch} ${openExternal ? styles.toggleOn : ''}`}
                onClick={() => setOpenExternal(!openExternal)}
              >
                <span className={styles.toggleKnob} />
              </button>
            </label>
          </div>

          <div className={styles.securityNote}>
            <span className={styles.securityIcon}>🔒</span>
            <p>
              Games run in a sandboxed iframe for security. Some sites may block embedding.
            </p>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!title.trim() || !url.trim() || !!urlError}
            >
              {isEditing ? 'Save Changes' : 'Add Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal to manage all games in a pack
 */
function ManageGamesModal({ pack, onClose, onEditGame, onDeleteGame, onAddGame }) {
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleDelete = (gameId) => {
    onDeleteGame(pack.id, gameId);
    setConfirmDelete(null);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.wideModal}`} onClick={e => e.stopPropagation()}>
        <div className={styles.manageHeader}>
          <div className={styles.manageHeaderInfo}>
            <span className={styles.managePackIcon}>{pack.icon}</span>
            <div>
              <h2>{pack.name}</h2>
              <p className={styles.manageSubtitle}>
                {pack.games.length} game{pack.games.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            className={styles.addGameInlineButton}
            onClick={() => onAddGame(pack.id)}
          >
            ➕ Add Game
          </button>
        </div>

        {pack.games.length === 0 ? (
          <div className={styles.emptyGames}>
            <span className={styles.emptyGamesIcon}>📭</span>
            <p>No games in this pack yet</p>
            <button
              className={styles.addFirstGameButton}
              onClick={() => onAddGame(pack.id)}
            >
              Add Your First Game
            </button>
          </div>
        ) : (
          <div className={styles.gamesList}>
            {pack.games.map((game) => (
              <div key={game.id} className={styles.gameListItem}>
                <div className={styles.gameListIcon}>{game.icon || '🎮'}</div>
                <div className={styles.gameListInfo}>
                  <h4 className={styles.gameListTitle}>
                    {game.title}
                    {game.openExternal && (
                      <span className={styles.externalBadge} title="Opens in new tab">↗️</span>
                    )}
                  </h4>
                  <p className={styles.gameListUrl}>{game.url}</p>
                  {game.description && (
                    <p className={styles.gameListDesc}>{game.description}</p>
                  )}
                </div>
                <div className={styles.gameListActions}>
                  <Link
                    to={`/custom/${pack.id}/${game.id}`}
                    className={styles.gameListPlay}
                    title="Play game"
                  >
                    ▶️
                  </Link>
                  <button
                    className={styles.gameListEdit}
                    onClick={() => onEditGame(pack.id, game)}
                    title="Edit game"
                  >
                    ✏️
                  </button>
                  <button
                    className={styles.gameListDelete}
                    onClick={() => setConfirmDelete(game.id)}
                    title="Delete game"
                  >
                    🗑️
                  </button>
                </div>

                {/* Delete confirmation inline */}
                {confirmDelete === game.id && (
                  <div className={styles.deleteConfirmInline}>
                    <span>Delete "{game.title}"?</span>
                    <button
                      className={styles.confirmYes}
                      onClick={() => handleDelete(game.id)}
                    >
                      Yes
                    </button>
                    <button
                      className={styles.confirmNo}
                      onClick={() => setConfirmDelete(null)}
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className={styles.modalActions}>
          <button className={styles.submitButton} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * GameStore - Browse and install game packs
 */
export default function GameStore() {
  const { installedPackages, isInstalled, togglePackage } = useInstalledPackages();
  const {
    customPacks,
    totalGames: customTotalGames,
    createPack,
    updatePack,
    deletePack,
    addGameToPack,
    updateGame,
    removeGameFromPack,
  } = useCustomPacks();

  const [activeTab, setActiveTab] = useState('official');
  const [showPackModal, setShowPackModal] = useState(false);
  const [editingPack, setEditingPack] = useState(null);
  const [addingGameToPackId, setAddingGameToPackId] = useState(null);
  const [managingPack, setManagingPack] = useState(null);
  const [editingGame, setEditingGame] = useState(null); // { packId, game }

  // Calculate game counts for each official pack
  const packData = useMemo(() => {
    return officialPacks.map(pack => ({
      ...pack,
      gameCount: countGamesInPack(pack.id, categories),
      previewGames: getPackagePreviewGames(pack.id, categories, 5),
    }));
  }, []);

  // Count total installed official games
  const totalInstalledGames = useMemo(() => {
    return packData
      .filter(pack => isInstalled(pack.id))
      .reduce((sum, pack) => sum + pack.gameCount, 0);
  }, [packData, isInstalled]);

  // Handle pack creation/editing
  const handleSavePack = (data) => {
    if (editingPack?.id) {
      updatePack(editingPack.id, data);
    } else {
      createPack(data);
    }
    setEditingPack(null);
  };

  // Handle edit pack click
  const handleEditPack = (pack) => {
    setEditingPack(pack);
    setShowPackModal(true);
  };

  // Handle manage games click
  const handleManageGames = (pack) => {
    setManagingPack(pack);
  };

  // Handle edit game from manage modal
  const handleEditGame = (packId, game) => {
    setEditingGame({ packId, game });
    setManagingPack(null); // Close manage modal while editing
  };

  // Handle add game from manage modal
  const handleAddGameFromManage = (packId) => {
    setAddingGameToPackId(packId);
    setManagingPack(null); // Close manage modal while adding
  };

  return (
    <div className={styles.store}>
      {/* Header */}
      <header className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>
          <span className={styles.titleIcon}>🏪</span>
          Game Store
        </h1>
        <p className={styles.subtitle}>
          Browse and install puzzle packs to customize your collection
        </p>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {installedPackages.length + customPacks.length}
            </span>
            <span className={styles.statLabel}>Packs Installed</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {totalInstalledGames + customTotalGames}
            </span>
            <span className={styles.statLabel}>Total Games</span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'official' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('official')}
        >
          <span className={styles.tabIcon}>✨</span>
          Official Packs
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'community' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('community')}
        >
          <span className={styles.tabIcon}>🌍</span>
          Community Packs
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'custom' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('custom')}
        >
          <span className={styles.tabIcon}>🛠️</span>
          My Custom Packs
          {customPacks.length > 0 && (
            <span className={styles.tabBadge}>{customPacks.length}</span>
          )}
        </button>
      </nav>

      {/* Tab Content */}
      <main className={styles.content}>
        {activeTab === 'official' && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>✨</span>
                Official Packs
              </h2>
              <p className={styles.sectionDescription}>
                Curated puzzle collections verified by the Enigma team
              </p>
            </div>
            <div className={styles.packGrid}>
              {packData.map((pack) => (
                <PackCard
                  key={pack.id}
                  pack={pack}
                  isInstalled={isInstalled(pack.id)}
                  onToggle={togglePackage}
                  gameCount={pack.gameCount}
                  previewGames={pack.previewGames}
                />
              ))}
            </div>
          </section>
        )}

        {activeTab === 'community' && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>🌍</span>
                Community Packs
              </h2>
              <p className={styles.sectionDescription}>
                Puzzle packs created by the community
              </p>
            </div>
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🚧</div>
              <h3>Coming Soon</h3>
              <p>
                Community packs will allow puzzle creators to share their games with everyone.
                Stay tuned for updates!
              </p>
            </div>
          </section>
        )}

        {activeTab === 'custom' && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>🛠️</span>
                  My Custom Packs
                </h2>
                <p className={styles.sectionDescription}>
                  Create your own packs with games from anywhere on the web
                </p>
              </div>
              <button
                className={styles.createPackButton}
                onClick={() => {
                  setEditingPack(null);
                  setShowPackModal(true);
                }}
              >
                ➕ Create Pack
              </button>
            </div>

            {customPacks.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📦</div>
                <h3>No custom packs yet</h3>
                <p>
                  Create a pack to add your favorite web-based puzzle games.
                  You can embed any game that runs in a browser!
                </p>
                <button
                  className={styles.createFirstPackButton}
                  onClick={() => {
                    setEditingPack(null);
                    setShowPackModal(true);
                  }}
                >
                  Create Your First Pack
                </button>
              </div>
            ) : (
              <div className={styles.packGrid}>
                {customPacks.map((pack) => (
                  <CustomPackCard
                    key={pack.id}
                    pack={pack}
                    onAddGame={setAddingGameToPackId}
                    onDelete={deletePack}
                    onEdit={handleEditPack}
                    onManageGames={handleManageGames}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Modals */}
      {showPackModal && (
        <PackModal
          pack={editingPack}
          onClose={() => {
            setShowPackModal(false);
            setEditingPack(null);
          }}
          onSave={handleSavePack}
        />
      )}

      {/* Add Game Modal */}
      {addingGameToPackId && (
        <GameModal
          packId={addingGameToPackId}
          onClose={() => setAddingGameToPackId(null)}
          onSave={addGameToPack}
          onUpdate={updateGame}
        />
      )}

      {/* Edit Game Modal */}
      {editingGame && (
        <GameModal
          packId={editingGame.packId}
          game={editingGame.game}
          onClose={() => setEditingGame(null)}
          onSave={addGameToPack}
          onUpdate={updateGame}
        />
      )}

      {/* Manage Games Modal */}
      {managingPack && (
        <ManageGamesModal
          pack={managingPack}
          onClose={() => setManagingPack(null)}
          onEditGame={handleEditGame}
          onDeleteGame={removeGameFromPack}
          onAddGame={handleAddGameFromManage}
        />
      )}
    </div>
  );
}
