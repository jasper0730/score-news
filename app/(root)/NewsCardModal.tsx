import { NewsDataType } from "@/types/news";
import { IoIosCloseCircle } from "react-icons/io";


type NewsCardModalProps = {
  data: NewsDataType
}
const NewsCardModal = ({ data }: NewsCardModalProps) => {
  return (<div className="w-full relative p-20">
    <IoIosCloseCircle size={50} className="absolute top-0 right-0 translate-y-[-50%] translate-x-[50%] " />
    <h2>{data.title}</h2>
    <p>{data.description}</p>
  </div>);
}

export default NewsCardModal;