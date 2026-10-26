// საიტის რედაქტირებადი ტექსტები: საწყისი მნიშვნელობები (რასაც საიტი აჩვენებს, სანამ ადმინი შეცვლის)
// და ადმინის რედაქტორის ველები. კლიენტისთვის უსაფრთხოა — სერვერის import-ები აქ არ არის.

export type Link = { label: string; href: string };

export const contentDefaults = {
  site: {
    phone: "510 00 08 56",
    phoneHref: "tel:+995510000856",
    email: "info@expressmix.ge",
    salesEmail: "sales@expressmix.ge",
    address: "მირიან მეფის ქ. #46",
    mapQuery: "Mirian Mepe St 46, Tbilisi, Georgia",
    hours: "",
    facebook: "https://www.facebook.com/share/1FvymY5TAy/",
    instagram: "https://www.instagram.com/express.mix",
    tiktok: "https://www.tiktok.com/@expressmix0",
  },
  header: {
    searchPlaceholder: "რას ეძებთ?",
    navLinks: [
      { label: "მაღაზია", href: "/products" },
      { label: "აქციები", href: "/products?sale=1" },
      { label: "ახალი პროდუქტები", href: "/products?new=1" },
      { label: "ბრენდები", href: "/#brands" },
      { label: "ჩვენ შესახებ", href: "/about" },
      { label: "კონტაქტი", href: "/contact" },
    ] as Link[],
  },
  footer: {
    links: [
      { label: "ჩვენ შესახებ", href: "/about" },
      { label: "მაღაზია", href: "/products" },
      { label: "კონტაქტი", href: "/contact" },
    ] as Link[],
    copyright: "© 2026 Express Mix. ყველა უფლება დაცულია.",
  },
  home: {
    heroEyebrow: "ტექნიკა თქვენი სახლისთვის",
    heroButton: "კატალოგის ნახვა",
    slides: [
      {
        image: "/images/hero-washer.webp",
        title: "კომფორტი",
        title2: "ყველა",
        accent: "დეტალში",
        text: "თანამედროვე საყოფაცხოვრებო ტექნიკა მყუდრო და ტექნოლოგიური სახლისთვის",
        href: "/products?category=washers",
      },
      {
        image: "/images/promo-kitchen.webp",
        title: "ახალი დღე.",
        title2: "",
        accent: "ახალი ენერგია.",
        text: "თქვენი საყვარელი გემოები და მეტი კომფორტი სამზარეულოში",
        href: "/products?category=kitchen",
      },
      {
        image: "/images/promo-iron.webp",
        title: "იდეალური ზრუნვა",
        title2: "",
        accent: "ყველა დეტალზე",
        text: "აღმოაჩინეთ თქვენი ახალი ყოველდღიური დამხმარე",
        href: "/products?category=irons",
      },
      {
        image: "/images/washer-2.webp",
        title: "სუფთა სახლი.",
        title2: "",
        accent: "მეტი სიმშვიდე.",
        text: "ტექნიკა, რომელიც ყოველდღიურ ზრუნვას უფრო მარტივს ხდის",
        href: "/products",
      },
    ],
    heroBenefits: [
      { title: "სწრაფი მიწოდება", text: "მთელ საქართველოში" },
      { title: "ოფიციალური გარანტია", text: "ყველა პროდუქტზე" },
      { title: "მოსახერხებელი გადახდა", text: "ბარათით და განვადებით" },
    ],
    perks: [
      { title: "უფასო მიწოდება", text: "მთელ საქართველოში" },
      { title: "ხარისხის გარანტია", text: "ოფიციალური გარანტია ყველა ტექნიკაზე" },
      { title: "იყიდე ახლა, გადაიხადე ნაწილ-ნაწილ", text: "განვადება პარტნიორ ბანკებთან" },
    ],
    // source: featured | sale | new | all; category — კატეგორიის slug (ცარიელი = ყველა)
    productBlocks: [
      { title: "პოპულარული პროდუქტები", source: "featured", category: "", limit: "12" },
      { title: "ფასდაკლებული პროდუქცია", source: "sale", category: "", limit: "12" },
    ],
    showCategories: true,
    showPerks: true,
    showPromos: true,
    showBrands: true,
    showNewsletter: true,
    promos: [
      {
        image: "/images/promo-kitchen.webp",
        eyebrow: "EXPRESS MIX",
        title: "სამზარეულოში",
        accent: "უფრო მეტი კომფორტი",
        text: "თანამედროვე ტექნიკა თქვენი ყოველდღიურობისთვის.",
        button: "ნახე შეთავაზებები",
        href: "/products?category=kitchen",
      },
      {
        image: "/images/promo-iron.webp",
        eyebrow: "სპეციალური ფასები",
        title: "საყოფაცხოვრებო",
        accent: "ტექნიკაზე",
        text: "პატარა დეტალები. დიდი განსხვავება.",
        button: "ნახე აქციები",
        href: "/products?category=irons",
      },
    ],
    storyTitle: "თქვენი სახლი.",
    storyTitle2: "ჩვენი ტექნიკა.",
    storyImage: "/images/washer-2.webp",
    newsletterTitle: "გამოიწერე სიახლეები",
    newsletterText: "შეიტყვე ახალი პროდუქტებისა და განსაკუთრებული შეთავაზებების შესახებ.",
  },
  about: {
    heroEyebrow: "ABOUT EXPRESS MIX",
    heroTitle: "ტექნიკა თქვენი",
    heroAccent: "სახლისთვის.",
    heroText: "თქვენი სახლი. ჩვენი ტექნიკა.",
    heroImage: "/images/washer-2.webp",
    introEyebrow: "WHO WE ARE",
    introTitle: "Express Mix",
    introAccent: "ხარისხი, სანდოობა და კომფორტი თქვენი სახლისთვის",
    paragraphs: [
      "Express Mix საყოფაცხოვრებო ტექნიკისა და საოჯახო ნივთების სფეროში მომხმარებელს სთავაზობს ხარისხზე, სანდოობასა და კომფორტზე ორიენტირებულ მომსახურებას. ჩვენი მიზანია, თითოეულმა მომხმარებელმა მარტივად შეარჩიოს საკუთარი საჭიროებების შესაბამისი პროდუქცია და მიიღოს სრულფასოვანი მომსახურება შეძენის ყველა ეტაპზე.",
      "ჩვენი საქმიანობა მოიცავს საცალო გაყიდვებს შოურუმში, ონლაინ ვაჭრობას, კორპორატიულ მომსახურებასა და სახელმწიფო შესყიდვებში მონაწილეობას. ვთანამშრომლობთ ოფიციალურ ბრენდებთან და მომხმარებელს ვთავაზობთ ორიგინალ პროდუქციას შესაბამისი საგარანტიო მომსახურებით.",
      "ჩვენთვის მნიშვნელოვანია არა მხოლოდ პროდუქტის გაყიდვა, არამედ ნდობის მოპოვება და გრძელვადიანი ურთიერთობის ჩამოყალიბება. სწორედ ამიტომ, ჩვენი გუნდი მომხმარებელს ეხმარება პროდუქციის შერჩევაში, აწვდის საჭირო ინფორმაციას, პასუხობს შეკითხვებს და უზრუნველყოფს შეკვეთის პროცესის თანმიმდევრულ მართვას, შერჩევიდან მისამართზე მიწოდებამდე.",
      "ვზრუნავთ მომსახურების სისწრაფესა და ეფექტიანობაზე, რათა სასურველი პროდუქციის მიღება მომხმარებლისთვის მაქსიმალურად მარტივი და კომფორტული იყოს.",
      "ჩვენი საქმიანობის განმავლობაში მიღებული პოზიტიური შეფასებები მომხმარებელთა ნდობისა და ჩვენი გუნდის ყოველდღიური მუშაობის მნიშვნელოვანი დასტურია.",
      "Express Mix: მეტი, ვიდრე პროდუქტი. ზრუნვა თქვენს კომფორტზე, არჩევანის თავისუფლებასა და სანდო მომსახურებაზე.",
    ],
    introImage: "/images/promo-kitchen.webp",
    values: [
      { title: "ხარისხიანი ბრენდები", text: "მხოლოდ სანდო მწარმოებლების ტექნიკა" },
      { title: "საუკეთესო ფასები", text: "მუდმივი აქციები და სპეციალური შეთავაზებები" },
      { title: "კომფორტული შოპინგი", text: "მარტივი შეკვეთა და სწრაფი მიწოდება" },
    ],
    contactTitle: "საკონტაქტო ინფორმაცია",
  },
  contact: {
    eyebrow: "GET IN TOUCH",
    title: "დაგვიკავშირდით",
    text: "გაქვთ შეკითხვა ან გჭირდებათ დახმარება ტექნიკის არჩევაში? სიამოვნებით დაგეხმარებით.",
    phoneText: "დაგვირეკეთ და გიპასუხებთ ნებისმიერ კითხვაზე.",
    addressText: "მობრძანდით და ნახეთ ტექნიკა ადგილზე.",
    consultTitle: "არჩევანში დაგეხმარებით",
    consultText: "შეგირჩევთ ტექნიკას თქვენი სახლისა და ბიუჯეტის მიხედვით.",
    ctaTitle: "გჭირდებათ კონსულტაცია?",
    ctaText: "დაგვირეკეთ და ერთად შევარჩევთ თქვენთვის საუკეთესო ტექნიკას.",
  },
  shipping: {
    pickupText: "თვითგატანა უფასოა. მისამართი და სამუშაო საათები შეკვეთის დადასტურებისას გეცნობებათ.",
    warrantyText: "გარანტია და დაბრუნების პირობები განისაზღვრება კონკრეტული პროდუქტის მიხედვით.",
  },
  info: {
    delivery: "თბილისში ექსპრეს მიწოდება: შეკვეთის დადასტურებიდან 4–5 საათში (სამუშაო დღეებსა და საათებში). სტანდარტული მიწოდება: თბილისი 1–2 სამუშაო დღე, რეგიონები 3–4 სამუშაო დღე.",
    warranty: "გარანტიის ვადა და პირობები განისაზღვრება კონკრეტული მოდელის მიხედვით. დეტალებისთვის დაგვიკავშირდით.",
    payment: "გადახდა შესაძლებელია ბარათით ან განვადებით.",
    about: "Express Mix: სახლისა და სამზარეულოს ტექნიკა ერთ სივრცეში. ხარისხიანი ბრენდები, საუკეთესო ფასები და კომფორტული შოპინგი.",
    account: "პირადი კაბინეტი მალე დაემატება. კალათა და ფავორიტები ინახება თქვენს ბრაუზერში.",
    social: "გამოგვყევით სოციალურ ქსელებში და შეიტყვეთ სიახლეები პირველმა.",
    brands: "Express Mix-ში წარმოდგენილია სახლისა და სამზარეულოს ტექნიკის წამყვანი ბრენდები.",
  },
};

export type Content = typeof contentDefaults;
export type ContentKey = keyof Content;

// ───────── ადმინის რედაქტორის ველები ─────────

export type Sub = { name: string; label: string; long?: boolean; image?: boolean; options?: "categories" | { value: string; label: string }[] };
export type FieldSpec =
  | { name: string; label: string; type: "text" | "textarea" | "number" | "image" | "toggle"; hint?: string }
  | { name: string; label: string; type: "list"; hint?: string; long?: boolean }
  | { name: string; label: string; type: "objects"; hint?: string; fields: Sub[]; fixed?: boolean };

const link: Sub[] = [
  { name: "label", label: "ტექსტი" },
  { name: "href", label: "ბმული (მაგ. /about)" },
];
const titleText: Sub[] = [
  { name: "title", label: "სათაური" },
  { name: "text", label: "ტექსტი" },
];

export const contentSections: { key: ContentKey; title: string; description: string; fields: FieldSpec[] }[] = [
  {
    key: "site",
    title: "საკონტაქტო ინფორმაცია",
    description: "ტელეფონი, მისამართი, სოციალური ქსელები — ჩანს ჰედერში, ფუტერში, კონტაქტის გვერდზე და შეკვეთისას.",
    fields: [
      { name: "phone", label: "ტელეფონი (როგორც ჩანს)", type: "text", hint: "მაგ. 510 00 08 56" },
      { name: "phoneHref", label: "ტელეფონი დასარეკად", type: "text", hint: "მაგ. tel:+995510000856" },
      { name: "email", label: "ელფოსტა (ზოგადი)", type: "text" },
      { name: "salesEmail", label: "ელფოსტა (გაყიდვები)", type: "text" },
      { name: "address", label: "მისამართი", type: "text" },
      { name: "mapQuery", label: "რუკის მისამართი (Google Maps)", type: "text", hint: "მაგ. Mirian Mepe St 46, Tbilisi, Georgia" },
      { name: "hours", label: "სამუშაო საათები", type: "text" },
      { name: "facebook", label: "Facebook ბმული", type: "text" },
      { name: "instagram", label: "Instagram ბმული", type: "text" },
      { name: "tiktok", label: "TikTok ბმული", type: "text" },
    ],
  },
  {
    key: "header",
    title: "ჰედერი",
    description: "ძიების ველი და ნავიგაციის ბმულები. „კატეგორიების“ მენიუში რა გამოჩნდეს — კატეგორიებში „მენიუში“ გადამრთველით.",
    fields: [
      { name: "searchPlaceholder", label: "ძიების ველის ტექსტი", type: "text" },
      { name: "navLinks", label: "ნავიგაციის ბმულები", type: "objects", fields: link },
    ],
  },
  {
    key: "footer",
    title: "ფუტერი",
    description: "საიტის ქვედა ნაწილი.",
    fields: [
      { name: "links", label: "ბმულები", type: "objects", fields: link },
      { name: "copyright", label: "ქვედა ტექსტი", type: "text" },
    ],
  },
  {
    key: "home",
    title: "მთავარი გვერდი",
    description: "ბანერები (სლაიდერი), პროდუქციის ბლოკები, სარეკლამო ბლოკები და სექციების ჩართვა/გამორთვა.",
    fields: [
      { name: "heroEyebrow", label: "ბანერი: ზედა წარწერა", type: "text" },
      { name: "heroButton", label: "ბანერი: ღილაკის ტექსტი", type: "text" },
      {
        name: "slides",
        label: "ბანერის სლაიდები",
        type: "objects",
        hint: "სათაური: 1-ლი ხაზი; მე-2 ხაზი: ჩვეულებრივი ტექსტი + ნარინჯისფერი ნაწილი.",
        fields: [
          { name: "image", label: "სურათი", image: true },
          { name: "title", label: "სათაური (1-ლი ხაზი)" },
          { name: "title2", label: "მე-2 ხაზი" },
          { name: "accent", label: "ნარინჯისფერი ნაწილი" },
          { name: "text", label: "ტექსტი" },
          { name: "href", label: "ბმული" },
        ],
      },
      { name: "heroBenefits", label: "ბანერის ქვედა უპირატესობები (3)", type: "objects", fixed: true, fields: titleText },
      { name: "perks", label: "უპირატესობების ბარათები (3)", type: "objects", fixed: true, fields: titleText },
      {
        name: "productBlocks",
        label: "პროდუქციის ბლოკები (კარუსელები)",
        type: "objects",
        hint: "რომელი პროდუქცია გამოჩნდეს მთავარზე: აირჩიეთ ტიპი და კატეგორია. „პოპულარული“ = პროდუქტში ⭐ მონიშნული (თუ არცერთია — ყველა).",
        fields: [
          { name: "title", label: "სათაური" },
          {
            name: "source",
            label: "რა პროდუქცია",
            options: [
              { value: "featured", label: "პოპულარული (⭐)" },
              { value: "sale", label: "ფასდაკლებული" },
              { value: "new", label: "ახალი" },
              { value: "all", label: "ყველა" },
            ],
          },
          { name: "category", label: "კატეგორია", options: "categories" },
          { name: "limit", label: "რაოდენობა (მაქს.)" },
        ],
      },
      { name: "showCategories", label: "კატეგორიების ბადე (კატეგორიაში „მთავარზე“ მონიშნულები)", type: "toggle" },
      { name: "showPerks", label: "უპირატესობების ბარათები", type: "toggle" },
      { name: "showPromos", label: "სარეკლამო ბანერები", type: "toggle" },
      { name: "showBrands", label: "ბრენდების ზოლი", type: "toggle" },
      { name: "showNewsletter", label: "სიახლეების გამოწერა", type: "toggle" },
      {
        name: "promos",
        label: "სარეკლამო ბანერები (2)",
        type: "objects",
        fixed: true,
        fields: [
          { name: "image", label: "სურათი", image: true },
          { name: "eyebrow", label: "ზედა წარწერა" },
          { name: "title", label: "სათაური" },
          { name: "accent", label: "სათაურის მე-2 ხაზი" },
          { name: "text", label: "ტექსტი" },
          { name: "button", label: "ღილაკი" },
          { name: "href", label: "ბმული" },
        ],
      },
      { name: "storyImage", label: "ქვედა ბლოკის სურათი", type: "image" },
      { name: "storyTitle", label: "ქვედა ბლოკი: სათაური", type: "text" },
      { name: "storyTitle2", label: "ქვედა ბლოკი: მე-2 ხაზი", type: "text" },
      { name: "newsletterTitle", label: "გამოწერის სათაური", type: "text" },
      { name: "newsletterText", label: "გამოწერის ტექსტი", type: "textarea" },
    ],
  },
  {
    key: "about",
    title: "ჩვენ შესახებ",
    description: "„ჩვენ შესახებ“ გვერდის ტექსტები და სურათები.",
    fields: [
      { name: "heroImage", label: "ბანერის სურათი", type: "image" },
      { name: "heroEyebrow", label: "ბანერი: ზედა წარწერა", type: "text" },
      { name: "heroTitle", label: "ბანერი: სათაური", type: "text" },
      { name: "heroAccent", label: "ბანერი: ნარინჯისფერი ნაწილი", type: "text" },
      { name: "heroText", label: "ბანერი: ტექსტი", type: "text" },
      { name: "introImage", label: "აღწერის სურათი", type: "image" },
      { name: "introEyebrow", label: "აღწერა: ზედა წარწერა", type: "text" },
      { name: "introTitle", label: "აღწერა: სათაური", type: "text" },
      { name: "introAccent", label: "აღწერა: ნარინჯისფერი ნაწილი", type: "text" },
      { name: "paragraphs", label: "აღწერის აბზაცები", type: "list", long: true },
      { name: "values", label: "ღირებულებები (3)", type: "objects", fixed: true, fields: titleText },
      { name: "contactTitle", label: "საკონტაქტო ბლოკის სათაური", type: "text" },
    ],
  },
  {
    key: "contact",
    title: "კონტაქტი",
    description: "კონტაქტის გვერდის ტექსტები. ტელეფონი და მისამართი — „საკონტაქტო ინფორმაციაში“.",
    fields: [
      { name: "eyebrow", label: "ზედა წარწერა", type: "text" },
      { name: "title", label: "სათაური", type: "text" },
      { name: "text", label: "ქვესათაური", type: "textarea" },
      { name: "phoneText", label: "ტელეფონის ბარათის ტექსტი", type: "text" },
      { name: "addressText", label: "მისამართის ბარათის ტექსტი", type: "text" },
      { name: "consultTitle", label: "კონსულტაციის ბარათის სათაური", type: "text" },
      { name: "consultText", label: "კონსულტაციის ბარათის ტექსტი", type: "text" },
      { name: "ctaTitle", label: "ქვედა ბლოკი: სათაური", type: "text" },
      { name: "ctaText", label: "ქვედა ბლოკი: ტექსტი", type: "text" },
    ],
  },
  {
    key: "shipping",
    title: "მიწოდება",
    description: "თვითგატანისა და გარანტიის ტექსტები. მიწოდების ფასები — ადმინი → მიწოდება (კლასები).",
    fields: [
      { name: "pickupText", label: "თვითგატანის ტექსტი", type: "textarea" },
      { name: "warrantyText", label: "გარანტიის ტექსტი (პროდუქტის გვერდზე)", type: "textarea" },
    ],
  },
  {
    key: "info",
    title: "საინფორმაციო ფანჯრები",
    description: "ტექსტები, რომლებიც იხსნება „მიწოდება“, „გადახდა“, „გარანტია“ და სხვა ღილაკებზე.",
    fields: [
      { name: "delivery", label: "მიწოდების პირობები", type: "textarea" },
      { name: "payment", label: "გადახდის მეთოდები", type: "textarea" },
      { name: "warranty", label: "პროდუქტის გარანტია", type: "textarea" },
      { name: "about", label: "ჩვენ შესახებ (მოკლედ)", type: "textarea" },
      { name: "account", label: "ანგარიში", type: "textarea" },
      { name: "social", label: "სოციალური ქსელები", type: "textarea" },
      { name: "brands", label: "ბრენდები", type: "textarea" },
    ],
  },
];
