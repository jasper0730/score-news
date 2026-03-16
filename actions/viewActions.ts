'use server'

import { getCollection, NewsDocument } from '@/libs/db'

export async function incrementViewAction(articleId: string) {
    try {
        const newsCollection = await getCollection<NewsDocument>('news')
        const result = await newsCollection.findOneAndUpdate(
            { article_id: articleId },
            { $inc: { views: 1 } },
            { returnDocument: 'after' }
        )
        return { success: true as const, views: (result?.views as number) ?? 1 }
    } catch (error) {
        console.error('Error in incrementViewAction:', error)
        return { success: false as const, views: 0 }
    }
}
