import { useRef, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons/AppleIcons";

interface HorizontalCarouselProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

const HorizontalCarousel = ({
  title,
  subtitle,
  action,
  children,
}: HorizontalCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir * Math.max(280, el.clientWidth * 0.75),
      behavior: "smooth",
    });
  };

  return (
    <section className="relative group/carousel flex flex-col gap-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-1.5">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label={`Scroll ${title} left`}
          className="hidden md:flex absolute -left-3 top-[40%] -translate-y-1/2 z-20 h-9 w-9 items-center justify-center rounded-full border border-black/10 dark:border-white/15 bg-white/85 dark:bg-zinc-900/85 text-zinc-900 dark:text-white shadow-xl backdrop-blur-xl opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:scale-105"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2"
        >
          {children}
        </div>

        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label={`Scroll ${title} right`}
          className="hidden md:flex absolute -right-3 top-[40%] -translate-y-1/2 z-20 h-9 w-9 items-center justify-center rounded-full border border-black/10 dark:border-white/15 bg-white/85 dark:bg-zinc-900/85 text-zinc-900 dark:text-white shadow-xl backdrop-blur-xl opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:scale-105"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
};

export default HorizontalCarousel;
