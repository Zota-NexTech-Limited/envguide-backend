import { Calendar } from "lucide-react";
import ComingSoon from "../components/ComingSoon";

const Bookings: React.FC = () => {
  return (
    <ComingSoon
      title="Bookings"
      description="Manage room and suite bookings"
      icon={Calendar}
    />
  );
};

export default Bookings;
