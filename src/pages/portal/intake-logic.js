export function isVisible(item, values) {
  const c = item.show_when;
  if (!c) return true;
  if (c.all)
    return c.all.every((child) => isVisible({ show_when: child }, values));
  if (c.any)
    return c.any.some((child) => isVisible({ show_when: child }, values));
  const value = values[c.field];
  if (c.in) return c.in.includes(value);
  if (c.not_empty)
    return (
      value != null &&
      (Array.isArray(value) ? value.length > 0 : String(value).trim() !== "")
    );
  return value === c.equals;
}
export const hasAnswer = (entry) =>
  ["already_on_file", "not_applicable"].includes(entry?.applicability) ||
  (entry?.value != null &&
    (Array.isArray(entry.value)
      ? entry.value.length > 0
      : String(entry.value).trim() !== ""));
export const documentComplete = (status) =>
  ["under_review", "accepted", "already_on_file", "not_applicable"].includes(
    status,
  );
export function intakeState(definition, responses, requirements = []) {
  const values = Object.fromEntries(
    Object.entries(responses).map(([key, entry]) => [key, entry.value]),
  );
  const modules = (definition?.modules || []).filter((module) =>
    isVisible(module, values),
  );
  const missing = [];
  let total = 0;
  modules.forEach((module, sectionIndex) => {
    module.fields
      .filter((field) => field.required && isVisible(field, values))
      .forEach((field) => {
        total++;
        if (!hasAnswer(responses[field.key]))
          missing.push({
            key: "field-" + field.key,
            fieldKey: field.key,
            label: field.label,
            section: module.title,
            sectionIndex,
          });
      });
    (module.requirements || [])
      .filter((r) => isVisible(r, values))
      .forEach((r) => {
        const requirement = requirements.find(
          (item) => item.requirement_key === r.key,
        );
        if (requirement?.necessity !== "required") return;
        total++;
        if (!documentComplete(requirement.status))
          missing.push({
            key: "requirement-" + requirement.id,
            label: requirement.requirement_name,
            section: module.title,
            sectionIndex,
          });
      });
  });
  return {
    modules,
    values,
    missing,
    progress: total
      ? Math.floor(((total - missing.length) * 100) / total)
      : 100,
  };
}

export const intakeLocked = (status) =>
  [
    "submitted",
    "under_review",
    "waiting_on_alchemize",
    "approved",
    "completed",
    "archived",
  ].includes(status);
