import { NewsDataType } from "@/types/news";
import Modal from "./Modal";
import NewsDetail from "./newsDetail/NewsDetail";

type NewsModalType = {
  data: NewsDataType | null;
  onClose: () => void;
  open: boolean;
  onRatingUpdate: (postId: string, newRating: number) => void;
};
const NewsModal = ({
  data,
  open,
  onClose,
  onRatingUpdate,
}: NewsModalType) => {
  return <>
    <Modal className="max-w-[1000px] w-[full] overflow-auto h-screen flex" open={open} onClose={onClose}>
      <NewsDetail data={data} onClose={onClose} onRatingUpdate={onRatingUpdate} />
    </Modal>
  </>;
};

export default NewsModal;