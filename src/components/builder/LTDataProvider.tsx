import React from "react";
import { DataContext } from "../../contexts/DataContext";
import { useDataProviders } from "../../contexts/DataProvidersContext";
import type { ComponentProperties } from "../../types";
import { initialRelationships } from "../../store/dataStore";

const LTDataProvider: React.FC<{
  properties: ComponentProperties;
  children?: React.ReactNode;
}> = ({ properties, children }) => {
  const dp = useDataProviders() || { models: {} };
  // property `providerId` references a model id exposed by DataProvidersContext
  const providerId =
    (properties as any)?.providerId || properties?.dataBinding?.modelId;

  // build a simple DataStore-shaped object from dp.models
  const data: Record<string, any[]> = {};
  const models = [] as any[];
  for (const key of Object.keys(dp.models)) {
    const model = dp.models[key];
    models.push({
      id: model.id,
      name: model.name,
      fields: Object.keys(model.fields).map((f) => ({
        id: f,
        name: f,
        type: model.fields[f],
      })),
    });
    data[model.id] = model.items || [];
  }

  const dataStore = {
    models: models,
    relationships: initialRelationships,
    data,
  };

  // When providerId is set and corresponds to a model, we will not set
  // currentItem (children can use dataBinding.collectionId etc.)
  return (
    <DataContext.Provider value={{ dataStore }}>
      <div style={{ border: "1px dashed rgba(0,0,0,0.06)", padding: 8 }}>
        {children}
      </div>
    </DataContext.Provider>
  );
};

export default LTDataProvider;
