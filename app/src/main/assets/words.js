// Word database: WORD | emoji picture (optional) | synonym / short clue | tier (1 easy, 2 medium, 3 hard)
// Every word can be shown with its picture or its text clue, in a row or a column.
// Words without a picture always use the text clue.
var WORD_DATA = `
CAT|🐱|Kitty|1
DOG|🐶|Barks|1
LION|🦁|Big cat|1
COW|🐄|Gives milk|1
PIG|🐷|Hog|1
HEN|🐔|Lays eggs|1
OWL|🦉|Night bird|1
BEE|🐝|Makes honey|1
ANT|🐜|Tiny worker|1
BAT|🦇|Flying mammal|1
FOX|🦊|Sly animal|1
BEAR|🐻|Grizzly|1
WOLF|🐺|Howls|1
FROG|🐸|Croaks|1
FISH|🐟|Swims|1
DUCK|🦆|Quacks|1
GOAT|🐐|Billy|1
SHEEP|🐑|Gives wool|1
HORSE|🐴|Stallion|1
MOUSE|🐭|Small rodent|1
RABBIT|🐰|Bunny|1
TIGER|🐯|Striped cat|1
ZEBRA|🦓|Striped horse|1
CAMEL|🐫|Humped animal|1
SNAKE|🐍|Serpent|1
WHALE|🐋|Sea giant|1
SHARK|🦈|Jaws|1
CRAB|🦀|Has pincers|1
SNAIL|🐌|Slow mover|1
EAGLE|🦅|Bird of prey|1
DOVE|🕊️|Peace bird|2
APPLE|🍎|Red fruit|1
PEAR|🍐|Green fruit|1
GRAPE|🍇|Vine fruit|1
LEMON|🍋|Sour fruit|1
MELON|🍈|Juicy fruit|2
CHERRY|🍒|Small red fruit|1
PEACH|🍑|Fuzzy fruit|1
BANANA|🍌|Yellow fruit|1
CORN|🌽|Maize|1
CAKE|🎂|Birthday treat|1
EGG|🥚|Hen's product|1
MILK|🥛|Dairy drink|1
BREAD|🍞|Loaf|1
CHEESE|🧀|Cheddar|1
PIZZA|🍕|Italian pie|1
HONEY|🍯|Bee's sweet|1
TEA|🍵|Hot brew|1
SUN|☀️|Day star|1
MOON|🌙|Night light|1
STAR|⭐|Twinkler|1
RAIN|🌧️|Showers|1
SNOW|❄️|Flakes|1
FIRE|🔥|Flames|1
TREE|🌳|Oak or pine|1
ROSE|🌹|Red flower|1
LEAF|🍃|Foliage|1
HOUSE|🏠|Home|1
DOOR|🚪|Entrance|1
KEY|🔑|Opens locks|1
BOOK|📖|Novel|1
PEN|🖊️|Writes in ink|1
BELL|🔔|It rings|1
BALL|⚽|Kicked round|1
CAR|🚗|Auto|1
BUS|🚌|Coach|1
TRAIN|🚆|Runs on rails|1
PLANE|✈️|Jet|1
SHIP|🚢|Vessel|1
BOAT|⛵|Sailboat|1
BIKE|🚲|Bicycle|1
ROCKET|🚀|Spacecraft|1
CLOCK|⏰|Timepiece|1
WATCH|⌚|Wrist clock|1
PHONE|📱|Mobile|1
BULB|💡|Light source|1
CANDLE|🕯️|Wax light|1
CROWN|👑|Royal hat|1
RING|💍|Finger band|1
HAT|🎩|Topper|1
SHOE|👞|Footwear|1
SHIRT|👕|Tee|1
DRESS|👗|Gown|1
SOCKS|🧦|Foot warmers|1
BAG|👜|Purse|1
GIFT|🎁|Present|1
DRUM|🥁|Beat it|1
HEART|❤️|Ticker|1
EYE|👁️|Sees|1
EAR|👂|Hears|1
NOSE|👃|Smells|1
HAND|✋|Has a palm|1
FOOT|🦶|Has toes|1
TOOTH|🦷|Molar|1
BRAIN|🧠|Mind|1
BABY|👶|Infant|1
KING|🤴|Monarch|1
QUEEN|👸|King's wife|1
GHOST|👻|Spirit|1
ROBOT|🤖|Machine man|1
CLOWN|🤡|Circus joker|1
WIZARD|🧙|Magician|2
TENT|⛺|Camp shelter|1
CASTLE|🏰|Fortress|1
BRIDGE|🌉|Spans a river|1
ISLAND|🏝️|Land in the sea|1
DESERT|🏜️|Sahara|1
VOLCANO|🌋|Erupts lava|2
CLOUD|☁️|Sky fluff|1
STORM|⛈️|Tempest|2
WAVE|🌊|Surf|1
MAP|🗺️|Atlas page|1
SWORD|🗡️|Blade|1
SHIELD|🛡️|Guard|1
BOW|🏹|Archer's tool|1
HAMMER|🔨|Mallet|1
SCISSORS|✂️|Cutters|2
LOCK|🔒|Padlock|1
MAGNET|🧲|Attracts iron|2
GUITAR|🎸|Six strings|1
PIANO|🎹|Keyboard|1
VIOLIN|🎻|Fiddle|2
TRUMPET|🎺|Brass horn|2
CAMERA|📷|Takes photos|1
LAPTOP|💻|Computer|1
PILL|💊|Tablet|1
BONE|🦴|Skeleton part|1
SKULL|💀|Head bone|2
MASKS|🎭|Drama|2
TROPHY|🏆|Award cup|1
MEDAL|🥇|Gold prize|1
DICE|🎲|Rolled cubes|1
CHESS|♟️|Game of kings|2
PUZZLE|🧩|Jigsaw|1
BALLOON|🎈|Party float|1
ANCHOR|⚓|Ship holder|2
COMPASS|🧭|Shows north|2
BROOM|🧹|Sweeper|1
SOAP|🧼|Lather|1
CHAIR|💺|Seat|1
BED|🛏️|Cot|1
UMBRELLA|☂️|Brolly|2
TOMATO|🍅|Red veggie|1
POTATO|🥔|Spud|1
CARROT|🥕|Orange root|1
CHILI|🌶️|Hot pepper|2
MUSHROOM|🍄|Fungus|2
CACTUS|🌵|Prickly plant|1
PALM|🌴|Tropical tree|1
FLOWER|🌼|Bloom|1
PLANT|🌱|Sprout|1
OCTOPUS|🐙|Eight arms|1
SQUID|🦑|Inky swimmer|2
SHRIMP|🦐|Prawn|2
DOLPHIN|🐬|Smart swimmer|1
TURTLE|🐢|Shelled reptile|1
PARROT|🦜|Talking bird|1
PEACOCK|🦚|Showy bird|2
PENGUIN|🐧|Tuxedo bird|1
GIRAFFE|🦒|Long neck|1
ELEPHANT|🐘|Has a trunk|1
MONKEY|🐒|Ape|1
GORILLA|🦍|Big ape|2
KOALA|🐨|Tree bear|1
PANDA|🐼|Bamboo eater|1
DEER|🦌|Doe or stag|1
HEDGEHOG|🦔|Spiny critter|2
KANGAROO|🦘|Hopping pouch|2
SPIDER|🕷️|Web spinner|1
SCORPION|🦂|Stinger|2
DRAGON|🐉|Fire breather|1
DINOSAUR|🦖|T-Rex|2
UNICORN|🦄|Horned horse|1
MOSQUITO|🦟|Biting bug|2
LADYBUG|🐞|Spotted beetle|2
COOKIE|🍪|Biscuit|1
DONUT|🍩|Ring cake|1
CANDY|🍬|Sweets|1
BURGER|🍔|Bun meal|1
TACO|🌮|Mexican shell|2
SALAD|🥗|Greens|2
SOUP|🍲|Broth|1
RICE|🍚|Grain|1
NOODLES|🍜|Ramen|2
COFFEE|☕|Java|1
BOTTLE|🍾|Flask|2
SPOON|🥄|Stirrer|1
FORK|🍴|Pronged tool|1
KNIFE|🔪|Cutter|1
PLATE|🍽️|Dish|1
PAN|🍳|Skillet|2
BASKET|🧺|Hamper|2
LETTER|✉️|Mail|1
PIN|📌|Tack|2
PAPER|📄|Sheet|1
PENCIL|✏️|Has lead|1
CRAYON|🖍️|Wax color|2
BRUSH|🖌️|Paint tool|2
ART|🎨|Painting|1
MUSIC|🎵|Melody|1
HOSPITAL|🏥|Clinic|2
SCHOOL|🏫|Academy|1
MOSQUE|🕌|Masjid|1
CHURCH|⛪|Chapel|2
FACTORY|🏭|Plant|2
STADIUM|🏟️|Arena|2
TRUCK|🚚|Lorry|1
TAXI|🚕|Cab|1
TRACTOR|🚜|Farm vehicle|1
POLICE|🚓|Cops|1
SLED|🛷|Sleigh|2
SKATE|⛸️|Ice shoe|2
SKI|🎿|Snow glider|2
TENNIS|🎾|Racket sport|1
GOLF|⛳|Tee sport|2
FOOTBALL|🏈|Gridiron|2
FLAG|🚩|Banner|1
TORCH|🔦|Flashlight|2
BATTERY|🔋|Power cell|2
PLUG|🔌|Socket fit|2
GEAR|⚙️|Cog|2
CHAIN|⛓️|Links|2
SCREW|🔩|Bolt|2
TOOLBOX|🧰|Tool kit|2
BRICK|🧱|Wall block|2
SNOWMAN|⛄|Frosty|1
RAINBOW|🌈|Seven colors|1
BOLT|⚡|Lightning|1
COMET|☄️|Space rock|2
EARTH|🌍|Our planet|1
MOUNTAIN|⛰️|Peak|1
HAPPY||Glad|2
SAD||Unhappy|2
ANGRY||Mad|2
BRAVE||Bold|2
SMART||Clever|2
FAST||Quick|2
SLOW||Sluggish|2
BIG||Large|2
SMALL||Little|2
TALL||High|2
COLD||Chilly|2
HOT||Scorching|2
RICH||Wealthy|2
POOR||Needy|2
KIND||Nice|2
CALM||Peaceful|2
LOUD||Noisy|2
QUIET||Silent|2
EASY||Simple|2
HARD||Difficult|2
START||Begin|2
END||Finish|2
FRIEND||Pal|2
ENEMY||Foe|2
JOY||Delight|2
FEAR||Dread|2
HOPE||Wish|2
LOVE||Adore|2
PEACE||Harmony|2
WAR||Battle|2
TRUTH||Fact|3
LIE||Fib|2
IDEA||Notion|3
DREAM||Vision|2
POWER||Might|3
SPEED||Pace|2
SKILL||Talent|3
WISDOM||Sagacity|3
ANSWER||Reply|2
QUESTION||Query|3
STORY||Tale|2
WORD||Term|3
ROAD||Street|2
PATH||Trail|2
CITY||Metropolis|2
VILLAGE||Hamlet|3
MARKET||Bazaar|3
RIVER||Stream|2
OCEAN||Sea|2
LAKE||Pond|2
FOREST||Woods|2
VALLEY||Dale|3
HILL||Mound|2
GOLD||Bullion|3
SILVER||Sterling|3
TREASURE||Riches|3
JOURNEY||Voyage|3
TRAVEL||Tour|3
BEGIN||Commence|3
FINISH||Complete|3
BUILD||Construct|3
CHOOSE||Pick|2
ASK||Inquire|3
RUN||Sprint|2
JUMP||Leap|2
WALK||Stroll|2
SING||Croon|3
DANCE||Waltz|3
SLEEP||Slumber|2
EAT||Dine|2
DRINK||Sip|2
LAUGH||Giggle|2
CRY||Weep|2
SMILE||Grin|2
SHOUT||Yell|2
WHISPER||Murmur|3
THINK||Ponder|3
LEARN||Study|2
TEACH||Instruct|3
HELP||Aid|2
GIVE||Donate|3
FIND||Discover|3
LOSE||Misplace|3
WIN||Triumph|2
SHINE||Glow|3
ROUGH||Coarse|3
SMOOTH||Sleek|3
CLEAN||Spotless|2
DIRTY||Filthy|2
HUNGRY||Starving|2
THIRSTY||Parched|3
TIRED||Weary|3
STRONG||Mighty|2
WEAK||Feeble|3
OLD||Aged|2
NEW||Fresh|2
YOUNG||Youthful|2
LATE||Tardy|3
DAWN||Sunrise|3
DUSK||Twilight|3
WINTER||Cold season|2
SUMMER||Hot season|2
AUTUMN||Fall|3
HONEST||Truthful|3
LOYAL||Faithful|3
HUMBLE||Modest|3
GENTLE||Tender|3
SILLY||Goofy|2
FUNNY||Comic|2
SCARY||Creepy|2
ODD||Strange|3
RARE||Uncommon|3
VAST||Immense|3
TINY||Minute|2
BRIGHT||Shiny|3
DARK||Unlit|2
EMPTY||Vacant|3
FULL||Filled|2
HEAVY||Weighty|3
SAFE||Secure|3
DANGER||Peril|3
VICTORY||Conquest|3
COURAGE||Valor|3
GLORY||Fame|3
HONOR||Respect|3
FREEDOM||Liberty|3
SECRET||Hidden fact|3
MYSTERY||Enigma|3
NOBLE||Dignified|3
FAMOUS||Renowned|3
ANCIENT||Very old|3
MODERN||Current|3
HUGE||Giant|2
NEAT||Tidy|3
SHY||Timid|3
LAZY||Idle|3
BUSY||Occupied|3
EAGER||Keen|3
WISE||Sage|3
`.trim().split('\n').map(function (line) {
  var p = line.split('|');
  return { w: p[0], e: p[1] || '', d: p[2], t: parseInt(p[3], 10), l: Array.from(p[0]) };
});

if (typeof module !== 'undefined') module.exports = WORD_DATA;
