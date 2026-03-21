import { useEffect } from 'react';

function getDescriptionMetaTag(): HTMLMetaElement {
  const existing = document.querySelector('meta[name="description"]');
  if (existing instanceof HTMLMetaElement) {
    return existing;
  }

  const tag = document.createElement('meta');
  tag.name = 'description';
  document.head.appendChild(tag);
  return tag;
}

export function usePageMeta(title: string, description?: string): void {
  useEffect(() => {
    const nextTitle = title.trim() ? `${title.trim()} | Payonar` : 'Payonar';
    document.title = nextTitle;

    if (description) {
      const metaTag = getDescriptionMetaTag();
      metaTag.content = description;
    }
  }, [title, description]);
}
