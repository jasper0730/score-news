"use client"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react";
import Image from "next/image";
import { BsFillMoonStarsFill } from "react-icons/bs";
import { MdSunny } from "react-icons/md";

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="w-4">
        <Image
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAC/ghZPgAAAAAASUVORK5CYII="
          alt="Transparent Placeholder"
          fill
          style={{
            objectFit: 'contain',
          }}
          className="pointer-events-none select-none"
        />
      </div>
    )
  };

  const iconClass = "hover:opacity-50 duration-300 cursor-pointer";

  return (
    <>
      <div className="flex items-center w-[20px]">
        {resolvedTheme === 'dark' &&
          <MdSunny onClick={() => setTheme("light")} className={iconClass} size={20} />
        }
        {resolvedTheme === 'light' &&
          <BsFillMoonStarsFill onClick={() => setTheme("dark")} className={iconClass} size={20} />
        }
      </div >
    </>
  );
};

export default ThemeSwitcher;