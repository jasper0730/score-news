import { NextResponse } from "next/server";
import { newsData } from "@/libs/datas/newsData";
import axios from "axios";
const API_KEY = process.env.NEWSDATA_API_KEY;

export async function GET() {
  const API_URL = `https://newsdata.io/api/1/latest?country=tw&category=world&apikey=${API_KEY}`;
  try {
    const { data } = await axios.get(API_URL);
    return NextResponse.json(
      {
        success: true,
        data: data.results,
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
    return NextResponse.json(
      {
        success: true,
        data: newsData.results,
      },
      { status: 200 }
      // {
      //   success: false,
      //   message: error instanceof Error ? error.message : error
      // },
      // { status: 500 }
    );
  }
}
