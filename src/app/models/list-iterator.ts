
export interface ListIterator<T> {
    cursor: number;
    hasNext: () => boolean;
    next: () => Promise<T>;
}