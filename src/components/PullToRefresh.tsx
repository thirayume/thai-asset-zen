import { RefreshCw } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
}

export const PullToRefresh = ({ onRefresh }: PullToRefreshProps) => {
  const { isPulling, isRefreshing, pullDistance, threshold } = usePullToRefresh({
    onRefresh,
  });

  const shouldShow = isPulling || isRefreshing;
  const rotation = isRefreshing ? 360 : (pullDistance / threshold) * 360;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-200"
      style={{
        transform: `translateY(${shouldShow ? pullDistance : -100}px)`,
        opacity: shouldShow ? 1 : 0,
      }}
    >
      <div className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg mt-4">
        <RefreshCw
          className={`h-6 w-6 ${isRefreshing ? 'animate-spin' : ''}`}
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isRefreshing ? 'none' : 'transform 0.2s',
          }}
        />
      </div>
    </div>
  );
};
