import { NewsDataType } from "@/types/news";
import { IoIosCloseCircle } from "react-icons/io";


type NewsCardModalProps = {
  data: NewsDataType | null;
  onClose: () => void;
}
const CardModal = ({ data, onClose }: NewsCardModalProps) => {
  return (
    <>
      <div className=" p-20 relative bg-white dark:bg-gray-900 rounded-lg">
        <IoIosCloseCircle onClick={onClose} size={40} className="absolute top-[20px] left-[50%] cursor-pointer hover:rotate-90 duration-300" />
        <h2>{data?.title}</h2>
        <p>{data?.description}</p>
      </div>
    </>
  );
}

export default CardModal;