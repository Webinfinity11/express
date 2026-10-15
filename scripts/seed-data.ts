export type Category = { id: string; name: string; image: string };

export type Product = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  label: string;
  category: string;
  brand: string;
  price: number;
  oldPrice: number;
  image: string;
  gallery: string[];
  scene: string;
  color: string;
  tone: string;
  subtitle: string;
  desc: string;
  specs: [string, string][];
  featured: boolean;
  isNew: boolean;
  keywords: string;
};

export const CATEGORIES: Category[] = [
  { id: "fridges", name: "მაცივრები", image: "/images/cat-fridges.webp" },
  { id: "washers", name: "სარეცხი მანქანები", image: "/images/cat-washers.webp" },
  { id: "ovens", name: "ღუმელები", image: "/images/cat-ovens.webp" },
  { id: "vacuums", name: "მტვერსასრუტები", image: "/images/cat-vacuums.webp" },
  { id: "kitchen", name: "სამზარეულოს ტექნიკა", image: "/images/cat-kitchen.webp" },
  { id: "microwaves", name: "მიკროტალღური", image: "/images/cat-microwaves.webp" },
  { id: "irons", name: "უთოები", image: "/images/cat-irons.webp" },
  { id: "blenders", name: "ბლენდერები", image: "/images/cat-blenders.webp" },
];

// საწყისი (დემო) კატალოგი — მხოლოდ scripts/seed.ts-ისთვის
export const PRODUCTS: Product[] = [
  {
    "id": "iron",
    "slug": "franko-premier-2-in-1",
    "sku": "EM-IR-002",
    "name": "Franko Premier 2-in-1",
    "label": "ორთქლის უთო",
    "category": "irons",
    "brand": "Franko",
    "price": 399,
    "oldPrice": 499,
    "image": "/images/cat-irons.webp",
    "gallery": [
      "/images/cat-irons.webp",
      "/images/promo-iron.webp"
    ],
    "scene": "/images/promo-iron.webp",
    "color": "შავი / ოქროსფერი",
    "tone": "#a68b60",
    "subtitle": "იდეალური ზრუნვა ყველა დეტალზე.",
    "desc": "ყოველდღიური მოვლა უფრო მარტივად. დახვეწილი შავი და ოქროსფერი დიზაინი და ორი ფორმატი თქვენი ტანსაცმლისთვის.",
    "specs": [
      [
        "ტიპი",
        "2-in-1"
      ],
      [
        "გამოყენება",
        "ტანსაცმლის მოვლა"
      ],
      [
        "ფერი",
        "შავი / ოქროსფერი"
      ],
      [
        "მართვა",
        "მექანიკური"
      ]
    ],
    "featured": true,
    "isNew": false,
    "keywords": "iron steam უთო ორთქლი утюг"
  },
  {
    "id": "washer",
    "slug": "toshiba-washing-machine",
    "sku": "EM-WM-001",
    "name": "Toshiba სარეცხი მანქანა",
    "label": "სარეცხი მანქანა",
    "category": "washers",
    "brand": "Toshiba",
    "price": 1299,
    "oldPrice": 1599,
    "image": "/images/cat-washers.webp",
    "gallery": [
      "/images/cat-washers.webp",
      "/images/hero-washer.webp",
      "/images/washer-2.webp"
    ],
    "scene": "/images/hero-washer.webp",
    "color": "გრაფიტისფერი",
    "tone": "#424649",
    "subtitle": "მეტი სისუფთავე. ნაკლები საზრუნავი.",
    "desc": "იზრუნეთ საყვარელ ტანსაცმელზე და დაუთმეთ მეტი დრო იმას, რაც გიყვართ. კომპაქტური მართვის პანელი და თანამედროვე დიზაინი მარტივად ერგება თქვენი სახლის ინტერიერს.",
    "specs": [
      [
        "ჩატვირთვა",
        "8 კგ"
      ],
      [
        "ბრუნვის სიჩქარე",
        "1 400 ბრ/წთ"
      ],
      [
        "ძრავა",
        "ინვერტორული"
      ],
      [
        "მართვა",
        "ელექტრონული"
      ]
    ],
    "featured": true,
    "isNew": true,
    "keywords": "washer washing machine laundry стиральная машина სარეცხი"
  },
  {
    "id": "juicer",
    "slug": "franko-citrus-juicer",
    "sku": "EM-JC-003",
    "name": "Franko ციტრუსის საწური",
    "label": "ციტრუსის საწური",
    "category": "kitchen",
    "brand": "Franko",
    "price": 189,
    "oldPrice": 249,
    "image": "/images/juicer.webp",
    "gallery": [
      "/images/juicer.webp",
      "/images/promo-kitchen.webp"
    ],
    "scene": "/images/promo-kitchen.webp",
    "color": "ვერცხლისფერი / შავი",
    "tone": "#9a9a97",
    "subtitle": "ახალი დღე. ახალი ენერგია.",
    "desc": "თქვენი საყვარელი ციტრუსის გემოები და დილის ახალი რიტუალი. მარტივი ფორმა, დახვეწილი მეტალის ზედაპირი და მეტი კომფორტი სამზარეულოში.",
    "specs": [
      [
        "ტიპი",
        "ციტრუსის საწური"
      ],
      [
        "კორპუსი",
        "მეტალი / პლასტმასი"
      ],
      [
        "გამოყენება",
        "ციტრუსი"
      ],
      [
        "ფერი",
        "ვერცხლისფერი"
      ]
    ],
    "featured": true,
    "isNew": true,
    "keywords": "juicer juice citrus соковыжималка წვენსაწური ციტრუსი"
  },
  {
    "id": "kettle",
    "slug": "electric-kettle",
    "sku": "EM-HK-004",
    "name": "ელექტრო ჩაიდანი",
    "label": "ელექტრო ჩაიდანი",
    "category": "kitchen",
    "brand": "Express Mix",
    "price": 129,
    "oldPrice": 179,
    "image": "/images/cat-kitchen.webp",
    "gallery": [
      "/images/cat-kitchen.webp"
    ],
    "scene": "/images/story-kitchen.webp",
    "color": "შავი / ვერცხლისფერი",
    "tone": "#575958",
    "subtitle": "თქვენი ყოველდღიური დამხმარე.",
    "desc": "შეარჩიეთ ტექნიკა, რომელიც თქვენი სახლის ყოველდღიურობას უფრო კომფორტულს ხდის. პროდუქტის ინფორმაცია და მახასიათებლები ნაჩვენებია დიზაინის დემონსტრაციისთვის.",
    "specs": [
      [
        "კატეგორია",
        "სამზარეულოს ტექნიკა"
      ],
      [
        "გამოყენება",
        "სახლისთვის"
      ],
      [
        "კოლექცია",
        "Home & Kitchen"
      ],
      [
        "მოდელი",
        "სატესტო"
      ]
    ],
    "featured": true,
    "isNew": false,
    "keywords": "kettle tea чайник ჩაიდანი"
  },
  {
    "id": "microwave",
    "slug": "microwave-oven",
    "sku": "EM-HK-005",
    "name": "მიკროტალღური ღუმელი",
    "label": "მიკროტალღური ღუმელი",
    "category": "microwaves",
    "brand": "Express Mix",
    "price": 229,
    "oldPrice": 299,
    "image": "/images/cat-microwaves.webp",
    "gallery": [
      "/images/cat-microwaves.webp"
    ],
    "scene": "/images/story-kitchen.webp",
    "color": "შავი / ვერცხლისფერი",
    "tone": "#575958",
    "subtitle": "თქვენი ყოველდღიური დამხმარე.",
    "desc": "შეარჩიეთ ტექნიკა, რომელიც თქვენი სახლის ყოველდღიურობას უფრო კომფორტულს ხდის. პროდუქტის ინფორმაცია და მახასიათებლები ნაჩვენებია დიზაინის დემონსტრაციისთვის.",
    "specs": [
      [
        "კატეგორია",
        "მიკროტალღური"
      ],
      [
        "გამოყენება",
        "სახლისთვის"
      ],
      [
        "კოლექცია",
        "Home & Kitchen"
      ],
      [
        "მოდელი",
        "სატესტო"
      ]
    ],
    "featured": true,
    "isNew": false,
    "keywords": "microwave микроволновка микроволновая ღუმელი"
  },
  {
    "id": "blender",
    "slug": "kitchen-blender",
    "sku": "EM-HK-006",
    "name": "სამზარეულოს ბლენდერი",
    "label": "სამზარეულოს ბლენდერი",
    "category": "blenders",
    "brand": "Express Mix",
    "price": 219,
    "oldPrice": 269,
    "image": "/images/cat-blenders.webp",
    "gallery": [
      "/images/cat-blenders.webp"
    ],
    "scene": "/images/story-kitchen.webp",
    "color": "შავი / ვერცხლისფერი",
    "tone": "#575958",
    "subtitle": "თქვენი ყოველდღიური დამხმარე.",
    "desc": "შეარჩიეთ ტექნიკა, რომელიც თქვენი სახლის ყოველდღიურობას უფრო კომფორტულს ხდის. პროდუქტის ინფორმაცია და მახასიათებლები ნაჩვენებია დიზაინის დემონსტრაციისთვის.",
    "specs": [
      [
        "კატეგორია",
        "ბლენდერები"
      ],
      [
        "გამოყენება",
        "სახლისთვის"
      ],
      [
        "კოლექცია",
        "Home & Kitchen"
      ],
      [
        "მოდელი",
        "სატესტო"
      ]
    ],
    "featured": true,
    "isNew": true,
    "keywords": "blender mixer блендер მიქსერი"
  },
  {
    "id": "fridge",
    "slug": "two-door-fridge",
    "sku": "EM-HK-007",
    "name": "ორკამერიანი მაცივარი",
    "label": "ორკამერიანი მაცივარი",
    "category": "fridges",
    "brand": "Express Mix",
    "price": 1199,
    "oldPrice": 1399,
    "image": "/images/cat-fridges.webp",
    "gallery": [
      "/images/cat-fridges.webp"
    ],
    "scene": "/images/story-kitchen.webp",
    "color": "შავი / ვერცხლისფერი",
    "tone": "#575958",
    "subtitle": "თქვენი ყოველდღიური დამხმარე.",
    "desc": "შეარჩიეთ ტექნიკა, რომელიც თქვენი სახლის ყოველდღიურობას უფრო კომფორტულს ხდის. პროდუქტის ინფორმაცია და მახასიათებლები ნაჩვენებია დიზაინის დემონსტრაციისთვის.",
    "specs": [
      [
        "კატეგორია",
        "მაცივრები"
      ],
      [
        "გამოყენება",
        "სახლისთვის"
      ],
      [
        "კოლექცია",
        "Home & Kitchen"
      ],
      [
        "მოდელი",
        "სატესტო"
      ]
    ],
    "featured": false,
    "isNew": true,
    "keywords": "fridge refrigerator холодильник მაცივარი"
  },
  {
    "id": "oven",
    "slug": "built-in-oven",
    "sku": "EM-HK-008",
    "name": "ჩასაშენებელი ღუმელი",
    "label": "ჩასაშენებელი ღუმელი",
    "category": "ovens",
    "brand": "Express Mix",
    "price": 649,
    "oldPrice": 799,
    "image": "/images/cat-ovens.webp",
    "gallery": [
      "/images/cat-ovens.webp"
    ],
    "scene": "/images/story-kitchen.webp",
    "color": "შავი / ვერცხლისფერი",
    "tone": "#575958",
    "subtitle": "თქვენი ყოველდღიური დამხმარე.",
    "desc": "შეარჩიეთ ტექნიკა, რომელიც თქვენი სახლის ყოველდღიურობას უფრო კომფორტულს ხდის. პროდუქტის ინფორმაცია და მახასიათებლები ნაჩვენებია დიზაინის დემონსტრაციისთვის.",
    "specs": [
      [
        "კატეგორია",
        "ღუმელები"
      ],
      [
        "გამოყენება",
        "სახლისთვის"
      ],
      [
        "კოლექცია",
        "Home & Kitchen"
      ],
      [
        "მოდელი",
        "სატესტო"
      ]
    ],
    "featured": false,
    "isNew": false,
    "keywords": "oven cooker печь духовка ღუმელი"
  },
  {
    "id": "vacuum",
    "slug": "home-vacuum-cleaner",
    "sku": "EM-HK-009",
    "name": "სახლის მტვერსასრუტი",
    "label": "სახლის მტვერსასრუტი",
    "category": "vacuums",
    "brand": "Express Mix",
    "price": 259,
    "oldPrice": 329,
    "image": "/images/cat-vacuums.webp",
    "gallery": [
      "/images/cat-vacuums.webp"
    ],
    "scene": "/images/story-kitchen.webp",
    "color": "შავი / ვერცხლისფერი",
    "tone": "#575958",
    "subtitle": "თქვენი ყოველდღიური დამხმარე.",
    "desc": "შეარჩიეთ ტექნიკა, რომელიც თქვენი სახლის ყოველდღიურობას უფრო კომფორტულს ხდის. პროდუქტის ინფორმაცია და მახასიათებლები ნაჩვენებია დიზაინის დემონსტრაციისთვის.",
    "specs": [
      [
        "კატეგორია",
        "მტვერსასრუტები"
      ],
      [
        "გამოყენება",
        "სახლისთვის"
      ],
      [
        "კოლექცია",
        "Home & Kitchen"
      ],
      [
        "მოდელი",
        "სატესტო"
      ]
    ],
    "featured": false,
    "isNew": true,
    "keywords": "vacuum cleaner пылесос მტვერსასრუტი"
  },
  {
    "id": "dehydrator",
    "slug": "franko-food-dehydrator",
    "sku": "EM-KT-010",
    "name": "Franko ჩირის აპარატი",
    "label": "ჩირის აპარატი",
    "category": "kitchen",
    "brand": "Franko",
    "price": 179,
    "oldPrice": 229,
    "image": "/images/dehydrator.webp",
    "gallery": [
      "/images/dehydrator.webp",
      "/images/dehydrator-scene.webp"
    ],
    "scene": "/images/dehydrator-scene.webp",
    "color": "შავი / გამჭვირვალე",
    "tone": "#2b2b2b",
    "subtitle": "ჯანსაღი ჩირი. სახლის პირობებში.",
    "desc": "მოამზადეთ ხილისა და ბოსტნეულის ჩირი სახლში, დანამატების გარეშე. მრავალსართულიანი გამჭვირვალე თაროები და რეგულირებადი ტემპერატურა ერთდროულად რამდენიმე პროდუქტის გაშრობის საშუალებას იძლევა.",
    "specs": [
      [
        "ტიპი",
        "ჩირის აპარატი"
      ],
      [
        "თაროები",
        "მრავალსართულიანი"
      ],
      [
        "ტემპერატურა",
        "რეგულირებადი"
      ],
      [
        "ფერი",
        "შავი / გამჭვირვალე"
      ]
    ],
    "featured": true,
    "isNew": true,
    "keywords": "dehydrator dried fruit сушилка для фруктов ჩირი ხილის საშრობი"
  }
];

