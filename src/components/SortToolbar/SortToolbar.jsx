import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SORT_OPTIONS } from '../../utils/sortUtils';
import styles from './SortToolbar.module.css';

/**
 * SortToolbar - Toolbar component for sorting games
 * @param {Object} props
 * @param {string} props.currentSort - Current sort option
 * @param {Function} props.onSortChange - Callback when sort option changes
 * @param {string} props.sortOrder - Current sort order ('normal' or 'reverse')
 * @param {Function} props.onSortOrderChange - Callback when sort order changes
 * @param {boolean} props.groupInPacks - Current group in packs state
 * @param {Function} props.onGroupInPacksChange - Callback when group in packs changes
 */
export default function SortToolbar({
  currentSort,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  groupInPacks,
  onGroupInPacksChange
}) {
  const { t } = useTranslation();

  const sortOptions = [
    { value: SORT_OPTIONS.DEFAULT, label: t('home.sort.default'), icon: '🔀' },
    { value: SORT_OPTIONS.ALPHABETICAL, label: t('home.sort.alphabetical'), icon: '🔤' },
    { value: SORT_OPTIONS.RECENTLY_UPDATED, label: t('home.sort.recentlyUpdated'), icon: '🆕' },
    { value: SORT_OPTIONS.RECENTLY_PLAYED, label: t('home.sort.recentlyPlayed'), icon: '🕒' },
  ];

  const handleSortClick = (optionValue) => {
    if (optionValue === SORT_OPTIONS.DEFAULT) {
      // Default sorting doesn't toggle
      onSortChange(optionValue);
      onSortOrderChange('normal');
    } else if (currentSort === optionValue) {
      // Toggle between normal and reverse for alphabetical and recently updated
      const newOrder = sortOrder === 'normal' ? 'reverse' : 'normal';
      onSortOrderChange(newOrder);
    } else {
      // Switch to a different sort option, reset to normal order
      onSortChange(optionValue);
      onSortOrderChange('normal');
    }
  };

  const handleGroupInPacksToggle = () => {
    onGroupInPacksChange(!groupInPacks);
  };

  return (
    <div className={styles.toolbar}>
      <div className={styles.label}>{t('home.sort.label')}:</div>
      <div className={styles.buttons}>
        {sortOptions.map((option) => {
          const isActive = currentSort === option.value;
          const isReversed = isActive && sortOrder === 'reverse';

          return (
            <button
              key={option.value}
              className={`${styles.button} ${isActive ? styles.active : ''} ${isReversed ? styles.reversed : ''}`}
              onClick={() => handleSortClick(option.value)}
              title={option.label}
            >
              <span className={styles.icon}>
                {option.icon}
                {isActive && isReversed && <span className={styles.reverseIndicator}>↓</span>}
              </span>
              <span className={styles.text}>{option.label}</span>
            </button>
          );
        })}

        {/* Group in Packs Toggle */}
        <button
          className={`${styles.button} ${groupInPacks ? styles.active : ''}`}
          onClick={handleGroupInPacksToggle}
          title={t('home.sort.groupInPacks')}
        >
          <span className={styles.icon}>📦</span>
          <span className={styles.text}>{t('home.sort.groupInPacks')}</span>
        </button>
      </div>
    </div>
  );
}
