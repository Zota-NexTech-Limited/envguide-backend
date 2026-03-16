import { Server } from "lucide-react";
import ComingSoon from "../components/ComingSoon";

const HardwareManagement: React.FC = () => {
  return (
    <ComingSoon
      title="Hardware Management"
      description="Manage IT hardware and equipment"
      icon={Server}
    />
  );
};

export default HardwareManagement;
