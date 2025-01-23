"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { NewsDataType } from "@/types/news";
import MasonryItem from "./MasonryItem";
import Modal from "@/components/modals/Modal";
import NewsCardModal from "./NewsCardModal";

interface MasonryLayoutProps {
  items: NewsDataType[];
  columns: number;
}

const MasonryLayout = ({ items, columns = 3 }: MasonryLayoutProps) => {
  // modal
  const [openModal, setOpenModal] = useState(false)
  const [modalItem, setModalItem] = useState<NewsDataType | null>(null)
  const handleModalOpen = (item: NewsDataType) => {
    setModalItem(item)
    setOpenModal(true);
  }
  const handleModalClose = () => {
    setOpenModal(false);
  }
  // 瀑布流
  const [columnItems, setColumnItems] = useState<NewsDataType[][]>(Array.from({ length: columns }, () => []));
  const columnHeights = useRef<number[]>(Array(columns).fill(0));
  const cardHeights = useRef<Map<string, number>>(new Map());

  const distributeItems = useCallback(() => {
    const newColumnItems: NewsDataType[][] = Array.from({ length: columns }, () => []);
    items.forEach((item) => {
      const height = cardHeights.current.get(item.article_id) || 100;
      const shortestColumnIndex = columnHeights.current.indexOf(
        Math.min(...columnHeights.current)
      );

      newColumnItems[shortestColumnIndex].push(item);
      columnHeights.current[shortestColumnIndex] += height;
    });

    setColumnItems(newColumnItems);
  }, [items, columns]);

  const handleCardResize = (id: string, height: number) => {
    if (cardHeights.current.get(id) !== height) {
      cardHeights.current.set(id, height);
      columnHeights.current.fill(0);
      distributeItems();
    }
  };

  useEffect(() => {
    distributeItems();
  }, [distributeItems]);

  return (
    <div className="masonry-container flex w-full gap-5">
      {columnItems.map((column, colIndex) => (
        <div key={colIndex} className="masonry-column w-full flex-1 gap-5">
          {column.map((item) => (
            <MasonryItem
              key={item.article_id}
              className="relative cursor-pointer before:absolute before:inset-0 before:bg-black/50 before:opacity-0 hover:before:opacity-100 before:duration-500"
              item={item}
              onResize={(height) => handleCardResize(item.article_id, height)}
              onClick={() => handleModalOpen(item)}
            />
          ))}
        </div>
      ))}
      {(openModal && modalItem) &&
        <Modal
          open={openModal}
          onClose={handleModalClose}
        >
          <NewsCardModal data={modalItem} />
        </Modal>}
    </div>
  );
};



export default MasonryLayout;
