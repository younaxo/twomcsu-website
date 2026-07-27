'use client';

import { useEffect, useRef } from 'react';
import { SkinViewer } from 'skinview3d';
import { cn } from '@/lib/utils';

interface SkinViewer3DProps {
  minecraftNick: string | null;
  className?: string;
  width?: number;
  height?: number;
}

export function SkinViewer3D({
  minecraftNick,
  className,
  width = 280,
  height = 400,
}: SkinViewer3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<SkinViewer | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !minecraftNick) {
      return;
    }

    const viewer = new SkinViewer({
      canvas: canvasRef.current,
      width,
      height,
      skin: `https://mc-heads.net/skin/${encodeURIComponent(minecraftNick)}`,
    });

    viewer.autoRotate = true;
    viewer.autoRotateSpeed = 0.6;
    viewerRef.current = viewer;

    return () => {
      viewer.dispose();
      viewerRef.current = null;
    };
  }, [minecraftNick, width, height]);

  if (!minecraftNick) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border border-dashed border-border bg-secondary/40 text-sm text-muted-foreground',
          className,
        )}
        style={{ width, height }}
      >
        Привяжите Minecraft ник
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={cn('rounded-lg bg-secondary/30', className)}
      style={{ width, height }}
    />
  );
}
