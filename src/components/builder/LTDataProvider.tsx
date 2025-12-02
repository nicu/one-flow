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
  // If a providerId is set and exists in DataProvidersContext, expose only
  // that model to children. This scopes child components to see only the
  // data the provider explicitly exposes (not the global app models).
  const data: Record<string, any[]> = {};
  const models = [] as any[];

  if (providerId && dp.models && dp.models[providerId]) {
    const model = dp.models[providerId];
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

  const contextValue: any = { dataStore };
  if (providerId) contextValue.currentModelId = providerId;

  return (
    <DataContext.Provider value={contextValue}>
      <div style={{ border: "1px dashed rgba(0,0,0,0.06)", padding: 8 }}>
        {children}
      </div>
    </DataContext.Provider>
  );
};

export default LTDataProvider;
