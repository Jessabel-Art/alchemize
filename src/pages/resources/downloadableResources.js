export const DOWNLOADABLE_RESOURCE_IDS = Object.freeze({
  consultation: "consultation-preparation-workbook",
  startup: "business-startup-formation-workbook",
  operations: "business-operations-systems-workbook",
  individualTax: "individual-tax-preparation-organizer",
  businessTax: "business-tax-preparation-organizer",
});

export const downloadableResources = Object.freeze([
  {
    id: DOWNLOADABLE_RESOURCE_IDS.consultation,
    title: "Consultation Preparation Workbook",
    download: null,
  },
  {
    id: DOWNLOADABLE_RESOURCE_IDS.startup,
    title: "Business Startup & Formation Workbook",
    download: null,
  },
  {
    id: DOWNLOADABLE_RESOURCE_IDS.operations,
    title: "Business Operations & Systems Workbook",
    download: null,
  },
  {
    id: DOWNLOADABLE_RESOURCE_IDS.individualTax,
    title: "Individual Tax Preparation Organizer",
    download: null,
  },
  {
    id: DOWNLOADABLE_RESOURCE_IDS.businessTax,
    title: "Business Tax Preparation Organizer",
    download: null,
  },
]);

export const downloadableResourceById = new Map(
  downloadableResources.map((resource) => [resource.id, resource]),
);

export function getDownloadableResource(id) {
  const resource = downloadableResourceById.get(id);
  if (!resource) throw new Error(`Unknown downloadable resource: ${id}`);
  return resource;
}
