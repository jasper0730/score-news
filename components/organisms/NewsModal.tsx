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
        <Modal
            className="flex h-screen w-full max-w-[1000px] overflow-auto"
            open={open}
            onClose={onClose}
        >
            <NewsDetail data={data} onClose={onClose} onRatingUpdate={onRatingUpdate} />
        </Modal>
    )
}

export default NewsModal
