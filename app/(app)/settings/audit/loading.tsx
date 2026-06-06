import { ListSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl">
      <ListSkeleton rows={8} />
    </div>
  );
}
