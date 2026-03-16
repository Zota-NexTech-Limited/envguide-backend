import DataSetupTabs from "./DataSetupTabs";

const Components = () => {
  return (
    <DataSetupTabs
      title="Component Setup Data"
      description="Define sub-categories within main product groups."
      tabs={[
        {
          key: "type",
          label: "Component Type",
          entity: "component-type",
        },
        {
          key: "category",
          label: "Component Category",
          entity: "component-category",
        },
      ]}
      defaultTab="type"
    />
  );
};

export default Components;
