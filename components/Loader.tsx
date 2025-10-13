'use client'
import { SyncLoader } from 'react-spinners'

const Loader = () => {
    return (
        <div className="flex items-center justify-center h-[80dvh]">
            <SyncLoader color="gray" />
        </div>
    )
}

export default Loader
