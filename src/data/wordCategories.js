/**
 * Comprehensive Word Categories Dataset
 * Used for word games like Strands, Connections, Word Search, etc.
 * 
 * Each category contains:
 * - name: Display name for the category
 * - words: Array of words in this category
 * - difficulty: 1-4 (1=easy, 4=hard) - useful for Connections-style games
 * 
 * Sources include Corpora project (https://github.com/dariusk/corpora)
 */

export const wordCategories = {
  // FOOD & DRINK
  fruits: {
    name: "Fruits",
    words: ["APPLE", "APRICOT", "AVOCADO", "BANANA", "BLACKBERRY", "BLUEBERRY", "CANTALOUPE", "CHERRY", "COCONUT", "CRANBERRY", "DATE", "DRAGONFRUIT", "FIG", "GRAPE", "GRAPEFRUIT", "GUAVA", "HONEYDEW", "KIWI", "LEMON", "LIME", "LYCHEE", "MANGO", "MELON", "NECTARINE", "OLIVE", "ORANGE", "PAPAYA", "PEACH", "PEAR", "PERSIMMON", "PINEAPPLE", "PLUM", "POMEGRANATE", "RASPBERRY", "STRAWBERRY", "TANGERINE", "WATERMELON"],
    difficulty: 1
  },
  vegetables: {
    name: "Vegetables",
    words: ["ARTICHOKE", "ASPARAGUS", "BEET", "BROCCOLI", "CABBAGE", "CARROT", "CAULIFLOWER", "CELERY", "CORN", "CUCUMBER", "EGGPLANT", "GARLIC", "GINGER", "KALE", "LEEK", "LETTUCE", "MUSHROOM", "OKRA", "ONION", "PARSLEY", "PARSNIP", "PEA", "PEPPER", "POTATO", "PUMPKIN", "RADISH", "RHUBARB", "SPINACH", "SQUASH", "TOMATO", "TURNIP", "YAM", "ZUCCHINI"],
    difficulty: 1
  },
  desserts: {
    name: "Desserts",
    words: ["BROWNIE", "CAKE", "CANDY", "CARAMEL", "CHEESECAKE", "CHOCOLATE", "COOKIE", "CREAM", "CUPCAKE", "CUSTARD", "DONUT", "ECLAIR", "FLAN", "FUDGE", "GELATO", "ICECREAM", "JELLYBEAN", "LOLLIPOP", "MACARON", "MOUSSE", "MUFFIN", "PASTRY", "PIE", "PRALINE", "PUDDING", "SORBET", "SOUFFLE", "SUNDAE", "TART", "TIRAMISU", "TRUFFLE", "WAFFLE"],
    difficulty: 1
  },
  drinks: {
    name: "Drinks",
    words: ["BEER", "BRANDY", "CHAMPAGNE", "CIDER", "COCOA", "COFFEE", "COLA", "ESPRESSO", "GIN", "JUICE", "LATTE", "LEMONADE", "MARTINI", "MILK", "MILKSHAKE", "MOCHA", "RUM", "SODA", "TEA", "TEQUILA", "VODKA", "WATER", "WHISKEY", "WINE"],
    difficulty: 1
  },
  herbs: {
    name: "Herbs & Spices",
    words: ["BASIL", "CARDAMOM", "CAYENNE", "CHIVE", "CILANTRO", "CINNAMON", "CLOVE", "CORIANDER", "CUMIN", "DILL", "FENNEL", "GARLIC", "GINGER", "LAVENDER", "MARJORAM", "MINT", "NUTMEG", "OREGANO", "PAPRIKA", "PARSLEY", "PEPPER", "ROSEMARY", "SAFFRON", "SAGE", "TARRAGON", "THYME", "TURMERIC", "VANILLA"],
    difficulty: 2
  },
  pasta: {
    name: "Pasta Types",
    words: ["ANGEL", "BOWTIE", "CANNELLONI", "FETTUCCINE", "FUSILLI", "GNOCCHI", "LASAGNA", "LINGUINE", "MACARONI", "MANICOTTI", "ORZO", "PENNE", "RAVIOLI", "RIGATONI", "ROTINI", "SPAGHETTI", "TAGLIATELLE", "TORTELLINI", "ZITI"],
    difficulty: 2
  },
  cheese: {
    name: "Cheese Types",
    words: ["AMERICAN", "ASIAGO", "BLEU", "BRIE", "CAMEMBERT", "CHEDDAR", "COLBY", "EDAM", "FETA", "FONTINA", "GOAT", "GOUDA", "GRUYERE", "HAVARTI", "MANCHEGO", "MASCARPONE", "MONTEREY", "MOZZARELLA", "MUENSTER", "PARMESAN", "PROVOLONE", "RICOTTA", "ROMANO", "ROQUEFORT", "SWISS"],
    difficulty: 2
  },
  
  // ANIMALS
  mammals: {
    name: "Mammals",
    words: ["BADGER", "BAT", "BEAR", "BEAVER", "BISON", "BUFFALO", "CAMEL", "CAT", "CHEETAH", "CHIMP", "COUGAR", "COW", "COYOTE", "DEER", "DOG", "DOLPHIN", "DONKEY", "ELEPHANT", "ELK", "FOX", "GIRAFFE", "GOAT", "GORILLA", "HAMSTER", "HIPPO", "HORSE", "HYENA", "JAGUAR", "KANGAROO", "KOALA", "LEMUR", "LEOPARD", "LION", "LLAMA", "LYNX", "MOLE", "MONKEY", "MOOSE", "MOUSE", "OTTER", "PANDA", "PANTHER", "PIG", "PLATYPUS", "POLAR", "RABBIT", "RACCOON", "RAT", "RHINO", "SEAL", "SHEEP", "SKUNK", "SLOTH", "SQUIRREL", "TIGER", "WALRUS", "WEASEL", "WHALE", "WOLF", "ZEBRA"],
    difficulty: 1
  },
  birds: {
    name: "Birds",
    words: ["ALBATROSS", "BLUEBIRD", "CANARY", "CARDINAL", "COCKATOO", "CONDOR", "CRANE", "CROW", "DOVE", "DUCK", "EAGLE", "FALCON", "FINCH", "FLAMINGO", "GOOSE", "HAWK", "HERON", "HUMMINGBIRD", "JAY", "KINGFISHER", "LARK", "MACAW", "MAGPIE", "MOCKINGBIRD", "NIGHTINGALE", "ORIOLE", "OSTRICH", "OWL", "PARROT", "PEACOCK", "PELICAN", "PENGUIN", "PHEASANT", "PIGEON", "QUAIL", "RAVEN", "ROBIN", "ROOSTER", "SEAGULL", "SPARROW", "STORK", "SWALLOW", "SWAN", "TOUCAN", "TURKEY", "VULTURE", "WOODPECKER", "WREN"],
    difficulty: 1
  },
  fish: {
    name: "Fish",
    words: ["ANCHOVY", "BARRACUDA", "BASS", "CATFISH", "CLOWNFISH", "COD", "EEL", "FLOUNDER", "GOLDFISH", "GROUPER", "HADDOCK", "HALIBUT", "HERRING", "MACKEREL", "MARLIN", "PERCH", "PIKE", "PIRANHA", "SALMON", "SARDINE", "SHARK", "SNAPPER", "SOLE", "STURGEON", "SWORDFISH", "TROUT", "TUNA", "WALLEYE"],
    difficulty: 2
  },
  insects: {
    name: "Insects",
    words: ["ANT", "BEE", "BEETLE", "BUTTERFLY", "CATERPILLAR", "CENTIPEDE", "CICADA", "COCKROACH", "CRICKET", "DRAGONFLY", "FIREFLY", "FLEA", "FLY", "GNAT", "GRASSHOPPER", "HORNET", "LADYBUG", "LOCUST", "MANTIS", "MOSQUITO", "MOTH", "SCORPION", "SPIDER", "TERMITE", "TICK", "WASP", "WORM"],
    difficulty: 1
  },
  reptiles: {
    name: "Reptiles",
    words: ["ALLIGATOR", "ANACONDA", "BOA", "CHAMELEON", "COBRA", "CROCODILE", "GECKO", "IGUANA", "KOMODO", "LIZARD", "PYTHON", "RATTLESNAKE", "SALAMANDER", "SNAKE", "TORTOISE", "TURTLE", "VIPER"],
    difficulty: 2
  },
  dinosaurs: {
    name: "Dinosaurs",
    words: ["ALLOSAURUS", "ANKYLOSAURUS", "BRACHIOSAURUS", "DIPLODOCUS", "IGUANODON", "MEGALOSAURUS", "MOSASAURUS", "PARASAUROLOPHUS", "PTERANODON", "PTERODACTYL", "RAPTOR", "SPINOSAURUS", "STEGOSAURUS", "TRICERATOPS", "TYRANNOSAURUS", "VELOCIRAPTOR"],
    difficulty: 2
  },
  
  // NATURE
  flowers: {
    name: "Flowers",
    words: ["AZALEA", "BEGONIA", "BLUEBELL", "BUTTERCUP", "CAMELLIA", "CARNATION", "CHRYSANTHEMUM", "DAFFODIL", "DAHLIA", "DAISY", "DANDELION", "GARDENIA", "GERANIUM", "HIBISCUS", "HYACINTH", "IRIS", "JASMINE", "LAVENDER", "LILAC", "LILY", "LOTUS", "MAGNOLIA", "MARIGOLD", "ORCHID", "PANSY", "PEONY", "PETUNIA", "POPPY", "ROSE", "SUNFLOWER", "TULIP", "VIOLET", "ZINNIA"],
    difficulty: 1
  },
  trees: {
    name: "Trees",
    words: ["ASH", "ASPEN", "BAMBOO", "BEECH", "BIRCH", "CEDAR", "CHERRY", "CHESTNUT", "CYPRESS", "ELM", "EUCALYPTUS", "FIR", "HICKORY", "JUNIPER", "MAHOGANY", "MAPLE", "OAK", "OLIVE", "PALM", "PINE", "POPLAR", "REDWOOD", "SEQUOIA", "SPRUCE", "SYCAMORE", "WALNUT", "WILLOW"],
    difficulty: 2
  },
  weather: {
    name: "Weather",
    words: ["BLIZZARD", "BREEZE", "CLOUD", "CYCLONE", "DEW", "DRIZZLE", "DROUGHT", "FLOOD", "FOG", "FROST", "GALE", "HAIL", "HEAT", "HUMIDITY", "HURRICANE", "ICE", "LIGHTNING", "MIST", "MONSOON", "RAIN", "RAINBOW", "SLEET", "SLUSH", "SMOG", "SNOW", "STORM", "SUNNY", "TEMPEST", "THUNDER", "TORNADO", "TYPHOON", "WIND"],
    difficulty: 1
  },
  gemstones: {
    name: "Gemstones",
    words: ["AGATE", "AMBER", "AMETHYST", "AQUAMARINE", "CITRINE", "CORAL", "DIAMOND", "EMERALD", "GARNET", "JADE", "JASPER", "JET", "LAPIS", "MOONSTONE", "OBSIDIAN", "ONYX", "OPAL", "PEARL", "PERIDOT", "QUARTZ", "RUBY", "SAPPHIRE", "TOPAZ", "TOURMALINE", "TURQUOISE", "ZIRCON"],
    difficulty: 2
  },
  metals: {
    name: "Metals",
    words: ["ALUMINUM", "BRASS", "BRONZE", "CHROMIUM", "COBALT", "COPPER", "GOLD", "IRON", "LEAD", "MAGNESIUM", "MERCURY", "NICKEL", "PALLADIUM", "PLATINUM", "SILVER", "STEEL", "TIN", "TITANIUM", "TUNGSTEN", "URANIUM", "ZINC"],
    difficulty: 2
  },
  
  // SPACE & SCIENCE
  planets: {
    name: "Planets",
    words: ["EARTH", "JUPITER", "MARS", "MERCURY", "NEPTUNE", "PLUTO", "SATURN", "URANUS", "VENUS"],
    difficulty: 1
  },
  space: {
    name: "Space Terms",
    words: ["ASTEROID", "ASTRONAUT", "BLACKHOLE", "COMET", "CONSTELLATION", "COSMOS", "ECLIPSE", "GALAXY", "GRAVITY", "METEOR", "MILKYWAY", "MOON", "NEBULA", "ORBIT", "PULSAR", "QUASAR", "ROCKET", "SATELLITE", "SHUTTLE", "SOLAR", "STAR", "SUPERNOVA", "TELESCOPE", "UNIVERSE"],
    difficulty: 2
  },
  elements: {
    name: "Chemical Elements",
    words: ["ARGON", "BARIUM", "BORON", "BROMINE", "CALCIUM", "CARBON", "CHLORINE", "COPPER", "FLUORINE", "GOLD", "HELIUM", "HYDROGEN", "IODINE", "IRON", "KRYPTON", "LEAD", "LITHIUM", "MAGNESIUM", "NEON", "NICKEL", "NITROGEN", "OXYGEN", "PHOSPHORUS", "POTASSIUM", "RADIUM", "RADON", "SILICON", "SILVER", "SODIUM", "SULFUR", "TIN", "URANIUM", "XENON", "ZINC"],
    difficulty: 3
  },
  
  // MUSIC
  instruments: {
    name: "Musical Instruments",
    words: ["ACCORDION", "BAGPIPE", "BANJO", "BASS", "BASSOON", "BUGLE", "CELLO", "CLARINET", "CYMBAL", "DIDGERIDOO", "DRUM", "FIDDLE", "FIFE", "FLUTE", "GONG", "GUITAR", "HARMONICA", "HARP", "KAZOO", "KEYBOARD", "LUTE", "LYRE", "MANDOLIN", "MARIMBA", "OBOE", "ORGAN", "PIANO", "PICCOLO", "RECORDER", "SAXOPHONE", "SITAR", "TAMBOURINE", "TROMBONE", "TRUMPET", "TUBA", "UKULELE", "VIOLA", "VIOLIN", "XYLOPHONE"],
    difficulty: 1
  },
  genres: {
    name: "Music Genres",
    words: ["BLUES", "CLASSICAL", "COUNTRY", "DISCO", "ELECTRONIC", "FOLK", "FUNK", "GOSPEL", "GRUNGE", "HIPHOP", "HOUSE", "INDIE", "JAZZ", "LATIN", "METAL", "OPERA", "POP", "PUNK", "RAP", "REGGAE", "RNB", "ROCK", "SOUL", "SWING", "TECHNO", "TRANCE"],
    difficulty: 2
  },
  
  // SPORTS
  sports: {
    name: "Sports",
    words: ["ARCHERY", "BADMINTON", "BASEBALL", "BASKETBALL", "BIKING", "BOWLING", "BOXING", "CLIMBING", "CRICKET", "CROQUET", "CURLING", "CYCLING", "DIVING", "FENCING", "FISHING", "FOOTBALL", "GOLF", "GYMNASTICS", "HANDBALL", "HIKING", "HOCKEY", "JUDO", "KARATE", "KAYAKING", "LACROSSE", "POLO", "RACING", "ROWING", "RUGBY", "RUNNING", "SAILING", "SHOOTING", "SKATING", "SKIING", "SNOWBOARDING", "SOCCER", "SOFTBALL", "SQUASH", "SURFING", "SWIMMING", "TENNIS", "TRACK", "VOLLEYBALL", "WRESTLING", "YOGA"],
    difficulty: 1
  },
  olympicEvents: {
    name: "Olympic Events",
    words: ["ARCHERY", "ATHLETICS", "BASKETBALL", "BOXING", "CANOE", "CYCLING", "DIVING", "EQUESTRIAN", "FENCING", "GOLF", "GYMNASTICS", "HANDBALL", "HOCKEY", "JUDO", "PENTATHLON", "ROWING", "RUGBY", "SAILING", "SHOOTING", "SKATEBOARDING", "SOCCER", "SOFTBALL", "SURFING", "SWIMMING", "TAEKWONDO", "TENNIS", "TRIATHLON", "VOLLEYBALL", "WEIGHTLIFTING", "WRESTLING"],
    difficulty: 2
  },
  
  // ARTS & CULTURE
  colors: {
    name: "Colors",
    words: ["AMBER", "AQUA", "AZURE", "BEIGE", "BLACK", "BLUE", "BRONZE", "BROWN", "BURGUNDY", "CORAL", "CREAM", "CRIMSON", "CYAN", "EMERALD", "FUCHSIA", "GOLD", "GRAY", "GREEN", "INDIGO", "IVORY", "JADE", "LAVENDER", "LEMON", "LILAC", "LIME", "MAGENTA", "MAROON", "MAUVE", "MINT", "NAVY", "OLIVE", "ORANGE", "ORCHID", "PEACH", "PEARL", "PERIWINKLE", "PINK", "PLUM", "PURPLE", "RED", "ROSE", "RUBY", "SALMON", "SAPPHIRE", "SCARLET", "SILVER", "TAN", "TEAL", "TURQUOISE", "VIOLET", "WHITE", "YELLOW"],
    difficulty: 1
  },
  artTerms: {
    name: "Art Terms",
    words: ["ABSTRACT", "BAROQUE", "CANVAS", "COLLAGE", "CUBISM", "EASEL", "FRESCO", "GALLERY", "GOTHIC", "IMPRESSIONISM", "LANDSCAPE", "MOSAIC", "MURAL", "PALETTE", "PASTEL", "PORTRAIT", "REALISM", "RENAISSANCE", "SCULPTURE", "SKETCH", "STATUE", "STILL", "SURREALISM", "TEMPERA", "WATERCOLOR"],
    difficulty: 3
  },
  dances: {
    name: "Dances",
    words: ["BALLET", "BALLROOM", "BOLERO", "CHA", "DISCO", "FLAMENCO", "FOXTROT", "HIPHOP", "HULA", "JAZZ", "JIVE", "LIMBO", "MAMBO", "POLKA", "RUMBA", "SALSA", "SAMBA", "SWING", "TANGO", "TAP", "TWIST", "WALTZ"],
    difficulty: 2
  },
  
  // HOUSEHOLD
  furniture: {
    name: "Furniture",
    words: ["ARMCHAIR", "BED", "BENCH", "BOOKCASE", "BUREAU", "CABINET", "CHAIR", "CHEST", "CLOSET", "COUCH", "CRIB", "CUPBOARD", "DESK", "DRESSER", "FUTON", "HAMMOCK", "HEADBOARD", "HUTCH", "LOVESEAT", "MATTRESS", "NIGHTSTAND", "OTTOMAN", "RECLINER", "ROCKER", "SHELF", "SIDEBOARD", "SOFA", "STOOL", "TABLE", "THRONE", "VANITY", "WARDROBE"],
    difficulty: 1
  },
  kitchenItems: {
    name: "Kitchen Items",
    words: ["BLENDER", "BOWL", "COLANDER", "CUP", "CUTTER", "DISHWASHER", "FORK", "FRIDGE", "GRATER", "GRILL", "KETTLE", "KNIFE", "LADLE", "MASHER", "MICROWAVE", "MIXER", "MUG", "OVEN", "PAN", "PEELER", "PITCHER", "PLATE", "POT", "PRESS", "RACK", "ROLLER", "SAUCEPAN", "SIEVE", "SKILLET", "SPATULA", "SPOON", "STOVE", "STRAINER", "TIMER", "TOASTER", "TONGS", "WHISK", "WOK"],
    difficulty: 1
  },
  clothing: {
    name: "Clothing",
    words: ["BELT", "BLAZER", "BLOUSE", "BOOTS", "CAP", "CARDIGAN", "COAT", "DRESS", "FLEECE", "GLOVES", "HAT", "HOODIE", "JACKET", "JEANS", "JUMPER", "OVERALLS", "PAJAMAS", "PANTS", "PONCHO", "RAINCOAT", "ROBE", "SANDALS", "SCARF", "SHIRT", "SHOES", "SHORTS", "SKIRT", "SLIPPERS", "SOCKS", "SUIT", "SWEATER", "TIE", "TROUSERS", "VEST", "WINDBREAKER"],
    difficulty: 1
  },
  tools: {
    name: "Tools",
    words: ["AWL", "AXE", "CHISEL", "CLAMP", "CROWBAR", "DRILL", "FILE", "HACKSAW", "HAMMER", "HATCHET", "JACK", "LEVEL", "MALLET", "NAIL", "PICKAXE", "PLANE", "PLIERS", "RASP", "RATCHET", "SAW", "SCISSORS", "SCRAPER", "SCREWDRIVER", "SHOVEL", "SLEDGE", "SOCKET", "SPADE", "STAPLER", "TAPE", "TROWEL", "VISE", "WRENCH"],
    difficulty: 2
  },
  
  // TRANSPORTATION
  vehicles: {
    name: "Vehicles",
    words: ["AIRPLANE", "AMBULANCE", "BICYCLE", "BOAT", "BUS", "CAB", "CAR", "CANOE", "CARRIAGE", "FERRY", "HELICOPTER", "JET", "KAYAK", "LIMOUSINE", "MINIVAN", "MOPED", "MOTORCYCLE", "PLANE", "RAFT", "RICKSHAW", "SAILBOAT", "SCOOTER", "SEDAN", "SHIP", "SLED", "SLEIGH", "SNOWMOBILE", "SUBMARINE", "SUBWAY", "TAXI", "TRAIN", "TRAM", "TROLLEY", "TRUCK", "VAN", "WAGON", "YACHT"],
    difficulty: 1
  },
  carBrands: {
    name: "Car Brands",
    words: ["ACURA", "ALFA", "ASTON", "AUDI", "BENTLEY", "BMW", "BUICK", "CADILLAC", "CHEVROLET", "CHRYSLER", "DODGE", "FERRARI", "FIAT", "FORD", "HONDA", "HYUNDAI", "INFINITI", "JAGUAR", "JEEP", "KIA", "LAMBORGHINI", "LEXUS", "LINCOLN", "LOTUS", "MASERATI", "MAZDA", "MERCEDES", "MINI", "MITSUBISHI", "NISSAN", "PORSCHE", "RAM", "RENAULT", "ROLLS", "SUBARU", "TESLA", "TOYOTA", "VOLKSWAGEN", "VOLVO"],
    difficulty: 2
  },
  
  // GEOGRAPHY
  countries: {
    name: "Countries",
    words: ["ARGENTINA", "AUSTRALIA", "AUSTRIA", "BELGIUM", "BRAZIL", "CANADA", "CHILE", "CHINA", "COLOMBIA", "CUBA", "DENMARK", "EGYPT", "ENGLAND", "FINLAND", "FRANCE", "GERMANY", "GREECE", "HUNGARY", "ICELAND", "INDIA", "INDONESIA", "IRELAND", "ISRAEL", "ITALY", "JAPAN", "KENYA", "KOREA", "MEXICO", "MOROCCO", "NEPAL", "NETHERLANDS", "NORWAY", "PERU", "PHILIPPINES", "POLAND", "PORTUGAL", "RUSSIA", "SCOTLAND", "SINGAPORE", "SPAIN", "SWEDEN", "SWITZERLAND", "THAILAND", "TURKEY", "UKRAINE", "VIETNAM", "WALES"],
    difficulty: 1
  },
  capitals: {
    name: "Capital Cities",
    words: ["AMSTERDAM", "ATHENS", "BANGKOK", "BEIJING", "BERLIN", "BOGOTA", "BRUSSELS", "BUDAPEST", "BUENOS", "CAIRO", "CANBERRA", "COPENHAGEN", "DELHI", "DUBLIN", "HAVANA", "HELSINKI", "JAKARTA", "JERUSALEM", "KABUL", "KIEV", "LIMA", "LISBON", "LONDON", "MADRID", "MANILA", "MEXICO", "MOSCOW", "NAIROBI", "OSLO", "OTTAWA", "PARIS", "PRAGUE", "REYKJAVIK", "RIYADH", "ROME", "SANTIAGO", "SEOUL", "SINGAPORE", "STOCKHOLM", "SYDNEY", "TOKYO", "VIENNA", "WARSAW", "WASHINGTON"],
    difficulty: 2
  },
  usStates: {
    name: "US States",
    words: ["ALABAMA", "ALASKA", "ARIZONA", "ARKANSAS", "CALIFORNIA", "COLORADO", "CONNECTICUT", "DELAWARE", "FLORIDA", "GEORGIA", "HAWAII", "IDAHO", "ILLINOIS", "INDIANA", "IOWA", "KANSAS", "KENTUCKY", "LOUISIANA", "MAINE", "MARYLAND", "MICHIGAN", "MINNESOTA", "MISSISSIPPI", "MISSOURI", "MONTANA", "NEBRASKA", "NEVADA", "OHIO", "OKLAHOMA", "OREGON", "PENNSYLVANIA", "TENNESSEE", "TEXAS", "UTAH", "VERMONT", "VIRGINIA", "WASHINGTON", "WISCONSIN", "WYOMING"],
    difficulty: 2
  },
  landforms: {
    name: "Landforms",
    words: ["ARCHIPELAGO", "ATOLL", "BAY", "BEACH", "BLUFF", "BUTTE", "CANYON", "CAPE", "CAVE", "CLIFF", "COAST", "CRATER", "DELTA", "DESERT", "DUNE", "FJORD", "FOREST", "GEYSER", "GLACIER", "GORGE", "GULF", "HILL", "ISLAND", "ISTHMUS", "JUNGLE", "LAGOON", "LAKE", "MARSH", "MESA", "MOUNTAIN", "OASIS", "OCEAN", "PENINSULA", "PLAIN", "PLATEAU", "PRAIRIE", "RAINFOREST", "REEF", "RIDGE", "RIVER", "SAVANNA", "SEA", "STRAIT", "STREAM", "SWAMP", "TUNDRA", "VALLEY", "VOLCANO", "WATERFALL", "WETLAND"],
    difficulty: 2
  },
  
  // OCCUPATIONS
  professions: {
    name: "Professions",
    words: ["ACCOUNTANT", "ACTOR", "ARCHITECT", "ARTIST", "ASTRONAUT", "AUTHOR", "BAKER", "BANKER", "BARBER", "BLACKSMITH", "BUTCHER", "CAPTAIN", "CARPENTER", "CASHIER", "CHEF", "CHEMIST", "CLERK", "COACH", "DANCER", "DENTIST", "DETECTIVE", "DIRECTOR", "DOCTOR", "DRIVER", "EDITOR", "ELECTRICIAN", "ENGINEER", "FARMER", "FIREFIGHTER", "FLORIST", "GARDENER", "GUARD", "JANITOR", "JEWELER", "JOURNALIST", "JUDGE", "LAWYER", "LIBRARIAN", "LOCKSMITH", "MAGICIAN", "MAILMAN", "MANAGER", "MECHANIC", "MUSICIAN", "NURSE", "OPTICIAN", "PAINTER", "PASTOR", "PHARMACIST", "PHOTOGRAPHER", "PILOT", "PLUMBER", "POET", "POLICE", "POLITICIAN", "PRIEST", "PRINCIPAL", "PROFESSOR", "PROGRAMMER", "PSYCHIATRIST", "RANCHER", "RECEPTIONIST", "REPORTER", "SAILOR", "SALESMAN", "SCIENTIST", "SCULPTOR", "SECRETARY", "SINGER", "SOLDIER", "SURGEON", "TAILOR", "TEACHER", "THERAPIST", "TRAINER", "TRANSLATOR", "TUTOR", "VETERINARIAN", "WAITER", "WELDER", "WRITER", "ZOOLOGIST"],
    difficulty: 1
  },
  
  // MYTHOLOGY & FANTASY
  greekGods: {
    name: "Greek Gods",
    words: ["APHRODITE", "APOLLO", "ARES", "ARTEMIS", "ATHENA", "DEMETER", "DIONYSUS", "EROS", "GAIA", "HADES", "HEPHAESTUS", "HERA", "HERMES", "HESTIA", "HYPNOS", "NEMESIS", "POSEIDON", "THANATOS", "URANUS", "ZEUS"],
    difficulty: 3
  },
  mythology: {
    name: "Mythological Creatures",
    words: ["BASILISK", "CENTAUR", "CERBERUS", "CHIMERA", "CYCLOPS", "DRAGON", "DWARF", "ELF", "FAIRY", "GHOST", "GIANT", "GNOME", "GOBLIN", "GOLEM", "GORGON", "GRIFFIN", "HARPY", "HYDRA", "KRAKEN", "LEPRECHAUN", "MERMAID", "MINOTAUR", "NYMPH", "OGRE", "PEGASUS", "PHOENIX", "PIXIE", "SASQUATCH", "SATYR", "SIREN", "SPHINX", "SPRITE", "TITAN", "TROLL", "UNICORN", "VAMPIRE", "WEREWOLF", "WITCH", "WIZARD", "YETI", "ZOMBIE"],
    difficulty: 2
  },
  
  // EMOTIONS & STATES
  emotions: {
    name: "Emotions",
    words: ["ANGER", "ANXIETY", "AWE", "BLISS", "BOREDOM", "CALM", "CONFUSION", "CONTEMPT", "CURIOSITY", "DESPAIR", "DISGUST", "DREAD", "ECSTASY", "EMBARRASSMENT", "ENVY", "EUPHORIA", "EXCITEMENT", "FEAR", "FRUSTRATION", "GRATITUDE", "GRIEF", "GUILT", "HAPPINESS", "HATRED", "HOPE", "HORROR", "JEALOUSY", "JOY", "LONELINESS", "LOVE", "NOSTALGIA", "PANIC", "PASSION", "PEACE", "PITY", "PRIDE", "RAGE", "REGRET", "RELIEF", "RESENTMENT", "SADNESS", "SATISFACTION", "SHAME", "SHOCK", "SORROW", "SURPRISE", "SYMPATHY", "TERROR", "TRUST", "WONDER", "WORRY"],
    difficulty: 2
  },
  
  // BODY
  bodyParts: {
    name: "Body Parts",
    words: ["ANKLE", "ARM", "BACK", "BELLY", "BRAIN", "CALF", "CHEEK", "CHEST", "CHIN", "EAR", "ELBOW", "EYE", "EYEBROW", "FACE", "FINGER", "FIST", "FOOT", "FOREHEAD", "HAIR", "HAND", "HEAD", "HEART", "HEEL", "HIP", "JAW", "KIDNEY", "KNEE", "LEG", "LIP", "LIVER", "LUNG", "MOUTH", "MUSCLE", "NECK", "NOSE", "PALM", "RIB", "SHOULDER", "SKIN", "SKULL", "SPINE", "STOMACH", "THIGH", "THROAT", "THUMB", "TOE", "TONGUE", "TOOTH", "WAIST", "WRIST"],
    difficulty: 1
  },
  
  // GAMES & ENTERTAINMENT
  boardGames: {
    name: "Board Games",
    words: ["BACKGAMMON", "BATTLESHIP", "BINGO", "BOGGLE", "CANDY", "CHECKERS", "CHESS", "CLUE", "CONNECT", "CRANIUM", "DOMINOES", "JENGA", "LIFE", "MANCALA", "MONOPOLY", "OPERATION", "OTHELLO", "PARCHEESI", "PICTIONARY", "RISK", "SCATTERGORIES", "SCRABBLE", "SORRY", "STRATEGO", "TABOO", "TRIVIAL", "TROUBLE", "TWISTER", "UNO", "YAHTZEE"],
    difficulty: 2
  },
  cardGames: {
    name: "Card Games",
    words: ["BLACKJACK", "BRIDGE", "CANASTA", "CRAZY", "CRIBBAGE", "EUCHRE", "GIN", "HEARTS", "KINGS", "OLD", "PINOCHLE", "POKER", "RUMMY", "SLAPJACK", "SOLITAIRE", "SPADES", "SPEED", "SPOONS", "TEXAS", "UNO", "WAR", "WHIST"],
    difficulty: 2
  },
  movieGenres: {
    name: "Movie Genres",
    words: ["ACTION", "ADVENTURE", "ANIMATION", "BIOGRAPHY", "COMEDY", "CRIME", "DOCUMENTARY", "DRAMA", "FAMILY", "FANTASY", "FILM", "HISTORICAL", "HORROR", "INDIE", "MARTIAL", "MUSICAL", "MYSTERY", "NOIR", "ROMANCE", "SCIFI", "SPORTS", "SUPERHERO", "THRILLER", "WAR", "WESTERN"],
    difficulty: 2
  },
  
  // TECHNOLOGY
  technology: {
    name: "Technology Terms",
    words: ["ALGORITHM", "APP", "BANDWIDTH", "BINARY", "BITCOIN", "BLOG", "BLUETOOTH", "BROWSER", "BYTE", "CACHE", "CLOUD", "CODE", "COOKIE", "CPU", "CURSOR", "DATABASE", "DEBUG", "DESKTOP", "DOWNLOAD", "EMAIL", "ENCRYPTION", "FIREWALL", "FLASH", "FOLDER", "GIGABYTE", "GPS", "HACKER", "HARDWARE", "HASHTAG", "HTML", "ICON", "INTERNET", "JAVA", "KEYBOARD", "LAPTOP", "LINK", "LOGIN", "MALWARE", "MEGABYTE", "MEMORY", "MODEM", "MONITOR", "MOUSE", "NETWORK", "OFFLINE", "ONLINE", "PASSWORD", "PIXEL", "PLUGIN", "PODCAST", "PRINTER", "PROCESSOR", "PROGRAM", "RAM", "ROUTER", "SCREENSHOT", "SERVER", "SOFTWARE", "SPAM", "STREAMING", "TABLET", "UPLOAD", "URL", "USB", "VIRUS", "WEBCAM", "WEBSITE", "WIFI", "WINDOW", "WIRELESS", "ZOOM"],
    difficulty: 2
  },
  
  // TIME
  months: {
    name: "Months",
    words: ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"],
    difficulty: 1
  },
  weekdays: {
    name: "Days of the Week",
    words: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"],
    difficulty: 1
  },
  seasons: {
    name: "Seasons",
    words: ["SPRING", "SUMMER", "AUTUMN", "FALL", "WINTER"],
    difficulty: 1
  },
  holidays: {
    name: "Holidays",
    words: ["CHRISTMAS", "EASTER", "HALLOWEEN", "HANUKKAH", "INDEPENDENCE", "LABOR", "MEMORIAL", "NEWYEAR", "THANKSGIVING", "VALENTINES", "VETERANS"],
    difficulty: 1
  },
};

// Helper function to get all categories as an array
export function getAllCategories() {
  return Object.entries(wordCategories).map(([key, category]) => ({
    id: key,
    ...category
  }));
}

// Helper function to get a random category
export function getRandomCategory(excludeIds = []) {
  const available = Object.entries(wordCategories)
    .filter(([key]) => !excludeIds.includes(key));
  
  if (available.length === 0) return null;
  
  const [key, category] = available[Math.floor(Math.random() * available.length)];
  return { id: key, ...category };
}

// Helper function to get random words from a category
export function getRandomWordsFromCategory(categoryId, count = 4, maxLength = null) {
  const category = wordCategories[categoryId];
  if (!category) return [];
  
  let words = [...category.words];
  
  // Filter by max length if specified
  if (maxLength) {
    words = words.filter(w => w.length <= maxLength);
  }
  
  // Shuffle and return requested count
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  
  return words.slice(0, count);
}

// Helper function to find which category a word belongs to
export function findCategoryForWord(word) {
  const upperWord = word.toUpperCase();
  
  for (const [key, category] of Object.entries(wordCategories)) {
    if (category.words.includes(upperWord)) {
      return { id: key, ...category };
    }
  }
  
  return null;
}

// Helper function to get multiple categories with non-overlapping words
export function getNonOverlappingCategories(count = 4, wordsPerCategory = 4, maxWordLength = null) {
  const result = [];
  const usedWords = new Set();
  const categoryKeys = Object.keys(wordCategories);
  
  // Shuffle category keys
  for (let i = categoryKeys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [categoryKeys[i], categoryKeys[j]] = [categoryKeys[j], categoryKeys[i]];
  }
  
  for (const key of categoryKeys) {
    if (result.length >= count) break;
    
    const category = wordCategories[key];
    let availableWords = category.words.filter(w => !usedWords.has(w));
    
    // Filter by max length if specified
    if (maxWordLength) {
      availableWords = availableWords.filter(w => w.length <= maxWordLength);
    }
    
    if (availableWords.length >= wordsPerCategory) {
      // Shuffle and pick words
      for (let i = availableWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableWords[i], availableWords[j]] = [availableWords[j], availableWords[i]];
      }
      
      const selectedWords = availableWords.slice(0, wordsPerCategory);
      selectedWords.forEach(w => usedWords.add(w));
      
      result.push({
        id: key,
        name: category.name,
        words: selectedWords,
        difficulty: category.difficulty
      });
    }
  }
  
  return result;
}

// Get categories by difficulty
export function getCategoriesByDifficulty(difficulty) {
  return Object.entries(wordCategories)
    .filter(([, category]) => category.difficulty === difficulty)
    .map(([key, category]) => ({ id: key, ...category }));
}

// Export category count for statistics
export const categoryCount = Object.keys(wordCategories).length;
export const totalWordCount = Object.values(wordCategories)
  .reduce((sum, cat) => sum + cat.words.length, 0);
