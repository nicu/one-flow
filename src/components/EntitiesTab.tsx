import React from "react";
import type { DataStore, DataModel } from "../store/dataStore";
import EntitiesSidebar from "./EntitiesSidebar";
import EntitiesCanvas from "./EntitiesCanvas";

interface Props {
  dataStore: DataStore;
  setDataStore: (next: DataStore | ((prev: DataStore) => DataStore)) => void;
}

const EntitiesTab: React.FC<Props> = ({ dataStore, setDataStore }) => {
  const onUpdateModels = (models: DataModel[]) => {
    setDataStore((prev) => ({ ...prev, models }));
  };

  const onUpdateRelationships = (relationships: DataStore["relationships"]) => {
    setDataStore((prev) => ({ ...prev, relationships }));
  };

  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      <aside style={{ width: 360, borderRight: "1px solid #e5e5e5" }}>
        <EntitiesSidebar
          models={dataStore.models}
          relationships={dataStore.relationships}
          onChange={onUpdateModels}
          onChangeRelationships={(rels) => onUpdateRelationships(rels)}
        />
      </aside>
      <main style={{ flex: 1, height: "100%" }}>
        <EntitiesCanvas
          models={dataStore.models}
          relationships={dataStore.relationships}
          onChangeRelationships={onUpdateRelationships}
          onChangeModels={onUpdateModels}
        />
      </main>
    </div>
  );
};

export default EntitiesTab;
