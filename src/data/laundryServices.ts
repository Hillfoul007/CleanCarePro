export interface LaundryService {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  estimatedTime?: string;
  popular?: boolean;
  unit: "KG" | "PC" | "SET";
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
}

export const laundryServices: LaundryService[] = [
  // Laundry Services
  {
    id: "laundry-fold",
    name: "Laundry and Fold",
    description: "Basic washing and folding service for everyday clothes.",
    price: 70,
    unit: "KG",
    category: "laundry",
    estimatedTime: "24-48 hours",
    image:
      "https://drive.google.com/uc?export=view&id=1D6MGbVYkhrwUwcRtXs3gNsgZR7Jj2CnI",
    popular: true,
  },
  {
    id: "laundry-iron",
    name: "Laundry and Iron",
    description:
      "Complete washing and ironing service for fresh, crisp clothes.",
    price: 120,
    unit: "KG",
    category: "laundry",
    estimatedTime: "24-48 hours",
    image:
      "https://drive.google.com/uc?export=view&id=1UynThmdR4fk0QIOlL0uzv4yhzNa_cdWP",
    popular: true,
  },

  // Iron Services
  {
    id: "coal-iron-basic",
    name: "Coal Iron",
    description: "Traditional coal iron service for all clothing items.",
    price: 20,
    unit: "PC",
    category: "iron",
    estimatedTime: "24 hours",
    image:
      "https://drive.google.com/uc?export=view&id=1OUxEAHazZirBa2jfsysz3c1Z6MbOAdUB",
  },
  {
    id: "steam-iron-suit",
    name: "Steam Iron - Men's Suit / Heavy Dresses",
    description:
      "Professional steam ironing for men's suits (2/3 PC), lehengas, and heavy dresses.",
    price: 150,
    unit: "SET",
    category: "iron",
    estimatedTime: "24-48 hours",
    image:
      "https://drive.google.com/uc?export=view&id=1jQSEpFDTTFTLohhPAuj_TPeV7WUcAg8v",
  },
  {
    id: "steam-iron-ladies-suit",
    name: "Steam Iron - Ladies Suit / Kurta & Pyjama / Saree",
    description:
      "Expert steam ironing for ladies suits, kurta sets, and sarees.",
    price: 100,
    unit: "SET",
    category: "iron",
    estimatedTime: "24 hours",
    image:
      "https://drive.google.com/uc?export=view&id=1Y1U-g8PF8FWV2OQppb_BSfGb8yzR75uK",
  },
  {
    id: "steam-iron-general",
    name: "Steam Iron - Other Items",
    description:
      "Steam ironing for all other clothing items not specified above.",
    price: 40,
    unit: "PC",
    category: "iron",
    estimatedTime: "24 hours",
    image:
      "https://drive.google.com/uc?export=view&id=1xrhvPDQhXBGtCpIkeHe6cz1E0wJABruj",
  },

  // Men's Dry Clean
  {
    id: "dry-clean-mens-shirt",
    name: "Dry Clean - Men's Shirt/T-Shirt",
    description: "Professional dry cleaning for men's shirts and t-shirts.",
    price: 100,
    unit: "PC",
    category: "mens-dry-clean",
    estimatedTime: "48-72 hours",
    image: "/images/Shirt.png",
  },
  {
    id: "dry-clean-mens-trouser",
    name: "Dry Clean - Trouser/Jeans",
    description: "Expert dry cleaning for men's trousers and jeans.",
    price: 120,
    unit: "PC",
    category: "mens-dry-clean",
    estimatedTime: "48-72 hours",
    image: "/images/Trouser&Jeans.png",
  },
  {
    id: "dry-clean-mens-coat",
    name: "Dry Clean - Coat",
    description: "Premium dry cleaning for men's coats and blazers.",
    price: 240,
    unit: "PC",
    category: "mens-dry-clean",
    estimatedTime: "48-72 hours",
    image: "/images/Coat.png",
  },
  {
    id: "dry-clean-mens-suit-2pc",
    name: "Dry Clean - Men's Suit 2 PC",
    description: "Complete dry cleaning service for 2-piece men's suits.",
    price: 360,
    unit: "SET",
    category: "mens-dry-clean",
    estimatedTime: "48-72 hours",
    image: "/images/Suit 2 PC.png",
  },
  {
    id: "dry-clean-mens-suit-3pc",
    name: "Dry Clean - Men's Suit 3 PC",
    description: "Complete dry cleaning service for 3-piece men's suits.",
    price: 540,
    unit: "SET",
    category: "mens-dry-clean",
    estimatedTime: "48-72 hours",
    image: "/images/Men suit 3 PC.png",
  },
  {
    id: "dry-clean-kurta-pyjama",
    name: "Dry Clean - Kurta Pyjama (2 PC)",
    description: "Traditional dry cleaning for kurta pyjama sets.",
    price: 220,
    unit: "SET",
    category: "mens-dry-clean",
    estimatedTime: "48-72 hours",
    image: "/images/Kurta Pyjama.png",
  },
  {
    id: "dry-clean-achkan-sherwani",
    name: "Dry Clean - Achkan / Sherwani",
    description: "Premium dry cleaning for traditional formal wear.",
    price: 300,
    unit: "SET",
    category: "mens-dry-clean",
    estimatedTime: "48-72 hours",
    image: "/images/Sherwani.png",
  },

  // Women's Dry Clean
  {
    id: "dry-clean-womens-kurta",
    name: "Dry Clean - Kurta",
    description: "Professional dry cleaning for women's kurtas.",
    price: 120,
    unit: "PC",
    category: "womens-dry-clean",
    estimatedTime: "48-72 hours",
    image: "/images/Kurta pyjama.png",
  },
  {
    id: "dry-clean-salwar-plazo",
    name: "Dry Clean - Salwar/Plazo/Dupatta",
    description: "Expert dry cleaning for salwar, plazo, and dupatta.",
    price: 120,
    unit: "PC",
    category: "womens-dry-clean",
    estimatedTime: "48-72 hours",
    image: "/images/Plazo.png",
  },
  {
    id: "dry-clean-saree-simple",
    name: "Dry Clean - Saree Simple/Silk",
    description: "Careful dry cleaning for simple and silk sarees.",
    price: 240,
    unit: "PC",
    category: "womens-dry-clean",
    estimatedTime: "48-72 hours",
    image: "/images/Saree Silk.png",
  },
  {
    id: "dry-clean-saree-heavy",
    name: "Dry Clean - Saree (Heavy Work)",
    description: "Specialized dry cleaning for heavily embroidered sarees.",
    price: 300,
    unit: "PC",
    category: "womens-dry-clean",
    estimatedTime: "72 hours",
    image: "/images/Saree Heavy work.png",
  },
  {
    id: "dry-clean-blouse",
    name: "Dry Clean - Blouse",
    description: "Delicate dry cleaning for blouses and tops.",
    price: 90,
    unit: "PC",
    category: "womens-dry-clean",
    estimatedTime: "48 hours",
    image:
      "https://drive.google.com/uc?export=view&id=1qRMlN6-eqFTozTIrLlH_45yGzNLVDjav",
  },
  {
    id: "dry-clean-dress",
    name: "Dry Clean - Dress",
    description: "Professional dry cleaning for women's dresses.",
    price: 240,
    unit: "PC",
    category: "womens-dry-clean",
    estimatedTime: "48-72 hours",
    image: "/images/Dress.png",
  },
  {
    id: "dry-clean-top",
    name: "Dry Clean - Top",
    description: "Quality dry cleaning for women's tops and blouses.",
    price: 140,
    unit: "PC",
    category: "womens-dry-clean",
    estimatedTime: "48 hours",
    image:
      "https://drive.google.com/uc?export=view&id=1qRMlN6-eqFTozTIrLlH_45yGzNLVDjav",
  },
  {
    id: "dry-clean-skirt-heavy",
    name: "Dry Clean - Skirt (Heavy Work)",
    description: "Specialized cleaning for heavily embroidered skirts.",
    price: 180,
    unit: "PC",
    category: "womens-dry-clean",
    estimatedTime: "48-72 hours",
    image: "/images/Skirt Heavy Work.png",
  },
  {
    id: "dry-clean-lehenga-1pc",
    name: "Dry Clean - Lehenga 1 PC",
    description: "Expert dry cleaning for single-piece lehengas.",
    price: 400,
    unit: "PC",
    category: "womens-dry-clean",
    estimatedTime: "72 hours",
    image: "/images/Skirt Heavy Work.png",
  },
  {
    id: "dry-clean-lehenga-2pc",
    name: "Dry Clean - Lehenga 2+ PC",
    description: "Complete dry cleaning for multi-piece lehenga sets.",
    price: 600,
    unit: "SET",
    category: "womens-dry-clean",
    estimatedTime: "72 hours",
    image:
      "https://drive.google.com/uc?export=view&id=1Wwv_n7S-GPjd5az4U29gZBMCNnUwRJTK",
  },
  {
    id: "dry-clean-lehenga-heavy",
    name: "Dry Clean - Lehenga Heavy",
    description: "Premium cleaning for heavily embroidered lehengas.",
    price: 700,
    unit: "SET",
    category: "womens-dry-clean",
    estimatedTime: "72-96 hours",
    image:
      "https://drive.google.com/uc?export=view&id=1Wwv_n7S-GPjd5az4U29gZBMCNnUwRJTK",
  },
  {
    id: "dry-clean-lehenga-luxury",
    name: "Dry Clean - Lehenga Luxury Heavy",
    description: "Luxury cleaning service for designer and luxury lehengas.",
    price: 1000,
    unit: "SET",
    category: "womens-dry-clean",
    estimatedTime: "96 hours",
    image:
      "https://drive.google.com/uc?export=view&id=1Wwv_n7S-GPjd5az4U29gZBMCNnUwRJTK",
  },

  // Woolen Dry Clean
  {
    id: "dry-clean-jacket",
    name: "Dry Clean - Jacket F/H Sleeves",
    description: "Professional dry cleaning for full and half sleeve jackets.",
    price: 240,
    unit: "PC",
    category: "woolen-dry-clean",
    estimatedTime: "48-72 hours",
    image: "/images/Jacket.png",
  },
  {
    id: "dry-clean-sweater",
    name: "Dry Clean - Sweater / Sweat Shirt",
    description: "Gentle dry cleaning for sweaters and sweatshirts.",
    price: 180,
    unit: "PC",
    category: "woolen-dry-clean",
    estimatedTime: "48-72 hours",
    image: "/images/Sweater.png",
  },
  {
    id: "dry-clean-long-coat",
    name: "Dry Clean - Long Coat",
    description: "Expert cleaning for long coats and overcoats.",
    price: 300,
    unit: "PC",
    category: "woolen-dry-clean",
    estimatedTime: "72 hours",
    image: "/images/Long Coat.png",
  },
  {
    id: "dry-clean-shawl",
    name: "Dry Clean - Shawl",
    description: "Delicate cleaning for woolen and silk shawls.",
    price: 180,
    unit: "PC",
    category: "woolen-dry-clean",
    estimatedTime: "48-72 hours",
    image: "/images/Shawl.png",
  },
  {
    id: "dry-clean-pashmina",
    name: "Dry Clean - Pashmina",
    description: "Luxury cleaning for premium pashmina shawls.",
    price: 300,
    unit: "PC",
    category: "woolen-dry-clean",
    estimatedTime: "72 hours",
    image: "/images/Pashmina.png",
  },
  {
    id: "dry-clean-leather-jacket",
    name: "Dry Clean - Leather Jacket",
    description: "Specialized cleaning for leather jackets and coats.",
    price: 480,
    unit: "PC",
    category: "woolen-dry-clean",
    estimatedTime: "72-96 hours",
    image: "/images/Leather jacket.png",
  },
];

export const serviceCategories = [
  { id: "all", name: "All Services", icon: "🧺" },
  { id: "laundry", name: "Laundry", icon: "🫧" },
  { id: "iron", name: "Iron", icon: "🔥" },
  { id: "mens-dry-clean", name: "Men's Dry Clean", icon: "👔" },
  { id: "womens-dry-clean", name: "Women's Dry Clean", icon: "👗" },
  { id: "woolen-dry-clean", name: "Woolen Dry Clean", icon: "🧥" },
];

// Utility functions
export const getPopularServices = (): LaundryService[] => {
  return laundryServices.filter((service) => service.popular);
};

export const getSortedServices = (
  sortBy: "price" | "name" | "category" = "category",
): LaundryService[] => {
  const sorted = [...laundryServices];

  switch (sortBy) {
    case "price":
      return sorted.sort((a, b) => a.price - b.price);
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "category":
    default:
      return sorted.sort((a, b) => a.category.localeCompare(b.category));
  }
};

export const getServiceById = (id: string): LaundryService | undefined => {
  return laundryServices.find((service) => service.id === id);
};

export const getServicesByCategory = (category: string): LaundryService[] => {
  if (category === "all") return laundryServices;
  return laundryServices.filter((service) => service.category === category);
};

export const searchServices = (query: string): LaundryService[] => {
  if (!query.trim()) return laundryServices;

  const lowercaseQuery = query.toLowerCase();
  return laundryServices.filter(
    (service) =>
      service.name.toLowerCase().includes(lowercaseQuery) ||
      service.description.toLowerCase().includes(lowercaseQuery) ||
      service.category.toLowerCase().includes(lowercaseQuery),
  );
};
