import { FileText } from "lucide-react";
import ComingSoon from "../components/ComingSoon";

const DocumentsManagement: React.FC = () => {
  return (
    <ComingSoon
      title="Documents Management"
      description="Manage and organize documents"
      icon={FileText}
    />
  );
};

export default DocumentsManagement;
