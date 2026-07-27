'use client';

import { useEffect, useRef, useState } from 'react';
import { SkinViewer } from 'skinview3d';
import { cn } from '@/lib/utils';

interface SkinViewer3DProps {
  minecraftNick: string | null;
  className?: string;
  width?: number;
  height?: number;
  /** Stretch to fill parent; uses ResizeObserver */
  fill?: boolean;
}

export function SkinViewer3D({
  minecraftNick,
  className,
  width = 280,
  height = 400,
  fill = false,
}: SkinViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<SkinViewer | null>(null);
  const [size, setSize] = useState({ width, height });

  useEffect(() => {
    if (!fill || !containerRef.current) {
      setSize({ width, height });
      return;
    }

    const el = containerRef.current;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const nextW = Math.max(200, Math.floor(rect.width));
      const nextH = Math.max(320, Math.floor(rect.height));
      setSize({ width: nextW, height: nextH });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fill, width, height]);

  useEffect(() => {
    if (!canvasRef.current || !minecraftNick) {
      return;
    }

    const viewer = new SkinViewer({
      canvas: canvasRef.current,
      width: size.width,
      height: size.height,
      skin: `https://mc-heads.net/skin/${encodeURIComponent(minecraftNick)}`,
    });

    viewer.autoRotate = true;
    viewer.autoRotateSpeed = 0.6;
    viewerRef.current = viewer;

    return () => {
      viewer.dispose();
      viewerRef.current = null;
    };
  }, [minecraftNick, size.width, size.height]);

  if (!minecraftNick) {
    return (
      <div
        ref={containerRef}
        className={cn(
          'flex items-center justify-center rounded-lg border border-dashed border-border bg-secondary/40 text-sm text-muted-foreground',
          fill && 'h-full min-h-[320px] w-full',
          className,
        )}
        style={fill ? undefined : { width, height }}
      >
        Привяжите Minecraft ник
      </div>
    );
  }

  if (fill) {
    return (
      <div ref={containerRef} className={cn('h-full min-h-[320px] w-full', className)}>
        <canvas
          ref={canvasRef}
          className="h-full w-full rounded-lg bg-secondary/30"
          style={{ width: size.width, height: size.height }}
        />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={cn('rounded-lg bg-secondary/30', className)}
      style={{ width: size.width, height: size.height }}
    />
  );
}
