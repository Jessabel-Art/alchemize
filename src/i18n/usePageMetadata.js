import { useEffect } from "react";
import { useLanguage } from "./LanguageContext.jsx";

function ensureMeta(name, content) {
  let meta = document.head.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = name;
    document.head.append(meta);
  }
  meta.content = content;
}

export default function usePageMetadata(metadata) {
  const { language } = useLanguage();
  const localized = metadata[language] ?? metadata.en;

  useEffect(() => {
    document.title = localized.title;
    ensureMeta("description", localized.description);
  }, [localized.description, localized.title]);
}
