import { getUser } from "@/actions/getUser";
import DashboardNewsCards from "./DashboardNewsCards";

const DashboardPage = async () => {
  const currentUser = await getUser()
  return (
    <>
      <DashboardNewsCards user={currentUser}/>
    </>
  );
}

export default DashboardPage;