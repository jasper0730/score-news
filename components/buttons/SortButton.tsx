"use client";
import { useShallow } from "zustand/shallow";
import { useNewsStore } from "@/store/newsStore";
import Button from "./Button";

interface SortButtonProps {
  type: "rating" | "date";
}

const SortButton = ({ type }: SortButtonProps) => {
  const { sortType, setSortType } = useNewsStore(
    useShallow((state) => ({
      sortType: state.sortType,
      setSortType: state.setSortType,
    }))
  );

  const onButtonClick = () => {
    setSortType(type);
  };

  const buttonClass = `flex justify-center items-center gap-1 w-[150px] bg-gray-100 py-2 px-3 text-sm hover:bg-slate-800 hover:text-white duration-300 dark:bg-slate-800 dark:hover:opacity-70 ${sortType === type ? "text-white bg-slate-800" : undefined}`;

  return (
    <Button
      className={buttonClass}
      onClick={onButtonClick}
    >
      {type === "rating" && "評分最高"}
      {type === "date" && "最新"}
    </Button >
  );
};

export default SortButton;
