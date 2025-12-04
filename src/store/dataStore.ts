import { faker } from "@faker-js/faker";

export type DataFieldType =
  | "string"
  | "number"
  | "boolean"
  | "array"
  | "object";

export interface DataField {
  id: string;
  name: string;
  type: DataFieldType;
  arrayItemType?: string; // For arrays, references another model
}

export interface DataModel {
  id: string;
  name: string;
  fields: DataField[];
  // Optional position for graph layout persistence
  position?: { x: number; y: number };
}

export interface DataRelationship {
  id: string;
  fromModelId: string;
  toModelId: string;
  type: "one-to-many" | "many-to-one" | "many-to-many";
}

export interface DataStore {
  models: DataModel[];
  relationships: DataRelationship[];
  data: Record<string, any[]>; // modelId -> array of instances
}

// Hardcoded models for Search page (Hotels)
export const initialModels: DataModel[] = [
  {
    id: "hotel",
    name: "Hotel",
    fields: [
      { id: "id", name: "ID", type: "string" },
      { id: "name", name: "Name", type: "string" },
      { id: "description", name: "Description", type: "string" },
      { id: "price", name: "Price", type: "number" },
      { id: "rating", name: "Rating", type: "number" },
      { id: "image", name: "Image", type: "string" },
      { id: "location", name: "Location", type: "string" },
      { id: "available", name: "Available", type: "boolean" },
    ],
  },
  {
    id: "search",
    name: "Search",
    fields: [
      { id: "query", name: "Query", type: "string" },
      { id: "filters", name: "Filters", type: "object" },
      { id: "results", name: "Results", type: "array", arrayItemType: "hotel" },
      { id: "page", name: "Page", type: "number" },
      { id: "pageSize", name: "Page Size", type: "number" },
      { id: "totalResults", name: "Total Results", type: "number" },
    ],
  },
  {
    id: "user",
    name: "User",
    fields: [
      { id: "id", name: "ID", type: "string" },
      { id: "name", name: "Name", type: "string" },
      { id: "location", name: "Location", type: "string" },
      { id: "email", name: "Email", type: "string" },
      { id: "phone", name: "Phone", type: "string" },
      { id: "nat", name: "Nat", type: "string" },
      { id: "avatar", name: "Avatar", type: "string" },
    ],
  },
];

export const initialRelationships: DataRelationship[] = [
  {
    id: "search-hotels",
    fromModelId: "search",
    toModelId: "hotel",
    type: "one-to-many",
  },
];

// Generate mock data using Faker
export function generateMockData(): Record<string, any[]> {
  const hotels = Array.from({ length: 12 }, (_, i) => ({
    id: `hotel-${i + 1}`,
    name: faker.company.name() + " Hotel",
    description: faker.lorem.sentence(),
    price: faker.number.int({ min: 50, max: 500 }),
    rating: faker.number.float({ min: 3, max: 5, fractionDigits: 1 }),
    image: faker.image.url({ width: 640, height: 360 }),
    location: faker.location.city(),
    available: faker.datatype.boolean(),
  }));

  const search = [
    {
      query: "",
      filters: {},
      results: hotels.slice(0, 6),
      page: 1,
      pageSize: 6,
      totalResults: hotels.length,
    },
  ];

  const user = [
    {
      id: "user-1",
      name: "Jennie Nichols",
      location: "Billings, Michigan",
      email: "jennie.nichols@example.com",
      phone: "(272) 790-0888",
      nat: "US",
      avatar: `https://i.pravatar.cc/150?u=user-10`,
    },
    {
      id: "user-2",
      name: "John Doe",
      location: "Portland, Oregon",
      email: "john.doe@example.com",
      phone: "(503) 555-0123",
      nat: "US",
      avatar: `https://i.pravatar.cc/150?u=user-2`,
    },
    {
      id: "user-3",
      name: "Maria Garcia",
      location: "Austin, Texas",
      email: "maria.garcia@example.com",
      phone: "(512) 555-0456",
      nat: "US",
      avatar: `https://i.pravatar.cc/150?u=user-20`,
    },
  ];

  return {
    hotel: hotels,
    search: search,
    user: user,
  };
}

export const initialDataStore: DataStore = {
  models: initialModels,
  relationships: initialRelationships,
  data: generateMockData(),
};
