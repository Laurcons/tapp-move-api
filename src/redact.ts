
/**
 * Delete properties of an object and returns it as a copy, TypeScript style.
 */
export default function redact<T, K extends keyof T>(object: T, properties: K | K[]): Omit<T, K> {
    const redactable = Object.assign({}, object) as any;
    if (!Array.isArray(properties)) {
        properties = [properties];
    }
    properties.forEach(prop => {
        redactable[prop] = undefined;
    });
    return redactable as Omit<T, K>;
}

