'use client'

import { SyncLoader } from 'react-spinners'

const Loader = () => {
    return (
        <div
            className="flex h-[80dvh] items-center justify-center"
            role="status"
            aria-label="載入中"
        >
            <SyncLoader color="currentColor" className="text-muted-foreground" />
        </div>
    )
}

export default Loader
