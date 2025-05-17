import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
  containerSelector?: string;
}

export const Portal: React.FC<PortalProps> = ({ 
  children, 
  containerSelector = 'body' 
}) => {
  const [container, setContainer] = useState<Element | null>(null);

  useEffect(() => {
    // 在客户端渲染时查找或创建容器
    const targetContainer = document.querySelector(containerSelector);
    setContainer(targetContainer);
  }, [containerSelector]);

  if (!container) return null;

  // 使用createPortal将children渲染到指定的DOM节点
  return createPortal(children, container);
}; 