export interface KnownCostcoProduct {
  productName: string;
  brand: string;
  category: string;
  description: string;
  packageDetails?: string;
}

// Built-in on-device dictionary of popular Costco items
export const KNOWN_COSTCO_CATALOG: Record<string, KnownCostcoProduct> = {
  // Popular staples
  '1142277': {
    productName: 'Kirkland Signature Organic Extra Virgin Olive Oil',
    brand: 'Kirkland Signature',
    category: 'Pantry & Grocery',
    description: 'Cold pressed organic extra virgin olive oil from Mediterranean olives.',
    packageDetails: '2 L (67.6 fl oz)',
  },
  '2010': {
    productName: 'Kirkland Signature Rotisserie Chicken',
    brand: 'Kirkland Signature',
    category: 'Fresh Deli & Meat',
    description: 'Fresh roasted whole seasoned rotisserie chicken, warm from the warehouse rotisserie oven.',
    packageDetails: 'Approx 3 lbs whole chicken',
  },
  '1462000': {
    productName: 'Kirkland Signature Bath Tissue',
    brand: 'Kirkland Signature',
    category: 'Household & Paper Goods',
    description: '2-ply premium embossed soft bath tissue, septic safe.',
    packageDetails: '30 Rolls (380 sheets/roll)',
  },
  '1319747': {
    productName: 'Kirkland Signature Create-a-Size Paper Towels',
    brand: 'Kirkland Signature',
    category: 'Household & Paper Goods',
    description: '2-ply thick and absorbent paper towels with custom tear-off sheet sizing.',
    packageDetails: '12 Rolls (160 sheets/roll)',
  },
  '1782294': {
    productName: 'Apple AirPods Pro (2nd Generation) with MagSafe Case (USB-C)',
    brand: 'Apple',
    category: 'Electronics & Audio',
    description: 'Active Noise Cancellation, Transparency mode, Adaptive Audio, and USB-C charging case.',
    packageDetails: 'Model MTJV3AM/A',
  },
  '1205': {
    productName: 'Kirkland Signature 1/4 lb Plus Hot Dog & 20 oz Drink',
    brand: 'Kirkland Signature',
    category: 'Food Court',
    description: 'Iconic all-beef quarter-pound hot dog with refillable 20 oz fountain beverage.',
    packageDetails: '1 Combo Meal',
  },
  '682544': {
    productName: 'Kirkland Signature Organic Pasture-Raised Grade A Large Eggs',
    brand: 'Kirkland Signature',
    category: 'Dairy & Eggs',
    description: 'Certified organic, pasture-raised Grade A large brown eggs with rich golden yolks.',
    packageDetails: '24 Count (2 Dozen)',
  },
  '9999901': {
    productName: 'Kirkland Signature Purified Drinking Water',
    brand: 'Kirkland Signature',
    category: 'Beverages & Water',
    description: 'Purified drinking water enhanced with minerals for a clean, pure taste.',
    packageDetails: '40 x 16.9 fl oz Bottles',
  },
  '845612': {
    productName: 'Kirkland Signature Thick Sliced Bacon',
    brand: 'Kirkland Signature',
    category: 'Meat & Poultry',
    description: 'Applewood smoked thick-cut sliced pork bacon, gluten free.',
    packageDetails: '3 lbs (2 x 1.5 lb packs)',
  },
  '1045231': {
    productName: 'Kirkland Signature Whole Fancy Salted Cashews',
    brand: 'Kirkland Signature',
    category: 'Snacks & Nuts',
    description: 'Fancy whole roasted cashews seasoned with sea salt.',
    packageDetails: '2.5 lbs (1.13 kg)',
  },
  '982314': {
    productName: 'Kirkland Signature Organic 85/15 Ground Beef',
    brand: 'Kirkland Signature',
    category: 'Fresh Meat',
    description: '100% grass-fed organic ground beef 85% lean 15% fat vacuum sealed bricks.',
    packageDetails: 'Approx 4 lbs (3 x 1.34 lb packs)',
  },
  '1423891': {
    productName: 'Kirkland Signature Ultra Clean Liquid Laundry Detergent',
    brand: 'Kirkland Signature',
    category: 'Household & Cleaning',
    description: 'Ultra clean concentrated laundry detergent, tough on stains, refreshing scent.',
    packageDetails: '194 fl oz (146 loads)',
  },
  // Gift Cards & Tickets (DoorDash, Air Canada, SkipTheDishes, Uber, etc.)
  '1005262': {
    productName: 'Uber 2 x $50 E-Gift Cards',
    brand: 'Uber',
    category: 'Gift Cards',
    description: 'Costco discounted Uber and Uber Eats electronic gift cards voucher package (2 x $50 cards).',
    packageDetails: '2 x $50 Digital E-Gift Cards ($100 Value)',
  },
  '1579294': {
    productName: 'DoorDash $100 eGift Card (4 x $25)',
    brand: 'DoorDash',
    category: 'Gift Cards',
    description: 'Costco discounted DoorDash food delivery electronic gift cards voucher bundle.',
    packageDetails: '4 x $25 Digital eGift Cards ($100 Value)',
  },
  '1456100': {
    productName: 'Air Canada $500 Electronic Gift Card',
    brand: 'Air Canada',
    category: 'Gift Cards',
    description: 'Costco discounted Air Canada airline flight travel electronic gift card voucher.',
    packageDetails: '$500 Electronic Travel Voucher',
  },
  '1694200': {
    productName: 'SkipTheDishes $100 Gift Card (2 x $50)',
    brand: 'SkipTheDishes',
    category: 'Gift Cards',
    description: 'Costco discounted SkipTheDishes food delivery electronic gift cards.',
    packageDetails: '2 x $50 Gift Cards ($100 Value)',
  },
  '1523400': {
    productName: 'Uber & Uber Eats $100 Gift Card (2 x $50)',
    brand: 'Uber',
    category: 'Gift Cards',
    description: 'Costco discounted Uber ride and Uber Eats food delivery electronic gift cards.',
    packageDetails: '2 x $50 Gift Cards ($100 Value)',
  },
  '1289410': {
    productName: 'Cineplex $50 Movie Gift Card with Free Popcorn',
    brand: 'Cineplex',
    category: 'Gift Cards',
    description: 'Costco discounted Cineplex movie theatre admission and concession gift card voucher.',
    packageDetails: 'Movie Voucher Bundle',
  },
  // User's Costco Canada items
  '30669': {
    productName: 'Fresh Bananas',
    brand: 'Costco Fresh Produce',
    category: 'Produce & Fresh Fruits',
    description: 'Fresh yellow premium bananas sourced daily.',
    packageDetails: '3 lb (1.36 kg) bunch',
  },
  '804449': {
    productName: 'Organic Baby Spinach',
    brand: 'Organic Produce',
    category: 'Produce & Fresh Vegetables',
    description: 'Fresh, washed, tender organic baby spinach leaves.',
    packageDetails: '312 g / 11 oz container',
  },
  '2880791': {
    productName: 'Kulfi Ice Cream Sticks (Tutti Frutti / Malai)',
    brand: 'Kulfi Treats',
    category: 'Frozen Desserts & Ice Cream',
    description: 'Authentic traditional South Asian dairy ice cream dessert on a stick.',
    packageDetails: '14 x 60 ml bars',
  },
  '1880791': {
    productName: 'Kulfi Ice Cream Sticks (Tutti Frutti / Malai)',
    brand: 'Kulfi Treats',
    category: 'Frozen Desserts & Ice Cream',
    description: 'Authentic traditional South Asian dairy ice cream dessert on a stick.',
    packageDetails: '14 x 60 ml bars',
  },
  '56366': {
    productName: 'Fresh Sweet Raspberries',
    brand: 'Costco Fresh Produce',
    category: 'Produce & Fresh Fruits',
    description: 'Plump, sweet freshly picked red raspberries.',
    packageDetails: '340 g / 12 oz clamshell',
  },
  '1126123': {
    productName: 'Silver Hills Sprouted Power Organic Soft Wheat Bread',
    brand: 'Silver Hills',
    category: 'Bakery & Bread',
    description: 'Organic sprouted whole wheat bread, high in fiber and nutrients.',
    packageDetails: '2 x 680 g loaves',
  },
  '1877587': {
    productName: 'Oikos Pro 0% Plain Greek Yogurt',
    brand: 'Oikos',
    category: 'Dairy & Yogurt',
    description: 'High protein plain Greek yogurt, 0% fat, rich and creamy.',
    packageDetails: '2 x 750 g tubs',
  },
  '55504': {
    productName: 'Kirkland Signature Fresh Split Chicken Wings',
    brand: 'Kirkland Signature',
    category: 'Fresh Meat & Poultry',
    description: 'Fresh chicken wings with wing tips removed, ready for oven roasting, grilling or frying.',
    packageDetails: 'Approx 2.2 kg tray',
  },
  '55502': {
    productName: 'Kirkland Signature Fresh Chicken Drumsticks',
    brand: 'Kirkland Signature',
    category: 'Fresh Meat & Poultry',
    description: 'Fresh plump bone-in chicken drumsticks.',
    packageDetails: 'Approx 2.8 kg tray',
  },
  '55506': {
    productName: 'Kirkland Signature Fresh Boneless Skinless Chicken Thighs',
    brand: 'Kirkland Signature',
    category: 'Fresh Meat & Poultry',
    description: 'Fresh trimmed boneless, skinless chicken thighs vacuum packed for freshness.',
    packageDetails: 'Approx 2 kg pack',
  },
  '311860': {
    productName: "Nonni's THINaddictives Cranberry Almond Thins",
    brand: "Nonni's",
    category: 'Snacks & Cookies',
    description: 'Artisan baked almond and cranberry thin cookies, low calorie snacking.',
    packageDetails: '690 g box',
  },
  '2212187': {
    productName: 'Fresh Lychee Fruit',
    brand: 'Costco Fresh Produce',
    category: 'Produce & Fresh Fruits',
    description: 'Sweet, juicy fresh tropical lychees.',
    packageDetails: '650 g / 1.43 lb pack',
  },
  '35521': {
    productName: 'Mini Seedless Watermelon',
    brand: 'Costco Fresh Produce',
    category: 'Produce & Fresh Fruits',
    description: 'Sweet, crisp personal-size seedless watermelon.',
    packageDetails: '1 Whole Melon',
  },
  '1879435': {
    productName: 'Frank And Oak Ladies Cardigan',
    brand: 'Frank And Oak',
    category: 'Apparel & Clothing',
    description: 'Soft knit comfortable modern cardigan with button front.',
    packageDetails: 'Ladies Sizes',
  },
  '2001911': {
    productName: 'Bench Unisex Slide Sandals',
    brand: 'Bench',
    category: 'Footwear & Apparel',
    description: 'Cushioned athletic slide sandals with durable traction outsole.',
    packageDetails: 'Unisex Size 11',
  },
  '1939202': {
    productName: 'LEGO FIFA Soccer Legends Building Set',
    brand: 'LEGO',
    category: 'Toys & Hobbies',
    description: 'Collectible soccer legends building kit for display and play.',
    packageDetails: 'LEGO Set',
  },
  '1699635': {
    productName: 'Itsumo Fresh Veggie Sushi Rolls',
    brand: 'Itsumo',
    category: 'Deli & Prepared Foods',
    description: 'Assorted vegetarian sushi rolls with pickled ginger and soy sauce.',
    packageDetails: '28 Piece / 731 g tray',
  },
  '1794181': {
    productName: 'Kirkland Signature Organic 0% Greek Yogurt',
    brand: 'Kirkland Signature',
    category: 'Dairy & Yogurt',
    description: 'Certified organic non-fat Greek yogurt, thick texture and high protein.',
    packageDetails: '1.36 kg tub',
  },
  '1953461': {
    productName: 'La Petite Bretonne Pure Butter French Madeleines',
    brand: 'La Petite Bretonne',
    category: 'Bakery & Pastries',
    description: 'Traditional shell-shaped French sponge cakes baked with pure butter.',
    packageDetails: '710 g tray',
  },
  '2309876': {
    productName: 'Thai Chili Mango Salad Kit 2-Pack',
    brand: 'Eat Smart',
    category: 'Produce & Prepared Salads',
    description: 'Crisp chopped vegetables and dried mango with tangy sweet Thai chili vinaigrette.',
    packageDetails: '2 x 347 g bags',
  },
  '7012740': {
    productName: "Kirkland Signature Men's Daily Multivitamins",
    brand: "Kirkland Signature",
    category: 'Health & Vitamins',
    description: "Complete daily multivitamin and multimineral supplement formulated specifically for men's wellness.",
    packageDetails: '365 Tablets',
  },
  '7013070': {
    productName: "Kirkland Signature Men's 50+ Multivitamins",
    brand: "Kirkland Signature",
    category: 'Health & Vitamins',
    description: "Tailored nutritional support with vitamins B, C, D, and minerals for men 50 and older.",
    packageDetails: '365 Tablets',
  },
  '7012750': {
    productName: "Kirkland Signature Women's Daily Multivitamins",
    brand: "Kirkland Signature",
    category: 'Health & Vitamins',
    description: "Complete daily multivitamin and mineral formula supporting bone and immune health for women.",
    packageDetails: '365 Tablets',
  },
  '1862725': {
    productName: 'Puck Cream Cheese Spread',
    brand: 'Puck',
    category: 'Dairy & Cheese',
    description: 'Rich, creamy and mild cream cheese spread, perfect on warm bread and bagels.',
    packageDetails: '910 g jar',
  },
  '3359955': {
    productName: 'GoGo squeeZ Organic Applesauce Variety Pack',
    brand: 'GoGo squeeZ',
    category: 'Snacks & Pantry',
    description: '100% real fruit squeezy applesauce pouches, gluten free, non-GMO.',
    packageDetails: '28 x 90 g pouches',
  },
  '1359955': {
    productName: 'GoGo squeeZ Organic Applesauce Variety Pack',
    brand: 'GoGo squeeZ',
    category: 'Snacks & Pantry',
    description: '100% real fruit squeezy applesauce pouches, gluten free, non-GMO.',
    packageDetails: '24 x 90 g pouches',
  },
  '1476500': {
    productName: 'Jockey Cotton Briefs 5-Pack',
    brand: 'Jockey',
    category: 'Apparel & Clothing',
    description: 'Breathable combed cotton briefs with stay-put waistband.',
    packageDetails: '5-Pack',
  },
  '2025773': {
    productName: 'Steamed Sweet Sticky Corn',
    brand: 'Costco Fresh',
    category: 'Produce & Vegetables',
    description: 'Tender vacuum-packed sweet glutinous sticky corn cobs.',
    packageDetails: '1.75 kg / 3.85 lb pack',
  },
  '1122924': {
    productName: 'Kirkland Signature Organic Whole Chia Seeds',
    brand: 'Kirkland Signature',
    category: 'Pantry & Superfoods',
    description: 'Certified organic black chia seeds rich in Omega-3, fiber, and protein.',
    packageDetails: '1.36 kg (3 lb) bag',
  },
  '1743473': {
    productName: 'Optimum Nutrition Gold Standard 100% Whey Protein Vanilla',
    brand: 'Optimum Nutrition',
    category: 'Health & Sports Nutrition',
    description: 'Primary source whey protein isolate with 24g protein and 5.5g BCAAs per scoop.',
    packageDetails: 'Vanilla Ice Cream Flavor',
  },
  '435259': {
    productName: 'Natrel 2% Fine-Filtered Milk',
    brand: 'Natrel',
    category: 'Dairy & Milk',
    description: 'Pure, fresh 2% partly skimmed fine-filtered pasteurized cow milk.',
    packageDetails: '4 L bag',
  },
  '458': {
    productName: '2% Partly Skimmed Fresh Milk',
    brand: 'Costco Dairy',
    category: 'Dairy & Milk',
    description: 'Fresh pasteurized 2% partly skimmed milk.',
    packageDetails: '4 L jug / bag',
  },
  '462': {
    productName: 'Homogenized 3.25% Whole Milk',
    brand: 'Costco Dairy',
    category: 'Dairy & Milk',
    description: 'Fresh pasteurized 3.25% whole milk.',
    packageDetails: '4 L jug / bag',
  },
  '24701': {
    productName: 'Häagen-Dazs Vanilla Milk Chocolate Almond Ice Cream Bars',
    brand: 'Häagen-Dazs',
    category: 'Frozen Desserts & Ice Cream',
    description: 'Creamy Madagascar vanilla ice cream dipped in rich milk chocolate and roasted almonds.',
    packageDetails: '9 x 88 ml bars',
  },
  '85': {
    productName: 'Diet Coke 32-Pack',
    brand: 'Coca-Cola',
    category: 'Beverages & Soda',
    description: 'Refreshing sugar-free calorie-free sparkling cola.',
    packageDetails: '32 x 355 ml cans',
  },
  '1570675': {
    productName: 'Eat Smart Sweet Kale Gourmet Salad Kit Duo',
    brand: 'Eat Smart',
    category: 'Produce & Fresh Salads',
    description: 'Kale, broccoli, Brussels sprouts, cabbage, pumpkin seeds, cranberries, and poppyseed dressing.',
    packageDetails: '2 x 14 oz bags',
  },
  '1654338': {
    productName: 'SpongeTowels Ultra Pro Paper Towels',
    brand: 'SpongeTowels',
    category: 'Household & Paper Goods',
    description: 'Ultra absorbent premium paper towels with Sponge Pocket technology.',
    packageDetails: '12 Rolls',
  },
  '2012486': {
    productName: 'Buffalo David Bitton Genuine Leather Tote Bag',
    brand: 'Buffalo David Bitton',
    category: 'Luggage & Accessories',
    description: 'Supple genuine pebble leather tote with interior organizers and shoulder drop.',
    packageDetails: 'Black Leather',
  },
  '1472103': {
    productName: 'Travaglini 100% Pure Avocado Oil',
    brand: 'Travaglini',
    category: 'Pantry & Cooking Oils',
    description: 'Naturally refined non-GMO avocado oil with a high smoke point of 500°F.',
    packageDetails: '3 L bottle',
  },
  '1981397': {
    productName: 'Mondetta Ladies Performance Athletic Skort',
    brand: 'Mondetta',
    category: 'Apparel & Sportswear',
    description: 'Moisture wicking lightweight golf and tennis skirt with built-in compression shorts.',
    packageDetails: 'Ladies Sizes',
  },
  '1424970': {
    productName: 'Cashmere Premium 2-Ply Bathroom Tissue',
    brand: 'Cashmere',
    category: 'Household & Paper Goods',
    description: 'Ultra soft, hypoallergenic and septic safe bathroom tissue.',
    packageDetails: '40 Rolls x 250 Sheets',
  },
  '106707': {
    productName: 'Gourmet French Brioche Burger Buns',
    brand: 'Costco Bakery',
    category: 'Bakery & Bread',
    description: 'Golden, buttery, lightly sweet French brioche buns.',
    packageDetails: 'Pack of 12 buns',
  },
  '1872209': {
    productName: 'Intex Inflatable Family Lounge Pool with Built-in Bench',
    brand: 'Intex',
    category: 'Seasonal & Outdoors',
    description: 'Inflatable backyard family wading pool with cushioned backrest and seats.',
    packageDetails: 'Family Size',
  },
  '6789239': {
    productName: 'JISULIFE Handheld Rechargeable Portable Fan',
    brand: 'JISULIFE',
    category: 'Electronics & Gadgets',
    description: 'Ultra-portable 3-in-1 rechargeable mini fan, flashlight, and emergency power bank.',
    packageDetails: 'USB-C Rechargeable',
  },
  '1993109': {
    productName: 'Chefman Crispinator 7.5L Digital Air Fryer with Viewing Window',
    brand: 'Chefman',
    category: 'Kitchen Appliances',
    description: 'Extra-large 7.5L capacity digital air fryer with interior light and easy-clean basket.',
    packageDetails: '7.5 Liter Capacity',
  },
  '1939700': {
    productName: 'Matty M Ladies Pull-On Stretch Ankle Pants',
    brand: 'Matty M',
    category: 'Apparel & Clothing',
    description: 'Versatile slim-leg pull-on comfort trousers with stretch waistband.',
    packageDetails: 'Ladies Sizing',
  },
  '580517': {
    productName: 'Kirkland Signature Create-a-Size Paper Towels 12-Pack',
    brand: 'Kirkland Signature',
    category: 'Household & Paper Goods',
    description: 'Thick, absorbent, 2-ply perforated sheets for custom mess cleanup.',
    packageDetails: '12 Rolls x 160 Sheets',
  },
  '3875466': {
    productName: 'NaturSource Organic Salad Topper Crunch',
    brand: 'NaturSource',
    category: 'Pantry & Salad Add-ins',
    description: 'Nutrient-rich crunch mix of organic pumpkin seeds, cranberries, and sunflower kernels.',
    packageDetails: '1 kg resealable bag',
  },
  '419980': {
    productName: "Children's Tylenol Pain & Fever Oral Liquid Relief",
    brand: 'Tylenol',
    category: 'Health & Medicine',
    description: 'Pediatrician recommended fever reducer and pain reliever for kids ages 2-11.',
    packageDetails: '3 x 100 ml bottles',
  },
  '419920': {
    productName: "Infants' Tylenol Liquid Drops Fever & Pain",
    brand: 'Tylenol',
    category: 'Health & Medicine',
    description: 'Gentle infant formula acetaminophen fever reducer with dosing syringe.',
    packageDetails: '2 x 24 ml bottles',
  },
  '679131': {
    productName: 'Kirkland Signature 100% Pure Organic Maple Syrup Grade A Amber',
    brand: 'Kirkland Signature',
    category: 'Pantry & Breakfast',
    description: '100% pure Grade A amber rich taste Canadian organic maple syrup.',
    packageDetails: '1 L jug',
  },
  '1120945': {
    productName: 'Kirkland Signature Fine Ground Himalayan Pink Salt',
    brand: 'Kirkland Signature',
    category: 'Pantry & Spices',
    description: 'Pure, unrefined, mineral-rich pink salt mined from the Himalayan mountains.',
    packageDetails: '2.27 kg (5 lb) tub',
  },
  '361811': {
    productName: 'Coors Light Cold-Filtered Lager Beer 60-Pack',
    brand: 'Coors Light',
    category: 'Beer & Beverages',
    description: 'Cold-conditioned, cold-filtered American light lager in easy-chilling cans.',
    packageDetails: '60 x 355 ml cans',
  },
  '2446056': {
    productName: 'Scotties Premium 2-Ply Facial Tissue 21-Pack',
    brand: 'Scotties',
    category: 'Household & Paper Goods',
    description: 'Soft and strong 2-ply facial tissues in decorative household cube boxes.',
    packageDetails: '21 Boxes x 126 Tissues',
  },
  '3113215': {
    productName: 'MSI Modern 15 Laptop (Intel Core Ultra 5, 32GB RAM, 1TB SSD)',
    brand: 'MSI',
    category: 'Computers & Laptops',
    description: '15.6" FHD laptop with Intel Core Ultra 5 125H, 32GB DDR5, 1TB NVMe SSD, and Windows 11.',
    packageDetails: 'Model C1MOG-275CA',
  },
  '1850185': {
    productName: 'Acer Swift 14 AI Laptop (Intel Core Ultra 9, 32GB RAM, 1TB SSD)',
    brand: 'Acer',
    category: 'Computers & Laptops',
    description: '14" 2.8K OLED laptop with Intel Core Ultra 9 185H, 32GB LPDDR5X, and 1TB SSD.',
    packageDetails: 'Model A14-52MT-957R',
  },
  '2140033': {
    productName: 'HP 15.6" Laptop (AMD Ryzen 7120U, 8GB RAM, 512GB SSD)',
    brand: 'HP',
    category: 'Computers & Laptops',
    description: 'Everyday computing 15.6" laptop with AMD Athlon/Ryzen processor and fast SSD.',
    packageDetails: 'Model 15-FC0033C',
  },
  '2833755': {
    productName: 'Philips 3200 Series Fully Automatic Espresso Machine with LatteGo',
    brand: 'Philips',
    category: 'Kitchen Appliances & Coffee',
    description: 'One-touch bean-to-cup espresso machine with innovative LatteGo milk frother.',
    packageDetails: 'Model EP3246/74',
  },
  '1300658': {
    productName: 'Kirkland Signature Fresh Scent Flex-Tech Kitchen Trash Bags',
    brand: 'Kirkland Signature',
    category: 'Household & Cleaning',
    description: '13-gallon tear-resistant drawstring trash bags with odor neutralizing scent.',
    packageDetails: '200 Bags',
  },
  '427367': {
    productName: 'Philadelphia Cream Cheese Soft Spread Duo',
    brand: 'Philadelphia',
    category: 'Dairy & Cheese',
    description: 'Original creamy soft cream cheese spread made with fresh milk and cream.',
    packageDetails: '2 x 500 g tubs',
  },
  '5552410': {
    productName: 'Kicking Horse Three Sisters Organic Whole Bean Coffee',
    brand: 'Kicking Horse Coffee',
    category: 'Pantry & Coffee',
    description: 'Medium roast fair-trade and organic whole bean coffee with notes of cocoa and toasted hazelnut.',
    packageDetails: '1 kg (2.2 lb) bag',
  },
  '493389': {
    productName: 'Lavazza Qualità Oro 100% Arabica Whole Bean Coffee',
    brand: 'Lavazza',
    category: 'Pantry & Coffee',
    description: 'Classic Italian medium roast Arabica coffee beans with floral and fruity aromatic notes.',
    packageDetails: '1 kg bag',
  },
  '1728676': {
    productName: 'Gourmia 7-Quart Digital Air Fryer with FryForce 360',
    brand: 'Gourmia',
    category: 'Kitchen Appliances',
    description: 'Digital 12-preset air fryer with viewing window and non-stick basket.',
    packageDetails: 'Model GAF799 (7 Qt)',
  },
  '1887027': {
    productName: 'Wayne Gretzky Estates Brut Sparkling Wine VQA',
    brand: 'Wayne Gretzky Estates',
    category: 'Wine & Spirits',
    description: 'Crisp, lively Canadian VQA sparkling wine with pear and green apple notes.',
    packageDetails: '750 ml bottle',
  },
  '1888380': {
    productName: 'Bouchard Dubai Style Pistachio Knafeh Dark Chocolate',
    brand: 'Bouchard',
    category: 'Snacks & Chocolates',
    description: 'Decadent chocolate filled with crispy toasted knafeh kataifi and velvety pistachio cream.',
    packageDetails: '454 g pouch',
  },
  '3333015': {
    productName: 'Gourmia 11-Quart Dual Basket Digital Air Fryer',
    brand: 'Gourmia',
    category: 'Kitchen Appliances',
    description: 'Dual-zone independent cooking baskets with Smart Finish synchronization.',
    packageDetails: '11 Quart Dual-Zone',
  },
  '1441421': {
    productName: 'Michelin X-Ice Snow SUV Winter Tires 255/45R20 105T XL',
    brand: 'Michelin',
    category: 'Tires & Automotive',
    description: 'Premium winter tires engineered for superior traction on snow and ice with extended tread life.',
    packageDetails: 'Set of 4 Tires (255/45R20)',
  },
  '1704136': {
    productName: '3M Command Picture Hanging Strips Variety Pack',
    brand: '3M Command',
    category: 'Hardware & Home Improvement',
    description: 'Damage-free wall mounting strips holding up to 16 lbs without nails or tools.',
    packageDetails: 'Multi-Pack',
  },
  '1654593': {
    productName: 'Mac Sports Collapsible Folding Utility Wagon',
    brand: 'Mac Sports',
    category: 'Sporting Goods & Outdoor',
    description: 'Heavy duty folding steel wagon with 150 lb capacity for groceries, beach, and camping.',
    packageDetails: 'Collapsible Frame',
  },
  '1400953': {
    productName: 'Simple Mills Almond Flour Sea Salt Crackers',
    brand: 'Simple Mills',
    category: 'Snacks & Crackers',
    description: 'Wholesome gluten-free crackers made with almond flour, sunflower seeds, and flax seeds.',
    packageDetails: '482 g box',
  },
  '1948305': {
    productName: 'Comvita Manuka Honey UMF 12+ (MGO 356+)',
    brand: 'Comvita',
    category: 'Pantry & Health Foods',
    description: 'Certified raw monofloral New Zealand Manuka honey with guaranteed UMF 12+ potency.',
    packageDetails: '500 g jar',
  },
  '1386': {
    productName: 'Zavida 100% Colombian Whole Bean Coffee',
    brand: 'Zavida',
    category: 'Pantry & Coffee',
    description: 'Rainforest Alliance certified rich medium-dark roast 100% Colombian coffee.',
    packageDetails: '907 g (2 lb) bag',
  },
  '1460350': {
    productName: "Rao's Homemade All Natural Marinara Sauce",
    brand: "Rao's",
    category: 'Pantry & Pasta Sauce',
    description: 'Slow-simmered Italian plum tomato sauce with sweet olive oil, garlic, and basil.',
    packageDetails: '2 x 770 ml jars',
  },
  '1796228': {
    productName: 'Columbia Plush Sherpa Throw Blanket',
    brand: 'Columbia',
    category: 'Home & Bedding',
    description: 'Ultra-warm reversible plush fleece and sherpa blanket.',
    packageDetails: '60" x 70"',
  },
  '1625149': {
    productName: 'Duracell Alkaline AA Batteries Power Boost 40-Pack',
    brand: 'Duracell',
    category: 'Household & Hardware',
    description: 'Long-lasting alkaline AA batteries with power boost ingredients.',
    packageDetails: '40 Batteries',
  },
  '1791272': {
    productName: 'Roborock Q Revo Robot Vacuum and Mop with Auto-Empty Dock',
    brand: 'Roborock',
    category: 'Smart Home & Appliances',
    description: 'Advanced dual-spinning mop robot vacuum with 5500Pa suction and self-washing dock.',
    packageDetails: 'Model QX Revo',
  },
  '8877550': {
    productName: 'iRobot Roomba j8+ Self-Emptying Robot Vacuum',
    brand: 'iRobot Roomba',
    category: 'Smart Home & Appliances',
    description: 'PrecisionVision obstacle avoidance with Clean Base automatic dirt disposal.',
    packageDetails: 'Roomba j8+',
  },
  '49118': {
    productName: 'Fresh Gala Apples',
    brand: 'Costco Fresh Produce',
    category: 'Produce & Fresh Fruits',
    description: 'Crisp, aromatic sweet red Gala apples.',
    packageDetails: '2.72 kg (6 lb) bag',
  },
  '214203': {
    productName: 'Fresh Ambrosia Apples',
    brand: 'Costco Fresh Produce',
    category: 'Produce & Fresh Fruits',
    description: 'Sweet, honeyed, low-acid Canadian fresh Ambrosia apples.',
    packageDetails: '2.72 kg (6 lb) bag',
  },
  '47825': {
    productName: 'Fresh Green Seedless Grapes',
    brand: 'Costco Fresh Produce',
    category: 'Produce & Fresh Fruits',
    description: 'Plump, sweet and crisp seedless green table grapes.',
    packageDetails: '1.36 kg / 3 lb clamshell',
  },
  '355463': {
    productName: 'Vine-Ripened Cluster Tomatoes',
    brand: 'Costco Fresh Produce',
    category: 'Produce & Fresh Vegetables',
    description: 'Juicy, fragrant greenhouse tomatoes on the vine.',
    packageDetails: '1.36 kg / 3 lb pack',
  },
  '22690': {
    productName: 'Fresh Sweet Papaya',
    brand: 'Costco Fresh Produce',
    category: 'Produce & Fresh Fruits',
    description: 'Tropical ripe sweet papaya with vibrant orange flesh.',
    packageDetails: '1 Whole Papaya',
  },
  '647465': {
    productName: 'Fresh Hass Avocados',
    brand: 'Costco Fresh Produce',
    category: 'Produce & Fresh Vegetables',
    description: 'Creamy Hass avocados, rich in healthy monounsaturated fats.',
    packageDetails: 'Pack of 6 Avocados',
  },
  '1493488': {
    productName: 'Kirkland Signature Fragrance-Free Baby Wipes',
    brand: 'Kirkland Signature',
    category: 'Baby Care & Diapers',
    description: 'Ultra-soft, plant-based hypoallergenic baby wipes with Vitamin E and Aloe.',
    packageDetails: '900 Wipes (9 packs x 100)',
  },
  '1920495': {
    productName: 'Kirkland Signature Size 6 Diapers',
    brand: 'Kirkland Signature',
    category: 'Baby Care & Diapers',
    description: 'Breathable, ultra-absorbent hypoallergenic baby diapers with wetness indicator.',
    packageDetails: '132 Diapers',
  },
  '1842944': {
    productName: 'Kendamil Infant Formula Milk Powder',
    brand: 'Kendamil',
    category: 'Baby Care & Nutrition',
    description: 'Classic British whole milk infant formula with prebiotics and plant-based DHA.',
    packageDetails: '800 g can',
  },
  '1789516': {
    productName: 'Kendamil Infant Formula Milk Powder',
    brand: 'Kendamil',
    category: 'Baby Care & Nutrition',
    description: 'Classic British whole milk infant formula with prebiotics and plant-based DHA.',
    packageDetails: '800 g can',
  },
  '1397227': {
    productName: 'Flourish Protein Pancake & Waffle Mix',
    brand: 'Flourish',
    category: 'Pantry & Breakfast',
    description: 'High protein, high fiber non-GMO pancake mix with zero added sugar.',
    packageDetails: '1 kg bag',
  },
  '682': {
    productName: 'Krusteaz Buttermilk Pancake Mix',
    brand: 'Krusteaz',
    category: 'Pantry & Breakfast',
    description: 'Classic light and fluffy buttermilk pancake mix, just add water.',
    packageDetails: '4.53 kg (10 lb) bag',
  },
  '1726089': {
    productName: 'Kirkland Signature House Blend Whole Bean Coffee',
    brand: 'Kirkland Signature',
    category: 'Pantry & Coffee',
    description: 'Custom roasted by Starbucks, medium roast whole bean Arabica blend.',
    packageDetails: '1.13 kg (2.5 lb) bag',
  },
  '2382611': {
    productName: 'Nestlé Kit Kat Ice Cream Bars 20-Pack',
    brand: 'Nestlé',
    category: 'Frozen Desserts & Ice Cream',
    description: 'Crispy wafer and chocolate frozen dessert bars.',
    packageDetails: '20 x 80 ml bars',
  },
};

// Common Costco receipt abbreviations to human-readable terms
const ABBREVIATIONS: Record<string, string> = {
  KS: 'Kirkland Signature',
  KIRKLAND: 'Kirkland Signature',
  ORG: 'Organic',
  ORGANIC: 'Organic',
  EVOO: 'Extra Virgin Olive Oil',
  CHK: 'Chicken',
  CHKN: 'Chicken',
  CHICKEN: 'Chicken',
  BEEF: 'Ground Beef',
  STK: 'Steak',
  SLMN: 'Salmon',
  BTH: 'Bath',
  TISS: 'Tissue',
  TISSUE: 'Bath Tissue',
  TWL: 'Paper Towels',
  TOWEL: 'Paper Towels',
  WTR: 'Drinking Water',
  WATER: 'Purified Water',
  DET: 'Laundry Detergent',
  DTRG: 'Detergent',
  SOAP: 'Hand Soap',
  EGG: 'Grade A Eggs',
  EGGS: 'Grade A Eggs',
  MILK: 'Whole Milk',
  ALM: 'Whole Almonds',
  CSHW: 'Cashews',
  BACN: 'Thick Cut Bacon',
  BACON: 'Thick Cut Bacon',
  COF: 'Whole Bean Coffee',
  COFFEE: 'Ground Coffee',
  BAGL: 'Water Bagels',
  PIZZA: 'Costco Food Court Pizza',
  HOTDOG: 'Hot Dog & Drink',
  HDOG: 'Hot Dog & Drink',
  WEDGE: 'Golf Wedge Set',
  BALLS: 'Performance Golf Balls',
  VAC: 'Cordless Vacuum',
  JGR: 'Jogger Pants',
  JOGGER: 'Jogger Pants',
  PANT: 'Pants',
  TEE: 'T-Shirt',
  ROBE: 'Dress',
  HOODI: 'Hoodie',
  FLC: 'Fleece',
  DISHCLOTH: 'Kitchen Dishcloths',
  SPGTOWEL: 'SpongeTowels Paper Towels',
  BALSAMIC: 'Balsamic Cream Glaze',
  CRAISINS: 'Ocean Spray Dried Cranberries',
};

// 100% Client-side resolver
export function resolveCostcoItemDetails(itemId: string, rawName: string): {
  productName: string;
  brand: string;
  category: string;
  description: string;
  packageDetails: string;
  webSourceUrl: string;
} {
  const cleanId = (itemId || '').replace(/[^a-zA-Z0-9]/g, '');

  // 1. Direct Catalog Match
  if (KNOWN_COSTCO_CATALOG[cleanId]) {
    const item = KNOWN_COSTCO_CATALOG[cleanId];
    return {
      productName: item.productName,
      brand: item.brand,
      category: item.category,
      description: item.description,
      packageDetails: item.packageDetails || '',
      webSourceUrl: `https://www.google.com/search?q=Costco+item+${encodeURIComponent(cleanId)}`,
    };
  }

  // 1.5 Special Gift Card Heuristic Check (DoorDash, Air Canada, SkipTheDishes, Uber, etc.)
  const rawUpper = (rawName || '').toUpperCase();
  if (
    rawUpper.includes('DOORDASH') ||
    rawUpper.includes('DOOR DASH') ||
    rawUpper.includes('AIRCANADA') ||
    rawUpper.includes('AIR CANADA') ||
    rawUpper.includes('AIR CAN') ||
    rawUpper.includes('SKIPTHEDISHES') ||
    rawUpper.includes('SKIP THE DISHES') ||
    rawUpper.includes('SKIP DISH') ||
    rawUpper.includes('UBER') ||
    rawUpper.includes('CINEPLEX') ||
    rawUpper.includes('STARBUCKS') ||
    rawUpper.includes('GIFT CARD') ||
    rawUpper.includes('EGIFT') ||
    rawUpper.includes('VOUCHER') ||
    /\bGC\b/.test(rawUpper)
  ) {
    let brand = 'Costco Gift Card';
    let prod = rawName;
    if (rawUpper.includes('DOORDASH') || rawUpper.includes('DOOR DASH')) {
      brand = 'DoorDash';
      prod = 'DoorDash $100 eGift Card (4 x $25)';
    } else if (rawUpper.includes('AIR CANADA') || rawUpper.includes('AIRCANADA') || rawUpper.includes('AIR CAN')) {
      brand = 'Air Canada';
      prod = 'Air Canada $500 Electronic Gift Card';
    } else if (rawUpper.includes('SKIPTHEDISHES') || rawUpper.includes('SKIP THE DISHES') || rawUpper.includes('SKIP')) {
      brand = 'SkipTheDishes';
      prod = 'SkipTheDishes $100 Gift Card (2 x $50)';
    } else if (rawUpper.includes('UBER')) {
      brand = 'Uber';
      prod = 'Uber & Uber Eats $100 Gift Card (2 x $50)';
    } else if (rawUpper.includes('CINEPLEX')) {
      brand = 'Cineplex';
      prod = 'Cineplex Movie Gift Card & Concession Voucher';
    } else if (rawUpper.includes('STARBUCKS')) {
      brand = 'Starbucks';
      prod = 'Starbucks $50 Gift Card Multipack';
    } else {
      prod = `${rawName} Gift Card`;
    }

    return {
      productName: prod,
      brand,
      category: 'Gift Cards',
      description: `Wholesale discounted ${brand} electronic gift card voucher.`,
      packageDetails: 'Digital / Physical Gift Card',
      webSourceUrl: `https://www.google.com/search?q=Costco+${encodeURIComponent(brand)}+Gift+Card`,
    };
  }

  // 2. Intelligent client-side abbreviation expansion
  const words = (rawName || '').split(/[\s,._/-]+/).filter(Boolean);
  const expandedWords: string[] = [];
  let detectedBrand = '';
  let detectedCategory = 'General Merchandise';

  words.forEach((w) => {
    const upper = w.toUpperCase();
    if (upper === 'KS' || upper === 'KIRKLAND') {
      detectedBrand = 'Kirkland Signature';
      expandedWords.push('Kirkland Signature');
    } else if (ABBREVIATIONS[upper]) {
      expandedWords.push(ABBREVIATIONS[upper]);
    } else {
      // Title-case standard words
      expandedWords.push(w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    }

    // Heuristic categorization
    if (['EVOO', 'OIL', 'SAUCE', 'ORG', 'ORGANIC', 'COF', 'COFFEE', 'ALM', 'CSHW', 'SUGAR', 'SALT', 'HONEY', 'SYRUP', 'OATS', 'CHIA', 'QUINOA', 'PESTO', 'FLOUR', 'PANCAKE'].includes(upper)) {
      detectedCategory = 'Pantry & Grocery';
    } else if (['CHK', 'CHKN', 'BEEF', 'STK', 'SLMN', 'BACN', 'BACON', 'MEAT', 'WING', 'WINGS', 'DRUMSTICK', 'TACO', 'SUSHI'].includes(upper)) {
      detectedCategory = 'Fresh Meat & Deli';
    } else if (['TISS', 'TISSUE', 'TWL', 'TOWEL', 'DET', 'DTRG', 'SOAP', 'BATH', 'WIPE', 'WIPES', 'BAG', 'BAGS', 'SCRUB', 'CLEANER'].includes(upper)) {
      detectedCategory = 'Household & Cleaning';
    } else if (['MILK', 'EGG', 'EGGS', 'CHEESE', 'YOGURT', 'YOG', 'BUTTER', 'OIKOS'].includes(upper)) {
      detectedCategory = 'Dairy & Refrigerated';
    } else if (['BANANAS', 'SPINACH', 'RASPBERRIES', 'BERRIES', 'APPLES', 'MELON', 'MANGO', 'LYCHEE', 'TOMATOES', 'ONIONS', 'AVOCADOS', 'KIWI', 'GRAPES'].includes(upper)) {
      detectedCategory = 'Produce & Fresh Fruits';
    } else if (['APPLE', 'SONOS', 'TV', 'WATCH', 'IPAD', 'AIRPODS', 'AUDIO', 'LAPTOP', 'MSI', 'ACER', 'HP', 'FAN'].includes(upper)) {
      detectedCategory = 'Electronics & Technology';
    } else if (['TEE', 'PANT', 'SHOE', 'SLIDE', 'CARDIGAN', 'PARKA', 'JACKET', 'HOODIE', 'JOGGER', 'BRIEFS', 'BOXERS'].includes(upper)) {
      detectedCategory = 'Apparel & Clothing';
    } else if (['VITAMIN', 'MULTIVITAMIN', 'TYLENOL', 'PROTEIN', 'MAGNESIUM', 'CLARITIN'].includes(upper)) {
      detectedCategory = 'Health & Pharmacy';
    } else if (['BEER', 'WINE', 'COORS', 'PROSECCO', 'COKE'].includes(upper)) {
      detectedCategory = 'Beverages & Alcohol';
    } else if (['LEGO', 'TOY', 'PLUSH', 'GAME', 'CHEF'].includes(upper)) {
      detectedCategory = 'Toys & Entertainment';
    }
  });

  let resolvedName = expandedWords.join(' ');
  // Remove duplicate "Kirkland Signature Kirkland Signature"
  resolvedName = resolvedName.replace(/Kirkland Signature Kirkland Signature/gi, 'Kirkland Signature');

  if (!resolvedName) {
    resolvedName = cleanId ? `Costco Item #${cleanId}` : 'Costco Merchandise';
  }

  if (!detectedBrand) {
    detectedBrand = resolvedName.includes('Kirkland Signature') ? 'Kirkland Signature' : 'Costco Merchandise';
  }

  return {
    productName: resolvedName,
    brand: detectedBrand,
    category: detectedCategory,
    description: `Costco warehouse item #${cleanId || 'N/A'} (${rawName || resolvedName})`,
    packageDetails: '',
    webSourceUrl: `https://www.google.com/search?q=Costco+item+${encodeURIComponent(cleanId || resolvedName)}`,
  };
}
