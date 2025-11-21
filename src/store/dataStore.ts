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
      { id: "gender", name: "Gender", type: "string" },
      { id: "name", name: "Name", type: "object" },
      { id: "location", name: "Location", type: "object" },
      { id: "email", name: "Email", type: "string" },
      { id: "login", name: "Login", type: "object" },
      { id: "dob", name: "DOB", type: "object" },
      { id: "registered", name: "Registered", type: "object" },
      { id: "phone", name: "Phone", type: "string" },
      { id: "cell", name: "Cell", type: "string" },
      { id: "id", name: "ID", type: "object" },
      { id: "picture", name: "Picture", type: "object" },
      { id: "nat", name: "Nat", type: "string" },
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
      gender: "female",
      name: {
        title: "Miss",
        first: "Jennie",
        last: "Nichols",
      },
      location: {
        street: { number: 8929, name: "Valwood Pkwy" },
        city: "Billings",
        state: "Michigan",
        country: "United States",
        postcode: "63104",
        coordinates: { latitude: "-69.8246", longitude: "134.8719" },
        timezone: { offset: "+9:30", description: "Adelaide, Darwin" },
      },
      email: "jennie.nichols@example.com",
      login: {
        uuid: "7a0eed16-9430-4d68-901f-c0d4c1c3bf00",
        username: "yellowpeacock117",
        password: "addison",
      },
      dob: { date: "1992-03-08T15:13:16.688Z", age: 30 },
      registered: { date: "2007-07-09T05:51:59.390Z", age: 14 },
      phone: "(272) 790-0888",
      cell: "(489) 330-2385",
      id: { name: "SSN", value: "405-88-3636" },
      picture: {
        large: "https://randomuser.me/api/portraits/men/75.jpg",
        medium: "https://randomuser.me/api/portraits/med/men/75.jpg",
        thumbnail: "https://randomuser.me/api/portraits/thumb/men/75.jpg",
      },
      nat: "US",
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
