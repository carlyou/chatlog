/** Walk up from an element to find the nearest scrollable ancestor. */
export function findScrollableAncestor(el: Element): HTMLElement | null {
  let parent = el.parentElement;
  while (parent) {
    if (parent.scrollHeight > parent.clientHeight) {
      const style = getComputedStyle(parent);
      if (style.overflowY !== 'visible' && style.overflowY !== 'hidden') {
        return parent;
      }
    }
    parent = parent.parentElement;
  }
  return null;
}
