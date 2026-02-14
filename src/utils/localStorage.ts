export function setItem(key: string, value: unknown) {
	try {
		if (typeof window === "undefined") return;
		window.localStorage.setItem(key, JSON.stringify(value));
	} catch (error) {
		console.error(error);
	}
}

export function getItem(key: string) {
	try {
		if (typeof window === "undefined") return undefined;
		const item = window.localStorage.getItem(key);
		return item ? JSON.parse(item) : undefined;
	} catch (error) {
		console.error(error);
	}
}

export function removeItem(key: string) {
	try {
		if (typeof window === "undefined") return;
		window.localStorage.removeItem(key);
	} catch (error) {
		console.error(error);
	}
}
