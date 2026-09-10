"use client";

import { useRef } from "react";

export function ScrollRow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
  const moved = useRef(false);
  const startX = useRef(0);
  const startScroll = useRef(0);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") {
      return;
    }
    dragging.current = true;
    moved.current = false;
    startX.current = event.clientX;
    startScroll.current = ref.current?.scrollLeft ?? 0;
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current || !ref.current) {
      return;
    }
    const dx = event.clientX - startX.current;
    if (Math.abs(dx) > 6) {
      moved.current = true;
    }
    ref.current.scrollLeft = startScroll.current - dx;
  }

  function handlePointerUp() {
    dragging.current = false;
  }

  function handleClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    if (moved.current) {
      event.preventDefault();
      event.stopPropagation();
      moved.current = false;
    }
  }

  return (
    <div
      ref={ref}
      className={`no-scrollbar flex gap-2 overflow-x-auto pb-1 ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClickCapture={handleClickCapture}
    >
      {children}
    </div>
  );
}
