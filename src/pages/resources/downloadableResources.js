export const DOWNLOADABLE_RESOURCE_IDS = Object.freeze({
  consultation: "consultation-preparation-workbook",
  startup: "business-startup-formation-workbook",
  operations: "business-operations-systems-workbook",
  individualTax: "individual-tax-preparation-organizer",
  businessTax: "business-tax-preparation-organizer",
});

const englishDownloadMap = Object.freeze({
  [DOWNLOADABLE_RESOURCE_IDS.consultation]:
    "/assets/downloads/consultation-preparation-workbook.pdf",
  [DOWNLOADABLE_RESOURCE_IDS.startup]:
    "/assets/downloads/business-startup-formation-workbook.pdf",
  [DOWNLOADABLE_RESOURCE_IDS.operations]:
    "/assets/downloads/business-operations-systems-workbook.pdf",
  [DOWNLOADABLE_RESOURCE_IDS.individualTax]:
    "/assets/downloads/individual-tax-preparation-organizer.pdf",
  [DOWNLOADABLE_RESOURCE_IDS.businessTax]:
    "/assets/downloads/business-tax-preparation-organizer.pdf",
});

const spanishDownloadMap = Object.freeze({
  [DOWNLOADABLE_RESOURCE_IDS.consultation]:
    "/assets/downloads/es/consultation-preparation-workbook-es.pdf",
  [DOWNLOADABLE_RESOURCE_IDS.startup]:
    "/assets/downloads/es/business-startup-formation-workbook-es.pdf",
  [DOWNLOADABLE_RESOURCE_IDS.operations]:
    "/assets/downloads/es/business-operations-systems-workbook-es.pdf",
  [DOWNLOADABLE_RESOURCE_IDS.individualTax]:
    "/assets/downloads/es/individual-tax-preparation-organizer-es.pdf",
  [DOWNLOADABLE_RESOURCE_IDS.businessTax]:
    "/assets/downloads/es/business-tax-preparation-organizer-es.pdf",
});

export const downloadableResources = Object.freeze([
  {
    id: DOWNLOADABLE_RESOURCE_IDS.consultation,
    title: "Consultation Preparation Workbook",
    download: englishDownloadMap[DOWNLOADABLE_RESOURCE_IDS.consultation],
    spanishDownload: spanishDownloadMap[DOWNLOADABLE_RESOURCE_IDS.consultation],
  },
  {
    id: DOWNLOADABLE_RESOURCE_IDS.startup,
    title: "Business Startup & Formation Workbook",
    download: englishDownloadMap[DOWNLOADABLE_RESOURCE_IDS.startup],
    spanishDownload: spanishDownloadMap[DOWNLOADABLE_RESOURCE_IDS.startup],
  },
  {
    id: DOWNLOADABLE_RESOURCE_IDS.operations,
    title: "Business Operations & Systems Workbook",
    download: englishDownloadMap[DOWNLOADABLE_RESOURCE_IDS.operations],
    spanishDownload: spanishDownloadMap[DOWNLOADABLE_RESOURCE_IDS.operations],
  },
  {
    id: DOWNLOADABLE_RESOURCE_IDS.individualTax,
    title: "Individual Tax Preparation Organizer",
    download: englishDownloadMap[DOWNLOADABLE_RESOURCE_IDS.individualTax],
    spanishDownload:
      spanishDownloadMap[DOWNLOADABLE_RESOURCE_IDS.individualTax],
  },
  {
    id: DOWNLOADABLE_RESOURCE_IDS.businessTax,
    title: "Business Tax Preparation Organizer",
    download: englishDownloadMap[DOWNLOADABLE_RESOURCE_IDS.businessTax],
    spanishDownload: spanishDownloadMap[DOWNLOADABLE_RESOURCE_IDS.businessTax],
  },
]);

export const downloadableResourceById = new Map(
  downloadableResources.map((resource) => [resource.id, resource]),
);

export function getDownloadableResource(id, locale = "en") {
  const resource = downloadableResourceById.get(id);
  if (!resource) throw new Error(`Unknown downloadable resource: ${id}`);
  return locale === "es"
    ? { ...resource, download: resource.spanishDownload }
    : resource;
}
