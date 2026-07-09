export function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

export function deepGet(target, path, fallbackValue) {
  const parts = Array.isArray(path) ? path : String(path || "").split(".").filter(Boolean);
  let current = target;
  for (const part of parts) {
    if (!current || typeof current !== "object" || !(part in current)) {
      return fallbackValue;
    }
    current = current[part];
  }
  return current;
}

export function deepSet(target, path, value) {
  const parts = Array.isArray(path) ? path : String(path || "").split(".").filter(Boolean);
  if (!parts.length) {
    return target;
  }
  let current = target;
  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      current[part] = value;
      return;
    }
    if (!current[part] || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part];
  });
  return target;
}

export function updateByPath(target, path, value) {
  const next = clone(target || {});
  deepSet(next, path, value);
  return next;
}
