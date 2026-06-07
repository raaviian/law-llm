import { ListSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl">
      <ListSkeleton rows={4} />
    </div>
  );
}
