/**
 * Anatomy Quiz Data
 *
 * Body part definitions organized by system.
 * Now uses SVG paths from anatomySvgPaths.js for accurate anatomical rendering.
 *
 * License: Data compiled for educational purposes.
 */

export const BODY_SYSTEMS = {
  skeletal: {
    name: 'Skeletal System',
    icon: '🦴',
    color: '#f5f0e6',
    parts: [
      // Head
      { id: 'skull', name: 'Skull', hint: 'Protects the brain' },
      { id: 'mandible', name: 'Mandible', hint: 'The jawbone' },

      // Spine & Torso
      { id: 'cervical-vertebrae', name: 'Cervical Vertebrae', hint: 'Neck bones (7 vertebrae)' },
      { id: 'clavicle', name: 'Clavicle', hint: 'The collarbone' },
      { id: 'scapula', name: 'Scapula', hint: 'The shoulder blade' },
      { id: 'sternum', name: 'Sternum', hint: 'The breastbone' },
      { id: 'ribs', name: 'Ribs', hint: 'Protect heart and lungs (12 pairs)' },
      { id: 'thoracic-vertebrae', name: 'Thoracic Vertebrae', hint: 'Upper back (12 vertebrae)' },
      { id: 'lumbar-vertebrae', name: 'Lumbar Vertebrae', hint: 'Lower back (5 vertebrae)' },
      { id: 'pelvis', name: 'Pelvis', hint: 'Hip bones, supports upper body' },
      { id: 'sacrum', name: 'Sacrum', hint: 'Base of the spine' },

      // Arms
      { id: 'humerus', name: 'Humerus', hint: 'Upper arm bone' },
      { id: 'radius', name: 'Radius', hint: 'Forearm bone (thumb side)' },
      { id: 'ulna', name: 'Ulna', hint: 'Forearm bone (pinky side)' },
      { id: 'carpals', name: 'Carpals', hint: 'Wrist bones (8 bones)' },
      { id: 'metacarpals', name: 'Metacarpals', hint: 'Hand bones (5 bones)' },
      { id: 'phalanges-hand', name: 'Phalanges (Hand)', hint: 'Finger bones (14 per hand)' },

      // Legs
      { id: 'femur', name: 'Femur', hint: 'Thigh bone - longest bone in the body' },
      { id: 'patella', name: 'Patella', hint: 'The kneecap' },
      { id: 'tibia', name: 'Tibia', hint: 'Shinbone (larger lower leg bone)' },
      { id: 'fibula', name: 'Fibula', hint: 'Smaller lower leg bone' },
      { id: 'tarsals', name: 'Tarsals', hint: 'Ankle bones (7 bones)' },
      { id: 'metatarsals', name: 'Metatarsals', hint: 'Foot bones (5 bones)' },
    ],
  },

  muscular: {
    name: 'Muscular System',
    icon: '💪',
    color: '#c0392b',
    parts: [
      // Head & Neck
      { id: 'temporalis', name: 'Temporalis', hint: 'Closes the jaw, temple area' },
      { id: 'masseter', name: 'Masseter', hint: 'Jaw muscle for chewing' },
      { id: 'sternocleidomastoid', name: 'Sternocleidomastoid', hint: 'Rotates and tilts the head' },

      // Shoulders & Chest
      { id: 'trapezius', name: 'Trapezius', hint: 'Large muscle of upper back and neck' },
      { id: 'deltoid', name: 'Deltoid', hint: 'Shoulder muscle, raises arm' },
      { id: 'pectoralis-major', name: 'Pectoralis Major', hint: 'Chest muscle' },
      { id: 'serratus-anterior', name: 'Serratus Anterior', hint: 'Side of ribs, stabilizes scapula' },

      // Arms
      { id: 'biceps-brachii', name: 'Biceps Brachii', hint: 'Flexes the elbow' },
      { id: 'triceps-brachii', name: 'Triceps Brachii', hint: 'Extends the elbow' },
      { id: 'brachioradialis', name: 'Brachioradialis', hint: 'Forearm flexor' },
      { id: 'flexor-carpi', name: 'Flexor Carpi', hint: 'Flexes the wrist' },

      // Core
      { id: 'rectus-abdominis', name: 'Rectus Abdominis', hint: 'The "six-pack" muscle' },
      { id: 'external-oblique', name: 'External Oblique', hint: 'Side abdominal muscle' },
      { id: 'latissimus-dorsi', name: 'Latissimus Dorsi', hint: 'Large back muscle, "lats"' },

      // Hips & Glutes
      { id: 'gluteus-maximus', name: 'Gluteus Maximus', hint: 'Largest muscle, extends hip' },
      { id: 'gluteus-medius', name: 'Gluteus Medius', hint: 'Hip abductor' },
      { id: 'iliopsoas', name: 'Iliopsoas', hint: 'Hip flexor' },

      // Legs
      { id: 'quadriceps', name: 'Quadriceps', hint: 'Front thigh, extends knee' },
      { id: 'hamstrings', name: 'Hamstrings', hint: 'Back thigh, flexes knee' },
      { id: 'adductors', name: 'Adductors', hint: 'Inner thigh muscles' },
      { id: 'sartorius', name: 'Sartorius', hint: 'Longest muscle, crosses leg' },
      { id: 'gastrocnemius', name: 'Gastrocnemius', hint: 'Calf muscle' },
      { id: 'soleus', name: 'Soleus', hint: 'Deep calf muscle' },
      { id: 'tibialis-anterior', name: 'Tibialis Anterior', hint: 'Shin muscle, dorsiflexes foot' },
    ],
  },

  organs: {
    name: 'Internal Organs',
    icon: '🫀',
    color: '#9b59b6',
    parts: [
      // Head
      { id: 'brain', name: 'Brain', hint: 'Control center of the nervous system' },
      { id: 'eyes', name: 'Eyes', hint: 'Organs of vision' },
      { id: 'tongue', name: 'Tongue', hint: 'Taste and speech organ' },

      // Neck & Throat
      { id: 'thyroid', name: 'Thyroid', hint: 'Produces hormones for metabolism' },
      { id: 'larynx', name: 'Larynx', hint: 'Voice box' },
      { id: 'esophagus', name: 'Esophagus', hint: 'Tube connecting mouth to stomach' },
      { id: 'trachea', name: 'Trachea', hint: 'Windpipe' },

      // Chest
      { id: 'heart', name: 'Heart', hint: 'Pumps blood throughout the body' },
      { id: 'lungs', name: 'Lungs', hint: 'Organs of respiration' },
      { id: 'diaphragm', name: 'Diaphragm', hint: 'Muscle for breathing' },

      // Abdomen - Upper
      { id: 'liver', name: 'Liver', hint: 'Largest internal organ, detoxifies blood' },
      { id: 'gallbladder', name: 'Gallbladder', hint: 'Stores bile' },
      { id: 'stomach', name: 'Stomach', hint: 'Digests food with acid' },
      { id: 'spleen', name: 'Spleen', hint: 'Filters blood, immune function' },
      { id: 'pancreas', name: 'Pancreas', hint: 'Produces insulin and digestive enzymes' },

      // Abdomen - Lower
      { id: 'small-intestine', name: 'Small Intestine', hint: 'Absorbs nutrients (about 20 feet long)' },
      { id: 'large-intestine', name: 'Large Intestine', hint: 'Absorbs water, forms waste' },
      { id: 'appendix', name: 'Appendix', hint: 'Small pouch attached to large intestine' },

      // Urinary
      { id: 'kidneys', name: 'Kidneys', hint: 'Filter blood, produce urine' },
      { id: 'bladder', name: 'Bladder', hint: 'Stores urine' },

      // Misc
      { id: 'adrenal-glands', name: 'Adrenal Glands', hint: 'Produce adrenaline and cortisol' },
    ],
  },
};

// Flatten all parts for easy access
export const ALL_PARTS = Object.entries(BODY_SYSTEMS).flatMap(([systemId, system]) =>
  system.parts.map(part => ({ ...part, systemId, systemName: system.name }))
);

// Get parts by system
export function getPartsBySystem(systemId) {
  return BODY_SYSTEMS[systemId]?.parts || [];
}

// Get a random part, optionally filtered by system
export function getRandomPart(systemId = null) {
  const pool = systemId ? getPartsBySystem(systemId) : ALL_PARTS;
  if (pool.length === 0) return null;
  const idx = Math.floor(Math.random() * pool.length);
  const part = pool[idx];

  // Add system info if not already present
  if (systemId && !part.systemId) {
    return { ...part, systemId, systemName: BODY_SYSTEMS[systemId].name };
  }
  return part;
}

// Get system info
export function getSystemInfo(systemId) {
  return BODY_SYSTEMS[systemId] || null;
}

// All system IDs
export const SYSTEM_IDS = Object.keys(BODY_SYSTEMS);
