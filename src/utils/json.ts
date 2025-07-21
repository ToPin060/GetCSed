export function toJsonString(obj: unknown): string {
    try {
        return JSON.stringify(obj);
    } catch (error) {
        console.error("Erreur lors de la conversion en string JSON :", error);
        return "";
    }
}

export function fromJsonString<T>(jsonString: string): T | null {
    try {
        return JSON.parse(jsonString) as T;
    } catch (error) {
        console.error("Erreur lors du parsing JSON :", error);
        return null;
    }
}