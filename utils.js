function debounce(cb, delay = 1000) {
	let timeoutId;
	return (...args) => {
		if (timeoutId) clearTimeout(timeoutId);
		timeoutId = setTimeout(() => cb(...args), delay);
	};
}
