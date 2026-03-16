import { useParams } from "react-router-dom";
import type { SetupEntity } from "../../lib/dataSetupService";
import DataSetupTabs from "./DataSetupTabs";

// Format entity name for display
const formatEntityName = (entityName: string) => {
  return entityName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const DataSetup: React.FC = () => {
  const { entity: urlEntity } = useParams<{ entity: string }>();
  const entity = urlEntity as SetupEntity;

  if (!entity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Entity
          </h1>
          <p className="text-gray-600 mb-4">
            The requested data setup entity was not found.
          </p>
        </div>
      </div>
    );
  }

  const title = formatEntityName(entity);
  const description = `Manage ${formatEntityName(entity)} configurations`;

  return (
    <DataSetupTabs
      title={title}
      description={description}
      tabs={[
        {
          key: "default",
          label: title,
          entity: entity,
        },
      ]}
      defaultTab="default"
    />
  );
};

export default DataSetup;
