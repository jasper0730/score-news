import { NewsDataType } from '@/types/news'
import Modal from '@/components/molecules/Modal'
import NewsDetail from '@/components/organisms/NewsDetail'

interface NewsModalProps {
    data: NewsDataType | null
    onClose: () => void
    open: boolean
    onRatingUpdate: (postId: string, newRating: number) => void
}

const NewsModal = ({ data, open, onClose, onRatingUpdate }: NewsModalProps) => {
    return (
        <Modal className="h-full max-h-[900px] w-full max-w-[1000px]" open={open} onClose={onClose}>
            <NewsDetail data={data} onClose={onClose} onRatingUpdate={onRatingUpdate} />
        </Modal>
    )
}

export default NewsModal
