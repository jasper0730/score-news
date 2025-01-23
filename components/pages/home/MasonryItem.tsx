import NewsCard from "@/components/newsCard/NewsCard";
import { NewsDataType } from "@/types/news";
import { useEffect, useRef } from "react";

interface MasonryItemProps {
  item: NewsDataType;
  onResize: (height: number) => void;
}

const MasonryItem = ({ item, onResize }: MasonryItemProps) => {
  const itemRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === itemRef.current) {
          onResize(entry.contentRect.height);
        }
      }
    });

    if (itemRef.current) {
      observer.observe(itemRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [onResize]);

  return (
    <div ref={itemRef} className="masonry-item mb-[24px]">
      <NewsCard
        title={item.title}
        description={item.description}
        date={item.pubDate}
        sourceIcon={item.source_icon}
        sourceName={item.source_name}
        sourceUrl={item.source_url}
        rate={item.rate}
      />
    </div>
  );
};

export default MasonryItem;