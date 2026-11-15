export const probe = (a) => {
	if (a) {
		return [`x ${a}`, "y", 'z'];
	}
	return '한글 테스트 — ✓';
};
