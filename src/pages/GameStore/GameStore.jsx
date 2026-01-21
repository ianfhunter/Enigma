import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { categories } from '../../data/gameRegistry';
import {
  officialPacks,
  countGamesInPack,
  getPackagePreviewGames
} from '../../data/packageRegistry';
import { useInstalledPackages } from '../../hooks/useInstalledPackages';
import { useCustomPacks } from '../../hooks/useCustomPacks';
import { useCommunitySources } from '../../hooks/useCommunitySources';
import { renderIcon } from '../../utils/renderIcon';
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
function EmojiPicker({ value, onChange, t }) {
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
        aria-label={t('store.selectEmoji')}
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
function PackCard({ pack, isInstalled, onToggle, gameCount, previewGames, t }) {
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
            {gameCount === 1 ? t('store.gamesCount', { count: gameCount }) : t('store.gamesCountPlural', { count: gameCount })}
            {pack.type === 'official' && (
              <span className={styles.officialBadge}>{t('store.official')}</span>
            )}
            {pack.type === 'community' && (
              <span className={styles.communityBadge}>
                {t('store.community')}
                {pack.hasBackend && <span title={t('store.backend')}> ⚙️</span>}
              </span>
            )}
          </span>
        </div>
      </div>

      <p className={styles.packDescription}>{pack.description}</p>

      {previewGames.length > 0 && (
        <div className={styles.previewGames}>
          {previewGames.map((game) => (
            <span key={game.slug} className={styles.previewGame} title={game.title}>
              {renderIcon(game.icon || game.emojiIcon || '🎮', '', '🎮')}
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
          <>{t('store.included')}</>
        ) : isInstalled ? (
          <>
            <span className={styles.checkIcon}>✓</span>
            {t('store.installed')}
          </>
        ) : (
          <>{t('store.install')}</>
        )}
      </button>
    </div>
  );
}

/**
 * CustomPackCard - Displays a user-created external pack
 */
function CustomPackCard({ pack, onAddGame, onDelete, onEdit, onManageGames, t }) {
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
            {pack.games.length === 1 ? t('store.gamesCount', { count: pack.games.length }) : t('store.gamesCountPlural', { count: pack.games.length })}
            <span className={styles.customBadge}>{t('store.customBadge')}</span>
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
                {t('store.manageGamesModal')}
              </button>
              <button onClick={() => { onEdit(pack); setShowMenu(false); }}>
                {t('store.editPack')}
              </button>
              <button
                className={styles.deleteOption}
                onClick={() => { onDelete(pack.id); setShowMenu(false); }}
              >
                {t('store.deletePack')}
              </button>
            </div>
          )}
        </div>
      </div>

      <p className={styles.packDescription}>
        {pack.description || t('store.customCollection')}
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
          {t('store.manageGames')}
        </button>
        <button
          className={styles.addGameButton}
          onClick={() => onAddGame(pack.id)}
        >
          {t('store.addGame')}
        </button>
        {pack.games.length > 0 && (
          <Link
            to={`/custom/${pack.id}/${pack.games[0].id}`}
            className={styles.playButton}
          >
            {t('store.play')}
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Modal for creating/editing a pack
 */
function PackModal({ pack, onClose, onSave, t }) {
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
        <h2>{isEditing ? t('store.editPack').replace('✏️ ', '') : t('store.createExternalPack')}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="pack-name">{t('store.packName')}</label>
            <input
              id="pack-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('store.packNamePlaceholder')}
              required
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="pack-description">{t('store.description')}</label>
            <textarea
              id="pack-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('store.descriptionPlaceholder')}
              rows={2}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>{t('store.icon')}</label>
              <EmojiPicker value={icon} onChange={setIcon} t={t} />
            </div>

            <div className={styles.formGroup}>
              <label>{t('store.color')}</label>
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
              {t('common.cancel')}
            </button>
            <button type="submit" className={styles.submitButton}>
              {isEditing ? t('store.saveChanges') : t('store.createPack').replace('➕ ', '')}
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
function GameModal({ packId, game, onClose, onSave, onUpdate, t }) {
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
        setUrlError(t('store.urlMustBeHttp'));
      } else {
        setUrlError('');
      }
    } catch {
      setUrlError(t('store.urlInvalid'));
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
        <h2>{isEditing ? t('store.editGameTitle') : t('store.addGameTitle')}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="game-title">{t('store.gameTitle')}</label>
            <input
              id="game-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('store.gameTitlePlaceholder')}
              required
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="game-url">{t('store.gameUrl')}</label>
            <input
              id="game-url"
              type="url"
              value={url}
              onChange={e => {
                setUrl(e.target.value);
                validateUrl(e.target.value);
              }}
              placeholder={t('store.gameUrlPlaceholder')}
              required
              className={urlError ? styles.inputError : ''}
            />
            {urlError && <span className={styles.errorText}>{urlError}</span>}
            <span className={styles.helpText}>
              {t('store.gameUrlHelp')}
            </span>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>{t('store.icon')}</label>
              <EmojiPicker value={icon} onChange={setIcon} t={t} />
            </div>

            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label htmlFor="game-description">{t('store.gameDescription')}</label>
              <input
                id="game-description"
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('store.gameDescriptionPlaceholder')}
              />
            </div>
          </div>

          {/* Open Externally Toggle */}
          <div className={styles.toggleGroup}>
            <label className={styles.toggleLabel}>
              <span className={styles.toggleText}>
                <span className={styles.toggleTitle}>{t('store.openExternally')}</span>
                <span className={styles.toggleDescription}>
                  {t('store.openExternallyDescription')}
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
              {t('store.securityNote')}
            </p>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!title.trim() || !url.trim() || !!urlError}
            >
              {isEditing ? t('store.saveChanges') : t('store.addGameTitle')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * CommunitySourceCard - Displays a community source with its packs
 *
 * Structure:
 * - Source header (GitHub URL + Remove Source button)
 * - Pack(s) inside the source (with Install/Uninstall/Update buttons)
 */
function CommunitySourceCard({
  source,
  onInstall,
  onUninstall,
  onUpdate,
  onCheckUpdate,
  onRemove,
  isLoading,
  t,
}) {
  const [actionLoading, setActionLoading] = useState(null);

  const handleAction = async (action, handler) => {
    setActionLoading(action);
    try {
      await handler();
    } finally {
      setActionLoading(null);
    }
  };

  const hasUpdate = source.available_version && source.is_installed;

  return (
    <div className={styles.sourceCard}>
      {/* Source Header - URL and Remove button */}
      <div className={styles.sourceHeaderBar}>
        <code className={styles.sourceUrlCompact}>{source.url}</code>
        <button
          className={styles.removeSourceButtonCompact}
          onClick={() => handleAction('remove', () => onRemove(source.id))}
          disabled={isLoading || actionLoading}
          title={t('store.removeSource').replace('✕ ', '')}
        >
          {actionLoading === 'remove' ? (
            <span className={styles.spinner} />
          ) : (
            t('store.removeSource')
          )}
        </button>
      </div>

      {/* Pack Card - The actual pack from this source */}
      <div
        className={`${styles.packFromSource} ${source.is_installed ? styles.packInstalled : ''}`}
        style={{ '--source-color': source.color || '#6366f1' }}
      >
        <div className={styles.sourceHeader}>
          <div className={styles.sourceIcon}>
            {renderIcon(
              source.icon && source.pack_id && source.icon.includes('.svg') && !source.icon.startsWith('/') && !source.icon.startsWith('http') && !source.icon.startsWith('data:') && !source.icon.startsWith('<')
                ? `/api/packs/${source.pack_id}/${source.icon}`
                : source.icon,
              styles.sourceSvgIcon,
              '📦'
            )}
          </div>
          <div className={styles.sourceInfo}>
            <h3 className={styles.sourceName}>{source.name}</h3>
            <div className={styles.sourceMeta}>
              {source.latest_version && (
                <span className={styles.versionBadge}>{source.latest_version}</span>
              )}
              {source.is_installed && (
                <span className={styles.installedBadge}>
                  ✓ {t('store.installed')} ({source.installed_version})
                </span>
              )}
              {hasUpdate && (
                <span className={styles.updateBadge}>
                  {t('store.updateAvailable', { version: source.available_version })}
                </span>
              )}
              {source.has_backend === 1 && (
                <span className={styles.backendBadge}>{t('store.backend')}</span>
              )}
            </div>
          </div>
        </div>

        {source.description && (
          <p className={styles.sourceDescription}>{source.description}</p>
        )}

        {source.error_message && (
          <div className={styles.sourceError}>
            <span>⚠️</span>
            {source.error_message}
          </div>
        )}

        <div className={styles.packActions}>
          {!source.is_installed ? (
            <button
              className={`${styles.sourceActionButton} ${styles.installButton}`}
              onClick={() => handleAction('install', () => onInstall(source.id))}
              disabled={isLoading || actionLoading}
            >
              {actionLoading === 'install' ? (
                <><span className={styles.spinner} /> {t('store.installing')}</>
              ) : (
                <>{t('store.installPack')}</>
              )}
            </button>
          ) : (
            <>
              {hasUpdate && (
                <button
                  className={`${styles.sourceActionButton} ${styles.updateButton}`}
                  onClick={() => handleAction('update', () => onUpdate(source.id))}
                  disabled={isLoading || actionLoading}
                >
                  {actionLoading === 'update' ? (
                    <><span className={styles.spinner} /> {t('store.updating')}</>
                  ) : (
                    <>{t('store.updateTo', { version: source.available_version })}</>
                  )}
                </button>
              )}
              <button
                className={`${styles.sourceActionButton} ${styles.checkUpdateButton}`}
                onClick={() => handleAction('check', () => onCheckUpdate(source.id))}
                disabled={isLoading || actionLoading}
              >
                {actionLoading === 'check' ? (
                  <><span className={styles.spinner} /> {t('store.checking')}</>
                ) : (
                  <>{t('store.checkForUpdates')}</>
                )}
              </button>
              <button
                className={`${styles.sourceActionButton} ${styles.uninstallButton}`}
                onClick={() => handleAction('uninstall', () => onUninstall(source.id))}
                disabled={isLoading || actionLoading}
              >
                {actionLoading === 'uninstall' ? (
                  <><span className={styles.spinner} /> {t('store.uninstalling')}</>
                ) : (
                  <>{t('store.uninstall')}</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Modal to manage all games in a pack
 */
function ManageGamesModal({ pack, onClose, onEditGame, onDeleteGame, onAddGame, t }) {
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
                {pack.games.length === 1 ? t('store.gamesCount', { count: pack.games.length }) : t('store.gamesCountPlural', { count: pack.games.length })}
              </p>
            </div>
          </div>
          <button
            className={styles.addGameInlineButton}
            onClick={() => onAddGame(pack.id)}
          >
            {t('store.addGame')}
          </button>
        </div>

        {pack.games.length === 0 ? (
          <div className={styles.emptyGames}>
            <span className={styles.emptyGamesIcon}>📭</span>
            <p>{t('store.noGamesInPack')}</p>
            <button
              className={styles.addFirstGameButton}
              onClick={() => onAddGame(pack.id)}
            >
              {t('store.addFirstGame')}
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
                      <span className={styles.externalBadge} title={t('store.opensInNewTab')}>↗️</span>
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
                    title={t('store.playGame')}
                  >
                    ▶️
                  </Link>
                  <button
                    className={styles.gameListEdit}
                    onClick={() => onEditGame(pack.id, game)}
                    title={t('store.editGame')}
                  >
                    ✏️
                  </button>
                  <button
                    className={styles.gameListDelete}
                    onClick={() => setConfirmDelete(game.id)}
                    title={t('store.deleteGame')}
                  >
                    🗑️
                  </button>
                </div>

                {/* Delete confirmation inline */}
                {confirmDelete === game.id && (
                  <div className={styles.deleteConfirmInline}>
                    <span>{t('store.confirmDeleteGame', { name: game.title })}</span>
                    <button
                      className={styles.confirmYes}
                      onClick={() => handleDelete(game.id)}
                    >
                      {t('common.yes')}
                    </button>
                    <button
                      className={styles.confirmNo}
                      onClick={() => setConfirmDelete(null)}
                    >
                      {t('common.no')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className={styles.modalActions}>
          <button className={styles.submitButton} onClick={onClose}>
            {t('store.done')}
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
  const { t } = useTranslation();
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

  // Community sources management
  const {
    sources: communitySources2,
    isLoading: sourcesLoading,
    error: sourcesError,
    gitAvailable,
    hasUpdates,
    addSource,
    removeSource,
    installPack: installSourcePack,
    uninstallPack: uninstallSourcePack,
    updatePack: updateSourcePack,
    checkSourceUpdate,
    checkAllUpdates,
  } = useCommunitySources();

  const [activeTab, setActiveTab] = useState('official');
  const [showPackModal, setShowPackModal] = useState(false);
  const [editingPack, setEditingPack] = useState(null);
  const [addingGameToPackId, setAddingGameToPackId] = useState(null);
  const [managingPack, setManagingPack] = useState(null);
  const [editingGame, setEditingGame] = useState(null); // { packId, game }

  // Community source form state
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [addingSource, setAddingSource] = useState(false);
  const [sourceError, setSourceError] = useState(null);
  const [checkingAllUpdates, setCheckingAllUpdates] = useState(false);

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

  // Community source handlers
  const handleAddSource = async () => {
    if (!newSourceUrl.trim()) return;

    setAddingSource(true);
    setSourceError(null);

    const result = await addSource(newSourceUrl.trim());

    if (result.success) {
      setNewSourceUrl('');
    } else {
      setSourceError(result.error || 'Failed to add source');
    }

    setAddingSource(false);
  };

  const handleRemoveSource = async (sourceId) => {
    const result = await removeSource(sourceId);
    if (!result.success) {
      setSourceError(result.error || 'Failed to remove source');
    }
  };

  const handleInstallSource = async (sourceId) => {
    const result = await installSourcePack(sourceId);
    if (!result.success) {
      setSourceError(result.error || 'Failed to install pack');
    }
  };

  const handleUninstallSource = async (sourceId) => {
    const result = await uninstallSourcePack(sourceId);
    if (!result.success) {
      setSourceError(result.error || 'Failed to uninstall pack');
    }
  };

  const handleUpdateSource = async (sourceId) => {
    const result = await updateSourcePack(sourceId);
    if (!result.success) {
      setSourceError(result.error || 'Failed to update pack');
    }
  };

  const handleCheckSourceUpdate = async (sourceId) => {
    await checkSourceUpdate(sourceId);
  };

  const handleCheckAllUpdates = async () => {
    setCheckingAllUpdates(true);
    await checkAllUpdates();
    setCheckingAllUpdates(false);
  };

  return (
    <div className={styles.store}>
      {/* Header */}
      <header className={styles.header}>
        <Link to="/" className={styles.backLink}>{t('store.backToGames')}</Link>
        <h1 className={styles.title}>
          <span className={styles.titleIcon}>🏪</span>
          {t('store.title')}
        </h1>
        <p className={styles.subtitle}>
          {t('store.subtitle')}
        </p>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {installedPackages.length + customPacks.length}
            </span>
            <span className={styles.statLabel}>{t('store.packsInstalled')}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {totalInstalledGames + customTotalGames}
            </span>
            <span className={styles.statLabel}>{t('store.totalGames')}</span>
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
          {t('store.officialPacks')}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'community' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('community')}
        >
          <span className={styles.tabIcon}>🌍</span>
          {t('store.communityPacks')}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'custom' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('custom')}
        >
          <span className={styles.tabIcon}>🛠️</span>
          {t('store.myExternalPacks')}
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
                {t('store.officialPacks')}
              </h2>
              <p className={styles.sectionDescription}>
                {t('store.officialPacksDescription')}
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
                  t={t}
                />
              ))}
            </div>
          </section>
        )}

        {activeTab === 'community' && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>🌍</span>
                  {t('store.communitySourcesTitle')}
              </h2>
              <p className={styles.sectionDescription}>
                  {t('store.communitySourcesDescription')}
              </p>
            </div>
            </div>

            {/* Git availability warning */}
            {gitAvailable === false && (
              <div className={styles.gitWarning}>
                <span className={styles.warningIcon}>⚠️</span>
                <p>
                  {t('store.gitNotAvailable')}
                </p>
              </div>
            )}

            {/* Backend warning */}
                  <div className={styles.communityWarning}>
                    <span className={styles.warningIcon}>⚠️</span>
                    <p>
                {t('store.communityWarning')}
                    </p>
                  </div>

            {/* Add source form */}
            <div className={styles.addSourceForm}>
              <input
                type="text"
                className={styles.addSourceInput}
                placeholder={t('store.addSourcePlaceholder')}
                value={newSourceUrl}
                onChange={(e) => {
                  setNewSourceUrl(e.target.value);
                  setSourceError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSourceUrl.trim()) {
                    handleAddSource();
                  }
                }}
                disabled={addingSource}
              />
              <button
                className={styles.addSourceButton}
                onClick={handleAddSource}
                disabled={addingSource || !newSourceUrl.trim()}
              >
                {addingSource ? (
                  <><span className={styles.spinner} /> {t('store.adding')}</>
                ) : (
                  <>{t('store.addSource')}</>
                )}
              </button>
            </div>

            {sourceError && (
              <div className={styles.sourceError} style={{ marginBottom: '1rem' }}>
                <span>⚠️</span>
                {sourceError}
              </div>
            )}

            {sourcesLoading ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <span className={styles.spinner} style={{ width: 40, height: 40 }} />
                </div>
                <p>{t('store.loadingCommunitySources')}</p>
              </div>
            ) : communitySources2.length === 0 ? (
              <div className={styles.sourcesEmptyState}>
                <div className={styles.emptyIcon}>📭</div>
                <h4>{t('store.noCommunitySources')}</h4>
                <p>
                  {t('store.tryExample')} <code>git@github.com:ianfhunter/EnigmaSampleCommunityPack.git</code>
                </p>
              </div>
            ) : (
              <>
                <div className={styles.sourceGrid}>
                  {communitySources2.map((source) => (
                    <CommunitySourceCard
                      key={source.id}
                      source={source}
                      onInstall={handleInstallSource}
                      onUninstall={handleUninstallSource}
                      onUpdate={handleUpdateSource}
                      onCheckUpdate={handleCheckSourceUpdate}
                      onRemove={handleRemoveSource}
                      isLoading={sourcesLoading}
                      t={t}
                    />
                  ))}
                </div>

                <div className={styles.checkAllUpdatesSection}>
                  <button
                    className={styles.checkAllUpdatesButton}
                    onClick={handleCheckAllUpdates}
                    disabled={checkingAllUpdates}
                  >
                    {checkingAllUpdates ? (
                      <><span className={styles.spinner} /> {t('store.checking')}</>
                    ) : (
                      <>{t('store.checkAllUpdates')}</>
                    )}
                  </button>
                  <span className={styles.updatesInfo}>
                    {hasUpdates ? (
                      <span className={styles.updatesAvailable}>
                        {t('store.updatesAvailable')}
                      </span>
                    ) : (
                      <>{t('store.allPacksUpToDate')}</>
                    )}
                  </span>
                </div>
              </>
            )}

          </section>
        )}

        {activeTab === 'custom' && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>🛠️</span>
                  {t('store.externalPacksTitle')}
                </h2>
                <p className={styles.sectionDescription}>
                  {t('store.externalPacksDescription')}
                </p>
              </div>
              <button
                className={styles.createPackButton}
                onClick={() => {
                  setEditingPack(null);
                  setShowPackModal(true);
                }}
              >
                {t('store.createPack')}
              </button>
            </div>

            {customPacks.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📦</div>
                <h3>{t('store.noExternalPacks')}</h3>
                <p>
                  {t('store.noExternalPacksDescription')}
                </p>
                <button
                  className={styles.createFirstPackButton}
                  onClick={() => {
                    setEditingPack(null);
                    setShowPackModal(true);
                  }}
                >
                  {t('store.createFirstPack')}
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
                    t={t}
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
          t={t}
        />
      )}

      {/* Add Game Modal */}
      {addingGameToPackId && (
        <GameModal
          packId={addingGameToPackId}
          onClose={() => setAddingGameToPackId(null)}
          onSave={addGameToPack}
          onUpdate={updateGame}
          t={t}
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
          t={t}
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
          t={t}
        />
      )}
    </div>
  );
}
