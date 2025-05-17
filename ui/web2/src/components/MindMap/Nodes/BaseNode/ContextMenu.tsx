import { useRef, useEffect, useState } from "react";
import type React from "react";

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });

  useEffect(() => {
    // Adjust menu position if it would render outside viewport
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let newX = x;
      let newY = y;
      
      if (x + rect.width > viewportWidth) {
        newX = viewportWidth - rect.width - 10;
      }
      
      if (y + rect.height > viewportHeight) {
        newY = viewportHeight - rect.height - 10;
      }
      
      if (newX !== x || newY !== y) {
        setPosition({ x: newX, y: newY });
      }
    }
  }, [x, y]);

  useEffect(() => {
    // Handle click outside
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Handle escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Add multiple event listeners
    window.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("touchstart", handleOutsideClick);
    window.addEventListener("keydown", handleKeyDown);

    // Clean up all event listeners
    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("touchstart", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-200 rounded shadow-lg min-w-[140px] py-1"
      style={{ left: position.x, top: position.y }}
      onContextMenu={e => e.preventDefault()}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className="w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
          onClick={e => {
            e.stopPropagation();
            item.onClick();
            onClose();
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default ContextMenu; 