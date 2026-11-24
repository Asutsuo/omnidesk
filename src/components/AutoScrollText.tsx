import {
  useRef,
  useState,
  useEffect,
  type ElementType,
  type CSSProperties,
} from "react";

type AutoScrollTextProps = {
  text: string;
  as?: "span" | "div" | "strong" | "h3" | "h2" | "em" | "p";
  className?: string;
  title?: string;
};

export default function AutoScrollText({
  text,
  as: Component = "span",
  className = "",
  title,
}: AutoScrollTextProps) {
  const containerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const [overflowData, setOverflowData] = useState<{
    overflow: boolean;
    dist: number;
    duration: number;
  }>({
    overflow: false,
    dist: 0,
    duration: 3,
  });

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const measure = () => {
      const containerWidth = container.clientWidth;
      const contentWidth = content.scrollWidth;
      const diff = contentWidth - containerWidth;

      if (diff > 3) {
        // ~32px/s reading speed, minimum 2.8s, maximum 9s
        const duration = Math.max(2.8, Math.min(9, diff / 32));
        setOverflowData({
          overflow: true,
          dist: diff,
          duration,
        });
      } else {
        setOverflowData({
          overflow: false,
          dist: 0,
          duration: 3,
        });
      }
    };

    measure();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        measure();
      });
      ro.observe(container);
      ro.observe(content);
    }

    return () => {
      ro?.disconnect();
    };
  }, [text]);

  const Tag = Component as ElementType;

  const style: CSSProperties | undefined = overflowData.overflow
    ? ({
        "--scroll-dist": `-${overflowData.dist}px`,
        "--scroll-duration": `${overflowData.duration}s`,
      } as CSSProperties)
    : undefined;

  return (
    <Tag
      ref={containerRef}
      className={`autoscroll-container ${className}`}
      data-overflow={overflowData.overflow ? "true" : "false"}
      style={style}
      title={title ?? text}
    >
      <span ref={contentRef} className="autoscroll-content">
        {text}
      </span>
    </Tag>
  );
}

