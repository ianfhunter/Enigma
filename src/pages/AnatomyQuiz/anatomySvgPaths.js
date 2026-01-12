/**
 * Anatomically Accurate SVG Paths
 *
 * Detailed SVG path data for human anatomy visualization.
 * All paths are designed for a 300x540 viewBox.
 *
 * License: Original artwork created for educational purposes.
 */

// ============================================================================
// SKELETAL SYSTEM - Accurate bone shapes
// ============================================================================

export const SKELETAL_PATHS = {
  // HEAD
  skull: {
    id: 'skull',
    name: 'Skull',
    hint: 'Protects the brain',
    path: `M 150 10
           C 115 10, 105 35, 105 55
           C 105 70, 110 85, 120 90
           L 125 90
           C 130 88, 135 85, 140 85
           L 160 85
           C 165 85, 170 88, 175 90
           L 180 90
           C 190 85, 195 70, 195 55
           C 195 35, 185 10, 150 10 Z`,
    fill: '#f5f0e6',
  },
  mandible: {
    id: 'mandible',
    name: 'Mandible',
    hint: 'The jawbone',
    path: `M 125 88
           C 120 92, 118 98, 125 105
           L 135 108
           C 145 110, 155 110, 165 108
           L 175 105
           C 182 98, 180 92, 175 88
           L 165 90
           C 155 92, 145 92, 135 90
           Z`,
    fill: '#f5f0e6',
  },

  // SPINE
  'cervical-vertebrae': {
    id: 'cervical-vertebrae',
    name: 'Cervical Vertebrae',
    hint: 'Neck bones (7 vertebrae)',
    path: `M 145 98 L 155 98 L 156 108 L 155 118 L 145 118 L 144 108 Z
           M 143 102 L 140 104 L 140 106 L 143 108 Z
           M 157 102 L 160 104 L 160 106 L 157 108 Z
           M 143 112 L 140 114 L 140 116 L 143 118 Z
           M 157 112 L 160 114 L 160 116 L 157 118 Z`,
    fill: '#f5f0e6',
  },
  'thoracic-vertebrae': {
    id: 'thoracic-vertebrae',
    name: 'Thoracic Vertebrae',
    hint: 'Upper back (12 vertebrae)',
    path: `M 145 130 L 155 130 L 156 200 L 145 200 Z
           M 142 135 L 138 137 L 138 140 L 142 142 Z
           M 158 135 L 162 137 L 162 140 L 158 142 Z
           M 142 150 L 138 152 L 138 155 L 142 157 Z
           M 158 150 L 162 152 L 162 155 L 158 157 Z
           M 142 165 L 138 167 L 138 170 L 142 172 Z
           M 158 165 L 162 167 L 162 170 L 158 172 Z
           M 142 180 L 138 182 L 138 185 L 142 187 Z
           M 158 180 L 162 182 L 162 185 L 158 187 Z`,
    fill: '#f5f0e6',
  },
  'lumbar-vertebrae': {
    id: 'lumbar-vertebrae',
    name: 'Lumbar Vertebrae',
    hint: 'Lower back (5 vertebrae)',
    path: `M 143 205 L 157 205 L 159 260 L 141 260 Z
           M 140 210 L 135 213 L 135 218 L 140 221 Z
           M 160 210 L 165 213 L 165 218 L 160 221 Z
           M 139 230 L 133 233 L 133 238 L 139 241 Z
           M 161 230 L 167 233 L 167 238 L 161 241 Z
           M 138 250 L 132 253 L 132 258 L 138 261 Z
           M 162 250 L 168 253 L 168 258 L 162 261 Z`,
    fill: '#f5f0e6',
  },
  sacrum: {
    id: 'sacrum',
    name: 'Sacrum',
    hint: 'Base of the spine',
    path: `M 140 265 L 160 265 L 158 295 C 155 300, 145 300, 142 295 Z`,
    fill: '#f5f0e6',
  },

  // CHEST
  clavicle: {
    id: 'clavicle',
    name: 'Clavicle',
    hint: 'The collarbone',
    path: `M 95 123 C 110 118, 130 120, 150 122 C 170 120, 190 118, 205 123
           L 205 127 C 190 124, 170 126, 150 128 C 130 126, 110 124, 95 127 Z`,
    fill: '#f5f0e6',
  },
  scapula: {
    id: 'scapula',
    name: 'Scapula',
    hint: 'The shoulder blade',
    path: `M 100 135 L 90 145 L 88 175 L 100 195 L 115 185 L 112 150 Z
           M 200 135 L 210 145 L 212 175 L 200 195 L 185 185 L 188 150 Z`,
    fill: '#f5f0e6',
  },
  sternum: {
    id: 'sternum',
    name: 'Sternum',
    hint: 'The breastbone',
    path: `M 145 128 L 155 128 L 157 138 L 158 195 L 155 210 L 150 215 L 145 210 L 142 195 L 143 138 Z`,
    fill: '#f5f0e6',
  },
  ribs: {
    id: 'ribs',
    name: 'Ribs',
    hint: 'Protect heart and lungs (12 pairs)',
    path: `
      M 140 135 Q 115 140, 100 160 Q 95 175, 100 185 L 102 183 Q 98 172, 102 160 Q 117 143, 140 138 Z
      M 160 135 Q 185 140, 200 160 Q 205 175, 200 185 L 198 183 Q 202 172, 198 160 Q 183 143, 160 138 Z
      M 140 145 Q 110 150, 95 175 Q 90 192, 95 205 L 97 203 Q 93 190, 98 175 Q 112 152, 140 148 Z
      M 160 145 Q 190 150, 205 175 Q 210 192, 205 205 L 203 203 Q 207 190, 202 175 Q 188 152, 160 148 Z
      M 140 158 Q 108 165, 92 195 Q 88 210, 95 225 L 97 223 Q 91 208, 95 195 Q 110 168, 140 161 Z
      M 160 158 Q 192 165, 208 195 Q 212 210, 205 225 L 203 223 Q 209 208, 205 195 Q 190 168, 160 161 Z
      M 140 170 Q 105 178, 90 210 Q 87 228, 100 245 L 102 243 Q 90 226, 93 210 Q 108 180, 140 173 Z
      M 160 170 Q 195 178, 210 210 Q 213 228, 200 245 L 198 243 Q 210 226, 207 210 Q 192 180, 160 173 Z
      M 140 182 Q 108 190, 95 225 Q 93 242, 105 258 L 107 256 Q 96 240, 98 225 Q 110 192, 140 185 Z
      M 160 182 Q 192 190, 205 225 Q 207 242, 195 258 L 193 256 Q 204 240, 202 225 Q 190 192, 160 185 Z
    `,
    fill: '#f5f0e6',
  },
  pelvis: {
    id: 'pelvis',
    name: 'Pelvis',
    hint: 'Hip bones, supports upper body',
    path: `M 140 268
           C 110 272, 90 290, 88 315
           C 87 325, 95 335, 110 335
           L 115 325 L 120 318
           L 140 315
           L 150 316
           L 160 315
           L 180 318 L 185 325
           L 190 335
           C 205 335, 213 325, 212 315
           C 210 290, 190 272, 160 268
           L 155 270 L 150 268 L 145 270 Z`,
    fill: '#f5f0e6',
  },

  // ARM BONES (both left and right included in paths)
  humerus: {
    id: 'humerus',
    name: 'Humerus',
    hint: 'Upper arm bone',
    path: `M 88 132
           C 80 135, 75 145, 72 160
           L 65 200 L 60 235
           C 58 242, 62 248, 68 248
           C 74 248, 78 242, 76 235
           L 80 200 L 86 160
           C 88 145, 92 138, 95 135
           Z
           M 212 132
           C 220 135, 225 145, 228 160
           L 235 200 L 240 235
           C 242 242, 238 248, 232 248
           C 226 248, 222 242, 224 235
           L 220 200 L 214 160
           C 212 145, 208 138, 205 135
           Z`,
    fill: '#f5f0e6',
  },
  radius: {
    id: 'radius',
    name: 'Radius',
    hint: 'Forearm bone (thumb side)',
    path: `M 62 252
           L 50 290 L 42 325
           C 40 332, 44 338, 50 338
           L 56 335
           L 60 325 L 70 290 L 74 255
           Z
           M 238 252
           L 250 290 L 258 325
           C 260 332, 256 338, 250 338
           L 244 335
           L 240 325 L 230 290 L 226 255
           Z`,
    fill: '#f5f0e6',
  },
  ulna: {
    id: 'ulna',
    name: 'Ulna',
    hint: 'Forearm bone (pinky side)',
    path: `M 70 250
           C 72 248, 75 248, 77 250
           L 72 290 L 65 330
           C 62 338, 55 342, 52 340
           L 50 335
           L 58 290 L 65 255
           Z
           M 230 250
           C 228 248, 225 248, 223 250
           L 228 290 L 235 330
           C 238 338, 245 342, 248 340
           L 250 335
           L 242 290 L 235 255
           Z`,
    fill: '#f5f0e6',
  },
  carpals: {
    id: 'carpals',
    name: 'Carpals',
    hint: 'Wrist bones (8 bones)',
    path: `M 40 338
           C 38 340, 36 345, 38 352
           L 55 355
           C 60 350, 58 342, 55 338
           Z
           M 260 338
           C 262 340, 264 345, 262 352
           L 245 355
           C 240 350, 242 342, 245 338
           Z`,
    fill: '#f5f0e6',
  },
  metacarpals: {
    id: 'metacarpals',
    name: 'Metacarpals',
    hint: 'Hand bones (5 bones)',
    path: `M 38 354 L 32 368 L 36 370 L 42 357 Z
           M 42 355 L 38 372 L 42 374 L 47 358 Z
           M 47 356 L 44 376 L 48 378 L 52 358 Z
           M 52 356 L 50 376 L 54 378 L 56 358 Z
           M 55 354 L 58 368 L 54 370 L 52 356 Z
           M 262 354 L 268 368 L 264 370 L 258 357 Z
           M 258 355 L 262 372 L 258 374 L 253 358 Z
           M 253 356 L 256 376 L 252 378 L 248 358 Z
           M 248 356 L 250 376 L 246 378 L 244 358 Z
           M 245 354 L 242 368 L 246 370 L 248 356 Z`,
    fill: '#f5f0e6',
  },
  'phalanges-hand': {
    id: 'phalanges-hand',
    name: 'Phalanges (Hand)',
    hint: 'Finger bones (14 per hand)',
    path: `M 32 372 L 28 388 L 32 390 L 36 374 Z
           M 38 376 L 35 395 L 39 397 L 42 378 Z
           M 44 380 L 42 402 L 46 404 L 48 382 Z
           M 50 380 L 50 400 L 54 402 L 54 382 Z
           M 58 372 L 62 385 L 58 387 L 55 374 Z
           M 268 372 L 272 388 L 268 390 L 264 374 Z
           M 262 376 L 265 395 L 261 397 L 258 378 Z
           M 256 380 L 258 402 L 254 404 L 252 382 Z
           M 250 380 L 250 400 L 246 402 L 246 382 Z
           M 242 372 L 238 385 L 242 387 L 245 374 Z`,
    fill: '#f5f0e6',
  },

  // LEG BONES
  femur: {
    id: 'femur',
    name: 'Femur',
    hint: 'Thigh bone - longest bone in the body',
    path: `M 118 335
           C 112 342, 112 350, 115 365
           L 118 400 L 120 435
           C 118 445, 125 450, 132 448
           C 140 446, 142 438, 140 430
           L 138 400 L 135 365
           C 138 350, 138 340, 132 335
           Z
           M 182 335
           C 188 342, 188 350, 185 365
           L 182 400 L 180 435
           C 182 445, 175 450, 168 448
           C 160 446, 158 438, 160 430
           L 162 400 L 165 365
           C 162 350, 162 340, 168 335
           Z`,
    fill: '#f5f0e6',
  },
  patella: {
    id: 'patella',
    name: 'Patella',
    hint: 'The kneecap',
    path: `M 122 445
           C 118 448, 118 458, 122 462
           C 126 466, 134 466, 138 462
           C 142 458, 142 448, 138 445
           C 134 442, 126 442, 122 445
           Z
           M 162 445
           C 158 448, 158 458, 162 462
           C 166 466, 174 466, 178 462
           C 182 458, 182 448, 178 445
           C 174 442, 166 442, 162 445
           Z`,
    fill: '#f5f0e6',
  },
  tibia: {
    id: 'tibia',
    name: 'Tibia',
    hint: 'Shinbone (larger lower leg bone)',
    path: `M 125 465
           L 122 490 L 120 515
           C 118 522, 125 528, 135 526
           L 138 520 L 140 490 L 138 468
           Z
           M 175 465
           L 178 490 L 180 515
           C 182 522, 175 528, 165 526
           L 162 520 L 160 490 L 162 468
           Z`,
    fill: '#f5f0e6',
  },
  fibula: {
    id: 'fibula',
    name: 'Fibula',
    hint: 'Smaller lower leg bone',
    path: `M 115 468
           L 110 490 L 108 510
           C 106 516, 110 520, 116 518
           L 118 510 L 120 490 L 120 470
           Z
           M 185 468
           L 190 490 L 192 510
           C 194 516, 190 520, 184 518
           L 182 510 L 180 490 L 180 470
           Z`,
    fill: '#f5f0e6',
  },
  tarsals: {
    id: 'tarsals',
    name: 'Tarsals',
    hint: 'Ankle bones (7 bones)',
    path: `M 108 522 L 138 524 L 140 532 L 106 530 Z
           M 162 524 L 192 522 L 194 530 L 160 532 Z`,
    fill: '#f5f0e6',
  },
  metatarsals: {
    id: 'metatarsals',
    name: 'Metatarsals',
    hint: 'Foot bones (5 bones)',
    path: `M 105 532 L 98 538 L 140 538 L 140 534 Z
           M 160 534 L 160 538 L 202 538 L 195 532 Z`,
    fill: '#f5f0e6',
  },
};

// ============================================================================
// MUSCULAR SYSTEM - Accurate muscle shapes
// ============================================================================

export const MUSCULAR_PATHS = {
  // HEAD & NECK MUSCLES
  temporalis: {
    id: 'temporalis',
    name: 'Temporalis',
    hint: 'Closes the jaw, temple area',
    path: `M 120 25 C 115 30, 112 45, 115 55 L 125 50 C 128 40, 128 30, 125 25 Z
           M 180 25 C 185 30, 188 45, 185 55 L 175 50 C 172 40, 172 30, 175 25 Z`,
    fill: '#c0392b',
  },
  masseter: {
    id: 'masseter',
    name: 'Masseter',
    hint: 'Jaw muscle for chewing',
    path: `M 115 65 L 110 85 L 118 95 L 128 90 L 125 70 Z
           M 185 65 L 190 85 L 182 95 L 172 90 L 175 70 Z`,
    fill: '#c0392b',
  },
  sternocleidomastoid: {
    id: 'sternocleidomastoid',
    name: 'Sternocleidomastoid',
    hint: 'Rotates and tilts the head',
    path: `M 130 90 C 125 100, 130 115, 142 125 L 148 122 L 148 118 C 140 110, 138 98, 140 92 Z
           M 170 90 C 175 100, 170 115, 158 125 L 152 122 L 152 118 C 160 110, 162 98, 160 92 Z`,
    fill: '#c0392b',
  },

  // SHOULDER & CHEST MUSCLES
  trapezius: {
    id: 'trapezius',
    name: 'Trapezius',
    hint: 'Large muscle of upper back and neck',
    path: `M 150 95
           C 140 100, 125 110, 100 130
           L 95 140 L 105 145
           C 125 130, 140 118, 150 115
           C 160 118, 175 130, 195 145
           L 205 140 L 200 130
           C 175 110, 160 100, 150 95 Z`,
    fill: '#c0392b',
  },
  deltoid: {
    id: 'deltoid',
    name: 'Deltoid',
    hint: 'Shoulder muscle, raises arm',
    path: `M 95 128
           C 85 132, 75 145, 72 165
           L 80 170
           C 82 155, 88 145, 95 140
           L 105 135 Z
           M 205 128
           C 215 132, 225 145, 228 165
           L 220 170
           C 218 155, 212 145, 205 140
           L 195 135 Z`,
    fill: '#c0392b',
  },
  'pectoralis-major': {
    id: 'pectoralis-major',
    name: 'Pectoralis Major',
    hint: 'Chest muscle',
    path: `M 105 140
           C 115 145, 130 150, 148 152
           L 148 195
           C 130 192, 110 180, 98 165
           L 95 150 Z
           M 195 140
           C 185 145, 170 150, 152 152
           L 152 195
           C 170 192, 190 180, 202 165
           L 205 150 Z`,
    fill: '#c0392b',
  },
  'serratus-anterior': {
    id: 'serratus-anterior',
    name: 'Serratus Anterior',
    hint: 'Side of ribs, stabilizes scapula',
    path: `M 100 170 L 95 180 L 98 182 L 103 172 Z
           M 100 180 L 95 192 L 98 194 L 103 182 Z
           M 100 192 L 95 205 L 98 207 L 103 195 Z
           M 100 205 L 95 218 L 98 220 L 103 208 Z
           M 200 170 L 205 180 L 202 182 L 197 172 Z
           M 200 180 L 205 192 L 202 194 L 197 182 Z
           M 200 192 L 205 205 L 202 207 L 197 195 Z
           M 200 205 L 205 218 L 202 220 L 197 208 Z`,
    fill: '#c0392b',
  },

  // ARM MUSCLES (both left and right)
  'biceps-brachii': {
    id: 'biceps-brachii',
    name: 'Biceps Brachii',
    hint: 'Flexes the elbow',
    path: `M 78 165
           C 70 175, 68 195, 70 215
           L 78 218
           C 80 200, 82 180, 85 170 Z
           M 222 165
           C 230 175, 232 195, 230 215
           L 222 218
           C 220 200, 218 180, 215 170 Z`,
    fill: '#c0392b',
  },
  'triceps-brachii': {
    id: 'triceps-brachii',
    name: 'Triceps Brachii',
    hint: 'Extends the elbow',
    path: `M 82 165
           C 88 175, 90 195, 88 220
           L 80 222
           C 78 200, 76 180, 78 168 Z
           M 218 165
           C 212 175, 210 195, 212 220
           L 220 222
           C 222 200, 224 180, 222 168 Z`,
    fill: '#c0392b',
  },
  brachioradialis: {
    id: 'brachioradialis',
    name: 'Brachioradialis',
    hint: 'Forearm flexor',
    path: `M 70 225
           C 65 240, 60 260, 58 280
           L 65 282
           C 68 265, 72 245, 76 230 Z
           M 230 225
           C 235 240, 240 260, 242 280
           L 235 282
           C 232 265, 228 245, 224 230 Z`,
    fill: '#c0392b',
  },
  'flexor-carpi': {
    id: 'flexor-carpi',
    name: 'Flexor Carpi',
    hint: 'Flexes the wrist',
    path: `M 62 250
           C 58 270, 52 295, 48 320
           L 55 322
           C 60 300, 65 275, 68 255 Z
           M 238 250
           C 242 270, 248 295, 252 320
           L 245 322
           C 240 300, 235 275, 232 255 Z`,
    fill: '#c0392b',
  },

  // CORE MUSCLES
  'rectus-abdominis': {
    id: 'rectus-abdominis',
    name: 'Rectus Abdominis',
    hint: 'The "six-pack" muscle',
    path: `M 140 200 L 160 200
           L 162 220 L 160 220 L 160 230 L 162 230
           L 162 250 L 160 250 L 160 260 L 162 260
           L 162 280 L 160 280 L 160 295 L 155 300
           L 145 300 L 140 295 L 140 280 L 138 280
           L 138 260 L 140 260 L 140 250 L 138 250
           L 138 230 L 140 230 L 140 220 L 138 220 Z`,
    fill: '#c0392b',
  },
  'external-oblique': {
    id: 'external-oblique',
    name: 'External Oblique',
    hint: 'Side abdominal muscle',
    path: `M 105 220 L 138 230 L 138 280 L 120 300 L 110 295 L 100 260 Z
           M 195 220 L 162 230 L 162 280 L 180 300 L 190 295 L 200 260 Z`,
    fill: '#c0392b',
  },
  'latissimus-dorsi': {
    id: 'latissimus-dorsi',
    name: 'Latissimus Dorsi',
    hint: 'Large back muscle, "lats"',
    path: `M 100 165
           C 95 180, 92 210, 98 240
           L 110 245 L 120 235
           C 115 210, 108 185, 108 170 Z
           M 200 165
           C 205 180, 208 210, 202 240
           L 190 245 L 180 235
           C 185 210, 192 185, 192 170 Z`,
    fill: '#c0392b',
  },

  // HIP & GLUTE MUSCLES
  'gluteus-maximus': {
    id: 'gluteus-maximus',
    name: 'Gluteus Maximus',
    hint: 'Largest muscle, extends hip',
    path: `M 115 295
           C 100 305, 95 325, 105 345
           L 130 350 L 150 340
           C 145 320, 135 305, 125 298 Z
           M 185 295
           C 200 305, 205 325, 195 345
           L 170 350 L 150 340
           C 155 320, 165 305, 175 298 Z`,
    fill: '#c0392b',
  },
  'gluteus-medius': {
    id: 'gluteus-medius',
    name: 'Gluteus Medius',
    hint: 'Hip abductor',
    path: `M 105 280 L 95 295 L 105 315 L 120 310 L 118 290 Z
           M 195 280 L 205 295 L 195 315 L 180 310 L 182 290 Z`,
    fill: '#c0392b',
  },
  iliopsoas: {
    id: 'iliopsoas',
    name: 'Iliopsoas',
    hint: 'Hip flexor',
    path: `M 130 275 L 125 295 L 130 320 L 140 318 L 142 290 Z
           M 170 275 L 175 295 L 170 320 L 160 318 L 158 290 Z`,
    fill: '#c0392b',
  },

  // LEG MUSCLES
  quadriceps: {
    id: 'quadriceps',
    name: 'Quadriceps',
    hint: 'Front thigh, extends knee',
    path: `M 118 340
           C 112 360, 112 400, 120 440
           L 140 445
           C 138 405, 135 365, 138 348 Z
           M 182 340
           C 188 360, 188 400, 180 440
           L 160 445
           C 162 405, 165 365, 162 348 Z`,
    fill: '#c0392b',
  },
  hamstrings: {
    id: 'hamstrings',
    name: 'Hamstrings',
    hint: 'Back thigh, flexes knee',
    path: `M 125 345
           C 118 365, 115 400, 118 438
           L 108 440
           C 102 400, 105 360, 115 342 Z
           M 175 345
           C 182 365, 185 400, 182 438
           L 192 440
           C 198 400, 195 360, 185 342 Z`,
    fill: '#c0392b',
  },
  adductors: {
    id: 'adductors',
    name: 'Adductors',
    hint: 'Inner thigh muscles',
    path: `M 140 340 L 138 380 L 145 420 L 150 380 L 148 340 Z
           M 160 340 L 162 380 L 155 420 L 150 380 L 152 340 Z`,
    fill: '#c0392b',
  },
  sartorius: {
    id: 'sartorius',
    name: 'Sartorius',
    hint: 'Longest muscle, crosses leg',
    path: `M 118 335 L 115 340 L 128 420 L 140 450 L 145 448 L 135 420 L 125 345 Z
           M 182 335 L 185 340 L 172 420 L 160 450 L 155 448 L 165 420 L 175 345 Z`,
    fill: '#c0392b',
  },
  gastrocnemius: {
    id: 'gastrocnemius',
    name: 'Gastrocnemius',
    hint: 'Calf muscle',
    path: `M 115 455
           C 110 475, 112 495, 118 515
           L 135 518
           C 132 500, 128 480, 130 460 Z
           M 185 455
           C 190 475, 188 495, 182 515
           L 165 518
           C 168 500, 172 480, 170 460 Z`,
    fill: '#c0392b',
  },
  soleus: {
    id: 'soleus',
    name: 'Soleus',
    hint: 'Deep calf muscle',
    path: `M 118 480 L 115 505 L 120 520 L 130 518 L 128 500 L 125 482 Z
           M 182 480 L 185 505 L 180 520 L 170 518 L 172 500 L 175 482 Z`,
    fill: '#c0392b',
  },
  'tibialis-anterior': {
    id: 'tibialis-anterior',
    name: 'Tibialis Anterior',
    hint: 'Shin muscle, dorsiflexes foot',
    path: `M 130 458 L 128 480 L 130 510 L 138 515 L 140 485 L 138 460 Z
           M 170 458 L 172 480 L 170 510 L 162 515 L 160 485 L 162 460 Z`,
    fill: '#c0392b',
  },
};

// ============================================================================
// INTERNAL ORGANS - Accurate organ shapes
// ============================================================================

export const ORGAN_PATHS = {
  // HEAD ORGANS
  brain: {
    id: 'brain',
    name: 'Brain',
    hint: 'Control center of the nervous system',
    path: `M 150 18
           C 120 18, 110 30, 110 45
           C 110 55, 112 60, 115 62
           C 112 65, 110 70, 115 75
           C 115 80, 120 82, 125 80
           C 130 85, 140 88, 150 88
           C 160 88, 170 85, 175 80
           C 180 82, 185 80, 185 75
           C 190 70, 188 65, 185 62
           C 188 60, 190 55, 190 45
           C 190 30, 180 18, 150 18 Z
           M 150 25 C 145 30, 145 40, 150 45 C 155 40, 155 30, 150 25 Z`,
    fill: '#ffb6c1',
  },
  eyes: {
    id: 'eyes',
    name: 'Eyes',
    hint: 'Organs of vision',
    path: `M 130 52 C 125 48, 122 52, 125 58 C 128 62, 135 62, 138 58 C 141 52, 135 48, 130 52 Z
           M 133 55 A 3 3 0 1 1 133.01 55 Z
           M 170 52 C 175 48, 178 52, 175 58 C 172 62, 165 62, 162 58 C 159 52, 165 48, 170 52 Z
           M 167 55 A 3 3 0 1 1 167.01 55 Z`,
    fill: '#fff',
  },
  tongue: {
    id: 'tongue',
    name: 'Tongue',
    hint: 'Taste and speech organ',
    path: `M 140 78 C 135 82, 138 90, 150 92 C 162 90, 165 82, 160 78 Z`,
    fill: '#ff6b6b',
  },

  // NECK & THROAT ORGANS
  thyroid: {
    id: 'thyroid',
    name: 'Thyroid',
    hint: 'Produces hormones for metabolism',
    path: `M 140 108
           C 135 105, 130 108, 130 115
           C 130 120, 140 125, 150 125
           C 160 125, 170 120, 170 115
           C 170 108, 165 105, 160 108
           C 155 110, 145 110, 140 108 Z`,
    fill: '#e74c3c',
  },
  larynx: {
    id: 'larynx',
    name: 'Larynx',
    hint: 'Voice box',
    path: `M 143 96 L 150 92 L 157 96 L 157 105 L 150 110 L 143 105 Z`,
    fill: '#f39c12',
  },
  esophagus: {
    id: 'esophagus',
    name: 'Esophagus',
    hint: 'Tube connecting mouth to stomach',
    path: `M 147 110 L 153 110 L 155 200 L 158 230 L 152 235 L 148 235 L 145 230 L 147 200 Z`,
    fill: '#e67e22',
  },
  trachea: {
    id: 'trachea',
    name: 'Trachea',
    hint: 'Windpipe',
    path: `M 145 108 L 155 108 L 155 160 L 145 160 Z
           M 145 115 L 155 115 L 155 118 L 145 118 Z
           M 145 125 L 155 125 L 155 128 L 145 128 Z
           M 145 135 L 155 135 L 155 138 L 145 138 Z
           M 145 145 L 155 145 L 155 148 L 145 148 Z
           M 145 155 L 155 155 L 155 158 L 145 158 Z`,
    fill: '#3498db',
  },

  // CHEST ORGANS
  heart: {
    id: 'heart',
    name: 'Heart',
    hint: 'Pumps blood throughout the body',
    path: `M 155 165
           C 155 155, 165 152, 172 158
           C 180 165, 180 178, 172 190
           L 155 210
           L 138 190
           C 130 178, 130 165, 138 158
           C 145 152, 155 155, 155 165 Z`,
    fill: '#c0392b',
  },
  lungs: {
    id: 'lungs',
    name: 'Lungs',
    hint: 'Organs of respiration',
    path: `M 115 148
           C 100 155, 95 175, 98 200
           C 100 215, 110 225, 125 225
           L 140 220 L 140 160
           C 135 155, 125 150, 115 148 Z
           M 185 148
           C 200 155, 205 175, 202 200
           C 200 215, 190 225, 175 225
           L 160 220 L 160 160
           C 165 155, 175 150, 185 148 Z`,
    fill: '#ffb6c1',
  },
  diaphragm: {
    id: 'diaphragm',
    name: 'Diaphragm',
    hint: 'Muscle for breathing',
    path: `M 98 220
           C 110 210, 130 205, 150 208
           C 170 205, 190 210, 202 220
           L 200 228
           C 188 220, 170 215, 150 218
           C 130 215, 112 220, 100 228 Z`,
    fill: '#e74c3c',
  },

  // ABDOMINAL ORGANS - UPPER
  liver: {
    id: 'liver',
    name: 'Liver',
    hint: 'Largest internal organ, detoxifies blood',
    path: `M 105 225
           C 100 230, 98 250, 105 265
           L 120 270 L 155 268
           C 160 260, 155 240, 145 230
           L 130 225 Z`,
    fill: '#8b4513',
  },
  gallbladder: {
    id: 'gallbladder',
    name: 'Gallbladder',
    hint: 'Stores bile',
    path: `M 135 255 C 130 258, 128 268, 135 275 L 145 270 L 142 258 Z`,
    fill: '#27ae60',
  },
  stomach: {
    id: 'stomach',
    name: 'Stomach',
    hint: 'Digests food with acid',
    path: `M 155 230
           C 170 232, 190 245, 188 268
           C 186 285, 170 295, 155 290
           C 145 288, 140 275, 145 260
           C 148 248, 150 235, 155 230 Z`,
    fill: '#f39c12',
  },
  spleen: {
    id: 'spleen',
    name: 'Spleen',
    hint: 'Filters blood, immune function',
    path: `M 195 232
           C 205 235, 210 250, 205 265
           C 200 275, 188 278, 185 270
           C 182 262, 188 248, 195 232 Z`,
    fill: '#9b59b6',
  },
  pancreas: {
    id: 'pancreas',
    name: 'Pancreas',
    hint: 'Produces insulin and digestive enzymes',
    path: `M 130 262
           C 125 265, 120 272, 128 278
           L 160 282 L 185 275
           C 190 270, 185 265, 175 268
           L 145 270 L 135 265 Z`,
    fill: '#f1c40f',
  },

  // ABDOMINAL ORGANS - LOWER
  'small-intestine': {
    id: 'small-intestine',
    name: 'Small Intestine',
    hint: 'Absorbs nutrients (about 20 feet long)',
    path: `M 125 285
           C 120 290, 118 298, 125 305
           C 132 310, 145 308, 150 300
           C 155 308, 168 310, 175 305
           C 182 298, 180 290, 175 285
           C 170 282, 160 285, 155 290
           C 150 285, 140 282, 130 285
           L 125 285 Z
           M 128 305 C 135 315, 165 315, 172 305
           C 168 318, 145 322, 132 318 Z`,
    fill: '#e67e22',
  },
  'large-intestine': {
    id: 'large-intestine',
    name: 'Large Intestine',
    hint: 'Absorbs water, forms waste',
    path: `M 108 270
           L 105 315 L 112 340 L 125 342
           L 140 338 L 155 342 L 175 340
           L 188 342 L 195 315 L 192 270
           L 185 268 L 185 310 L 180 335
           L 165 332 L 150 335 L 135 332
           L 120 335 L 115 310 L 115 268 Z`,
    fill: '#16a085',
  },
  appendix: {
    id: 'appendix',
    name: 'Appendix',
    hint: 'Small pouch attached to large intestine',
    path: `M 185 335 C 190 338, 198 350, 195 358 C 190 365, 182 360, 185 352 C 188 345, 182 340, 180 338 Z`,
    fill: '#e74c3c',
  },

  // URINARY ORGANS
  kidneys: {
    id: 'kidneys',
    name: 'Kidneys',
    hint: 'Filter blood, produce urine',
    path: `M 108 248
           C 100 252, 98 268, 105 280
           C 110 288, 120 285, 122 275
           C 124 265, 118 255, 108 248 Z
           M 192 248
           C 200 252, 202 268, 195 280
           C 190 288, 180 285, 178 275
           C 176 265, 182 255, 192 248 Z`,
    fill: '#c0392b',
  },
  bladder: {
    id: 'bladder',
    name: 'Bladder',
    hint: 'Stores urine',
    path: `M 140 330
           C 130 335, 128 350, 140 360
           C 145 365, 155 365, 160 360
           C 172 350, 170 335, 160 330
           C 155 328, 145 328, 140 330 Z`,
    fill: '#f1c40f',
  },

  // MISC ORGANS
  'adrenal-glands': {
    id: 'adrenal-glands',
    name: 'Adrenal Glands',
    hint: 'Produce adrenaline and cortisol',
    path: `M 105 245 L 100 252 L 108 258 L 115 250 Z
           M 195 245 L 200 252 L 192 258 L 185 250 Z`,
    fill: '#f39c12',
  },
};

// ============================================================================
// BODY OUTLINE - More detailed and accurate
// ============================================================================

export const BODY_OUTLINE_PATH = `
  /* Head */
  M 150 12
  C 115 12, 105 40, 105 60
  C 105 75, 115 90, 125 95
  L 125 105

  /* Neck */
  L 135 105
  L 133 118

  /* Left shoulder & arm */
  L 100 125
  C 80 130, 65 150, 60 175
  L 50 220
  C 45 245, 40 280, 35 320
  L 30 355
  C 28 365, 35 375, 45 378
  L 58 378
  C 62 375, 60 365, 58 355
  L 62 320
  L 72 280
  L 80 240
  L 92 200
  L 98 170

  /* Left torso */
  L 98 165
  L 95 200
  L 95 255
  L 102 295
  L 110 330

  /* Left leg */
  L 108 360
  L 105 420
  L 100 480
  L 98 520
  L 95 535
  L 140 535
  L 142 520
  L 145 480
  L 148 420
  L 150 360
  L 150 330

  /* Right leg */
  L 152 360
  L 155 420
  L 158 480
  L 160 520
  L 165 535
  L 205 535
  L 202 520
  L 200 480
  L 195 420
  L 192 360
  L 190 330

  /* Right torso */
  L 198 295
  L 205 255
  L 205 200
  L 202 165
  L 202 170

  /* Right arm */
  L 208 200
  L 220 240
  L 228 280
  L 238 320
  L 242 355
  C 240 365, 238 375, 242 378
  L 255 378
  C 265 375, 272 365, 270 355
  L 265 320
  C 260 280, 255 245, 250 220
  L 240 175
  C 235 150, 220 130, 200 125

  /* Right shoulder & neck */
  L 167 118
  L 165 105
  L 175 105
  L 175 95

  /* Complete head */
  C 185 90, 195 75, 195 60
  C 195 40, 185 12, 150 12
  Z
`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all parts for a specific system
 */
export function getSystemPaths(systemId) {
  switch (systemId) {
    case 'skeletal':
      return SKELETAL_PATHS;
    case 'muscular':
      return MUSCULAR_PATHS;
    case 'organs':
      return ORGAN_PATHS;
    default:
      return {};
  }
}

/**
 * Get all parts from all systems as a flat array
 */
export function getAllPaths() {
  return [
    ...Object.values(SKELETAL_PATHS),
    ...Object.values(MUSCULAR_PATHS),
    ...Object.values(ORGAN_PATHS),
  ];
}

/**
 * Get a specific part by ID
 */
export function getPartPath(partId) {
  return (
    SKELETAL_PATHS[partId] ||
    MUSCULAR_PATHS[partId] ||
    ORGAN_PATHS[partId] ||
    null
  );
}
