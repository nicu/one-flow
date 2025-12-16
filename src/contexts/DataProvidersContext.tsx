import React, { createContext, useContext, useState } from "react";
import { getSavedImage } from "../utils/getSavedImage";

export type DataModel = {
  id: string;
  name: string;
  description?: string;
  fields: Record<string, string>; // fieldName -> type
  items: any[]; // sample data
};

export interface DataProvidersStore {
  models: Record<string, DataModel>;
  addModel: (model: DataModel) => void;
  updateModel: (id: string, patch: Partial<DataModel>) => void;
  removeModel: (id: string) => void;
}

const sampleModels: DataModel[] = [
  {
    id: "person",
    name: "Person",
    description: "People records",
    fields: {
      id: "string",
      firstName: "string",
      lastName: "string",
      email: "string",
      avatar: "string",
      bio: "string",
    },
    items: [
      {
        id: "p1",
        firstName: "Alex",
        lastName: "Johnson",
        email: "alex@example.com",
        avatar: getSavedImage(15, 80),
        bio: "Product designer",
      },
      {
        id: "p2",
        firstName: "Mariana",
        lastName: "Ionescu",
        email: "mariana@example.com",
        avatar: getSavedImage(12, 80),
        bio: "Frontend engineer",
      },
      {
        id: "p3",
        firstName: "Sam",
        lastName: "Patel",
        email: "sam@example.com",
        avatar: getSavedImage(3, 80),
        bio: "Data scientist",
      },
    ],
  },
  {
    id: "hotel",
    name: "Hotel",
    description: "Hotels for booking",
    fields: {
      id: "string",
      name: "string",
      city: "string",
      rating: "number",
      price: "number",
      image: "string",
    },
    items: [
      {
        id: "h1",
        name: "Grand Plaza",
        city: "Bucharest",
        rating: 4.5,
        price: 120,
        image: getSavedImage(101, 300),
      },
      {
        id: "h2",
        name: "Sea Breeze",
        city: "Constanta",
        rating: 4.2,
        price: 95,
        image: getSavedImage(102, 300),
      },
      {
        id: "h3",
        name: "Mountain Lodge",
        city: "Brasov",
        rating: 4.8,
        price: 160,
        image: getSavedImage(103, 300),
      },
    ],
  },
  {
    id: "product",
    name: "Product",
    description: "E-commerce products",
    fields: {
      id: "string",
      title: "string",
      price: "number",
      image: "string",
      description: "string",
      inStock: "boolean",
    },
    items: [
      {
        id: "prd1",
        title: "Wireless Headphones",
        price: 89.99,
        image: getSavedImage(201, 200),
        description: "Noise-cancelling",
        inStock: true,
      },
      {
        id: "prd2",
        title: "Espresso Machine",
        price: 249.99,
        image: getSavedImage(202, 200),
        description: "Barista-level coffee",
        inStock: false,
      },
      {
        id: "prd3",
        title: "Yoga Mat",
        price: 29.99,
        image: getSavedImage(203, 200),
        description: "Eco-friendly",
        inStock: true,
      },
    ],
  },
  {
    id: "order",
    name: "Order",
    description: "E-commerce orders",
    fields: {
      id: "string",
      userId: "string",
      total: "number",
      status: "string",
      items: "array",
    },
    items: [
      {
        id: "o1",
        userId: "p1",
        total: 159.98,
        status: "shipped",
        items: [
          { productId: "prd1", qty: 1 },
          { productId: "prd3", qty: 2 },
        ],
      },
      {
        id: "o2",
        userId: "p2",
        total: 249.99,
        status: "processing",
        items: [{ productId: "prd2", qty: 1 }],
      },
    ],
  },
  {
    id: "user",
    name: "User",
    description: "Authentication users",
    fields: {
      id: "string",
      username: "string",
      email: "string",
      role: "string",
      lastLogin: "string",
    },
    items: [
      {
        id: "u1",
        username: "alice",
        email: "alice@example.com",
        role: "admin",
        lastLogin: "2025-11-30T10:00:00Z",
      },
      {
        id: "u2",
        username: "bob",
        email: "bob@example.com",
        role: "user",
        lastLogin: "2025-11-29T15:12:00Z",
      },
    ],
  },
  {
    id: "review",
    name: "Review",
    description: "Product or hotel reviews",
    fields: {
      id: "string",
      author: "string",
      rating: "number",
      text: "string",
      targetId: "string",
    },
    items: [
      {
        id: "r1",
        author: "Alex",
        rating: 5,
        text: "Amazing stay!",
        targetId: "h1",
      },
      {
        id: "r2",
        author: "Sam",
        rating: 4,
        text: "Very good, would come back.",
        targetId: "h3",
      },
    ],
  },
  {
    id: "article",
    name: "Article",
    description: "Blog or marketing articles",
    fields: {
      id: "string",
      title: "string",
      body: "string",
      author: "string",
      publishedAt: "string",
    },
    items: [
      {
        id: "a1",
        title: "Designing for Humans",
        body: "Long form content...",
        author: "Mariana",
        publishedAt: "2025-10-01",
      },
      {
        id: "a2",
        title: "Performance Tips",
        body: "Long form content...",
        author: "Alex",
        publishedAt: "2025-09-21",
      },
    ],
  },
  {
    id: "event",
    name: "Event",
    description: "Events and tickets",
    fields: {
      id: "string",
      title: "string",
      date: "string",
      location: "string",
      attendees: "number",
    },
    items: [
      {
        id: "e1",
        title: "OneFlow Meetup",
        date: "2026-01-10",
        location: "Bucharest",
        attendees: 120,
      },
      {
        id: "e2",
        title: "Design Week",
        date: "2026-02-02",
        location: "Cluj",
        attendees: 230,
      },
    ],
  },
  {
    id: "location",
    name: "Location",
    description: "Geographic places",
    fields: {
      id: "string",
      city: "string",
      country: "string",
      lat: "number",
      lng: "number",
    },
    items: [
      {
        id: "loc1",
        city: "Bucharest",
        country: "Romania",
        lat: 44.4268,
        lng: 26.1025,
      },
      {
        id: "loc2",
        city: "Cluj-Napoca",
        country: "Romania",
        lat: 46.7712,
        lng: 23.6236,
      },
    ],
  },
];

const initialModels: Record<string, DataModel> = {};
for (const m of sampleModels) initialModels[m.id] = m;

const DataProvidersContext = createContext<DataProvidersStore>({
  models: initialModels,

  addModel: () => {},

  updateModel: () => {},

  removeModel: () => {},
});

export const DataProvidersProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [models, setModels] =
    useState<Record<string, DataModel>>(initialModels);

  const addModel = (model: DataModel) => {
    setModels((prev) => ({ ...prev, [model.id]: model }));
  };

  const updateModel = (id: string, patch: Partial<DataModel>) => {
    setModels((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const removeModel = (id: string) => {
    setModels((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  return (
    <DataProvidersContext.Provider
      value={{ models, addModel, updateModel, removeModel }}
    >
      {children}
    </DataProvidersContext.Provider>
  );
};

export const useDataProviders = () => useContext(DataProvidersContext);
