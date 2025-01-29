import { NextResponse } from "next/server";
import { newsData } from "@/libs/datas/newsData";
import clientPromise from "@/libs/mongodb";
// import axios from "axios";

// const API_KEY = process.env.NEWSDATA_API_KEY;

export async function GET(request: Request) {
  // const API_URL = `https://newsdata.io/api/1/latest?country=tw&category=world&apikey=${API_KEY}`;
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  try {
    // const { data } = await axios.get(API_URL)
    const client = await clientPromise;
    const db = client.db();
    const favoritesCollection = db.collection("favorites");
    // const allData = data.status === 'success' ? data : newsData
    const allData = newsData

    if (userId) {
      const userFavorites = await favoritesCollection.findOne({ userId });

      if (userFavorites && userFavorites.postIds) {
        const favoriteSet = new Set(userFavorites.postIds);
        const updatedData = allData.results.map((item) => ({
          ...item,
          favorite: favoriteSet.has(item.article_id),
        }));

        return NextResponse.json(
          {
            success: true,
            data: updatedData,
          },
          { status: 200 }
        );
      }
    }
    return NextResponse.json(
      {
        success: true,
        data: allData.results,
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
    return NextResponse.json(
      // {
      //   success: true,
      //   data: newsData.results,
      // },
      // { status: 200 }
      {
        success: false,
        message: error instanceof Error ? error.message : error
      },
      { status: 500 }
    );
  }
}
