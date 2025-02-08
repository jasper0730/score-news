// import axios from "axios";
// import { toastBox } from "./toast";

// export const updateRating = async (postId: string, newRating: number): Promise<number | null> => {
//   try {
//     const response = await axios.post("/api/rating", { id: postId, rate: newRating });
//     if (response.data.state === "success") {
//       return response.data.avgRating;
//     }
//   } catch (error) {
//     console.error("Failed to update rating:", error);
//   }
//   return null;
// };

// export const toggleFavorite = async (id: string): Promise<boolean> => {
//   try {
//     const res = await axios.post("/api/favorite", { id });
//     if (!res.data.success) throw new Error("Failed to update favorite");

//     toastBox(res.data.message === "Favorite removed" ? "移除收藏" : "已收藏", "success");
//     return true;
//   } catch (error) {
//     console.error("Failed to update favorite:", error);
//     return false;
//   }
// };
