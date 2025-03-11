"use client";
import { useShallow } from "zustand/shallow";
import { useNewsStore } from "@/store/newsStore";
import Button from "../../components/Button";

type SortButtonProps = {
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

  const buttonClass = `flex justify-center items-center gap-1 w-full  bg-gray-100 py-2 px-3 text-sm hover:bg-slate-800 hover:text-white duration-300 dark:bg-slate-800 dark:hover:opacity-100 md:w-[150px] 
  ${sortType === type ? "text-white bg-slate-800 dark:opacity-100" : "dark:opacity-70"}`;

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
