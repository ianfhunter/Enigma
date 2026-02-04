import { SYSTEM_IDS } from '../../data/anatomyData';

export function getDisplaySystemIds(selectedSystem, currentPartSystemId) {
  if (selectedSystem === 'all') {
    return SYSTEM_IDS;
  }

  const displaySystems = new Set([selectedSystem]);
  if (currentPartSystemId && currentPartSystemId !== selectedSystem) {
    displaySystems.add(currentPartSystemId);
  }

  return Array.from(displaySystems);
}
