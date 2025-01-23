import NewsCards from "@/components/pages/home/NewsCards";
import axios from "axios";
const API_URL = process.env.API_URL
export default async function Home() {
  let newsData = [];
  try {
    const res = await axios.get(`${API_URL}/api/news`)
    newsData = res.data
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
  }
  return (
    <>
      <NewsCards data={newsData} />
    </>
  );

}