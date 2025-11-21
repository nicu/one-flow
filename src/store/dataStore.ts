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

// Hardcoded models for Search page (Hotels/Cruises)
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
    id: "cruise",
    name: "Cruise",
    fields: [
      { id: "id", name: "ID", type: "string" },
      { id: "name", name: "Name", type: "string" },
      { id: "description", name: "Description", type: "string" },
      { id: "price", name: "Price", type: "number" },
      { id: "rating", name: "Rating", type: "number" },
      { id: "image", name: "Image", type: "string" },
      { id: "destination", name: "Destination", type: "string" },
      { id: "duration", name: "Duration (days)", type: "number" },
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
    image: faker.image.urlLoremFlickr({ category: "hotel" }),
    location: faker.location.city(),
    available: faker.datatype.boolean(),
  }));

  const cruises = Array.from({ length: 8 }, (_, i) => ({
    id: `cruise-${i + 1}`,
    name: faker.company.name() + " Cruise",
    description: faker.lorem.sentence(),
    price: faker.number.int({ min: 500, max: 3000 }),
    rating: faker.number.float({ min: 3, max: 5, fractionDigits: 1 }),
    image: faker.image.urlLoremFlickr({ category: "ocean" }),
    destination: faker.location.country(),
    duration: faker.number.int({ min: 3, max: 14 }),
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

  return {
    hotel: hotels,
    cruise: cruises,
    search: search,
  };
}

export const initialDataStore: DataStore = {
  models: initialModels,
  relationships: initialRelationships,
  data: generateMockData(),
};
