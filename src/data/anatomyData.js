/**
 * Anatomy Quiz Data
 *
 * Body part definitions organized by system.
 * Now uses SVG paths from anatomySvgPaths.js for accurate anatomical rendering.
 * Hints are location-based to avoid giving away the answer.
 *
 * License: Data compiled for educational purposes.
 */

export const BODY_SYSTEMS = {
  integumentary: {
    name: 'Integumentary System',
    icon: '🧴',
    color: '#deb887',
    parts: [
      // Skin layers
      { id: 'epidermis', name: 'Epidermis', hint: 'The outermost visible layer covering the entire body' },
      { id: 'dermis', name: 'Dermis', hint: 'The layer beneath the surface, throughout the body' },
      { id: 'hypodermis', name: 'Hypodermis', hint: 'The deepest skin layer, also called subcutaneous tissue' },

      // Hair
      { id: 'scalp-hair', name: 'Scalp Hair', hint: 'Located on top of the head' },
      { id: 'eyebrows', name: 'Eyebrows', hint: 'Located above the eyes' },
      { id: 'eyelashes', name: 'Eyelashes', hint: 'Located at the edge of the eyelids' },

      // Nails
      { id: 'fingernails', name: 'Fingernails', hint: 'Located at the tips of the fingers' },
      { id: 'toenails', name: 'Toenails', hint: 'Located at the tips of the toes' },

      // Glands
      { id: 'sweat-glands', name: 'Sweat Glands', hint: 'Found throughout the skin, especially in armpits and palms' },
      { id: 'sebaceous-glands', name: 'Sebaceous Glands', hint: 'Found near hair follicles throughout the body' },

      // Features
      { id: 'lips', name: 'Lips', hint: 'Located on the face, around the mouth opening' },
      { id: 'nipples', name: 'Nipples', hint: 'Located on the chest, one on each side' },
      { id: 'navel', name: 'Navel', hint: 'Located in the center of the abdomen' },
    ],
  },

  skeletal: {
    name: 'Skeletal System',
    icon: '🦴',
    color: '#f5f0e6',
    parts: [
      // Head
      { id: 'skull', name: 'Skull', hint: 'Located at the top of the body, encases the head' },
      { id: 'mandible', name: 'Mandible', hint: 'Located at the lower part of the face' },

      // Spine & Torso
      { id: 'cervical-vertebrae', name: 'Cervical Vertebrae', hint: 'Located in the neck region' },
      { id: 'clavicle', name: 'Clavicle', hint: 'Located horizontally at the top of the chest' },
      { id: 'scapula', name: 'Scapula', hint: 'Located on the upper back, behind the shoulders' },
      { id: 'sternum', name: 'Sternum', hint: 'Located in the center of the chest' },
      { id: 'ribs', name: 'Ribs', hint: 'Located around the chest, forming a cage' },
      { id: 'thoracic-vertebrae', name: 'Thoracic Vertebrae', hint: 'Located in the upper and middle back' },
      { id: 'lumbar-vertebrae', name: 'Lumbar Vertebrae', hint: 'Located in the lower back' },
      { id: 'pelvis', name: 'Pelvis', hint: 'Located at the base of the torso, around the hips' },
      { id: 'sacrum', name: 'Sacrum', hint: 'Located at the base of the spine, above the tailbone' },

      // Arms
      { id: 'humerus', name: 'Humerus', hint: 'Located in the upper arm, between shoulder and elbow' },
      { id: 'radius', name: 'Radius', hint: 'Located in the forearm, on the thumb side' },
      { id: 'ulna', name: 'Ulna', hint: 'Located in the forearm, on the pinky side' },
      { id: 'carpals', name: 'Carpals', hint: 'Located in the wrist area' },
      { id: 'metacarpals', name: 'Metacarpals', hint: 'Located in the palm of the hand' },
      { id: 'phalanges-hand', name: 'Phalanges (Hand)', hint: 'Located in the fingers' },

      // Legs
      { id: 'femur', name: 'Femur', hint: 'Located in the thigh, between hip and knee' },
      { id: 'patella', name: 'Patella', hint: 'Located at the front of the knee' },
      { id: 'tibia', name: 'Tibia', hint: 'Located in the lower leg, on the inner/front side' },
      { id: 'fibula', name: 'Fibula', hint: 'Located in the lower leg, on the outer side' },
      { id: 'tarsals', name: 'Tarsals', hint: 'Located in the ankle and heel area' },
      { id: 'metatarsals', name: 'Metatarsals', hint: 'Located in the middle of the foot' },
    ],
  },

  muscular: {
    name: 'Muscular System',
    icon: '💪',
    color: '#c0392b',
    parts: [
      // Head & Neck
      { id: 'temporalis', name: 'Temporalis', hint: 'Located on the side of the head, near the temple' },
      { id: 'masseter', name: 'Masseter', hint: 'Located at the angle of the jaw' },
      { id: 'sternocleidomastoid', name: 'Sternocleidomastoid', hint: 'Located on the side of the neck' },

      // Shoulders & Chest
      { id: 'trapezius', name: 'Trapezius', hint: 'Located across the upper back and neck' },
      { id: 'deltoid', name: 'Deltoid', hint: 'Located at the top of the shoulder' },
      { id: 'pectoralis-major', name: 'Pectoralis Major', hint: 'Located on the front of the chest' },
      { id: 'serratus-anterior', name: 'Serratus Anterior', hint: 'Located on the side of the chest, over the ribs' },

      // Arms
      { id: 'biceps-brachii', name: 'Biceps Brachii', hint: 'Located on the front of the upper arm' },
      { id: 'triceps-brachii', name: 'Triceps Brachii', hint: 'Located on the back of the upper arm' },
      { id: 'brachioradialis', name: 'Brachioradialis', hint: 'Located on the outer forearm, near the elbow' },
      { id: 'flexor-carpi', name: 'Flexor Carpi', hint: 'Located on the inner forearm' },

      // Core
      { id: 'rectus-abdominis', name: 'Rectus Abdominis', hint: 'Located on the front of the abdomen' },
      { id: 'external-oblique', name: 'External Oblique', hint: 'Located on the sides of the abdomen' },
      { id: 'latissimus-dorsi', name: 'Latissimus Dorsi', hint: 'Located on the sides of the back' },

      // Hips & Glutes
      { id: 'gluteus-maximus', name: 'Gluteus Maximus', hint: 'Located in the buttocks region' },
      { id: 'gluteus-medius', name: 'Gluteus Medius', hint: 'Located on the outer hip' },
      { id: 'iliopsoas', name: 'Iliopsoas', hint: 'Located deep in the front of the hip' },

      // Legs
      { id: 'quadriceps', name: 'Quadriceps', hint: 'Located on the front of the thigh' },
      { id: 'hamstrings', name: 'Hamstrings', hint: 'Located on the back of the thigh' },
      { id: 'adductors', name: 'Adductors', hint: 'Located on the inner thigh' },
      { id: 'sartorius', name: 'Sartorius', hint: 'Located diagonally across the front of the thigh' },
      { id: 'gastrocnemius', name: 'Gastrocnemius', hint: 'Located on the back of the lower leg' },
      { id: 'soleus', name: 'Soleus', hint: 'Located beneath the calf, in the lower leg' },
      { id: 'tibialis-anterior', name: 'Tibialis Anterior', hint: 'Located on the front of the lower leg' },
    ],
  },

  organs: {
    name: 'Internal Organs',
    icon: '🫀',
    color: '#9b59b6',
    parts: [
      // Head
      { id: 'brain', name: 'Brain', hint: 'Located inside the skull' },
      { id: 'eyes', name: 'Eyes', hint: 'Located in the front of the face, in the eye sockets' },
      { id: 'tongue', name: 'Tongue', hint: 'Located inside the mouth' },

      // Neck & Throat
      { id: 'thyroid', name: 'Thyroid', hint: 'Located in the front of the neck, below the Adam\'s apple' },
      { id: 'larynx', name: 'Larynx', hint: 'Located in the throat, at the top of the windpipe' },
      { id: 'esophagus', name: 'Esophagus', hint: 'Located in the neck and chest, behind the windpipe' },
      { id: 'trachea', name: 'Trachea', hint: 'Located in the front of the neck, going down to the lungs' },

      // Chest
      { id: 'heart', name: 'Heart', hint: 'Located in the center-left of the chest' },
      { id: 'lungs', name: 'Lungs', hint: 'Located in the chest, on either side of the heart' },
      { id: 'diaphragm', name: 'Diaphragm', hint: 'Located horizontally below the lungs' },

      // Abdomen - Upper
      { id: 'liver', name: 'Liver', hint: 'Located in the upper right abdomen' },
      { id: 'gallbladder', name: 'Gallbladder', hint: 'Located beneath the liver' },
      { id: 'stomach', name: 'Stomach', hint: 'Located in the upper left abdomen' },
      { id: 'spleen', name: 'Spleen', hint: 'Located in the upper left abdomen, behind the stomach' },
      { id: 'pancreas', name: 'Pancreas', hint: 'Located behind the stomach, horizontally across' },

      // Abdomen - Lower
      { id: 'small-intestine', name: 'Small Intestine', hint: 'Located in the central abdomen, coiled' },
      { id: 'large-intestine', name: 'Large Intestine', hint: 'Located around the edges of the abdomen' },
      { id: 'appendix', name: 'Appendix', hint: 'Located in the lower right abdomen' },

      // Urinary
      { id: 'kidneys', name: 'Kidneys', hint: 'Located in the back of the abdomen, one on each side' },
      { id: 'bladder', name: 'Bladder', hint: 'Located in the lower abdomen, in the pelvic area' },

      // Misc
      { id: 'adrenal-glands', name: 'Adrenal Glands', hint: 'Located on top of each kidney' },
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
