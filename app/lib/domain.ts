// Re-export for backward compatibility. Edit app/lib/config.ts instead.
import { appConfig } from "./config";

export const domainLabels = {
  singular: appConfig.entity.name,
  plural: appConfig.entity.plural,
  title: appConfig.entity.title,
  manager: "Data Manager",
  searchPlaceholder: `Search ${appConfig.entity.plural} or category...`,
  noItemsYet: `No ${appConfig.entity.plural} yet.`,
  loadSample: `Load sample ${appConfig.entity.plural}`,
  totalLabel: `Total ${appConfig.entity.title}`,
  sampleLabel: "sample data",
};
