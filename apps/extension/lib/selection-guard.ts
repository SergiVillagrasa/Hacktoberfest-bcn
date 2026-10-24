// A navigation invalidates every pending publication, including errors and loading cleanup.
export class SelectionGuard {
  private generation = 0;
  begin(): number { return ++this.generation; }
  snapshot(): number { return this.generation; }
  isCurrent(generation: number): boolean { return this.generation === generation; }
}
