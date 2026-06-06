import { CaseHeaderSkeleton, OverviewSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <CaseHeaderSkeleton />
      <OverviewSkeleton />
    </div>
  );
}
