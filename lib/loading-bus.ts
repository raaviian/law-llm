// Tiny global counter for the app-wide loading overlay. Any client component can
// push/pop, and the overlay shows while the count is > 0. Kept framework-free so
// it can be imported from any client module without prop-drilling a context.

let count = 0;
const listeners = new Set<(active: boolean) => void>();

function emit() {
  const active = count > 0;
  listeners.forEach((l) => l(active));
}

export function subscribeLoading(l: (active: boolean) => void): () => void {
  listeners.add(l);
  l(count > 0);
  return () => listeners.delete(l);
}

export function pushLoading() {
  count += 1;
  emit();
}

export function popLoading() {
  if (count > 0) {
    count -= 1;
    emit();
  }
}
