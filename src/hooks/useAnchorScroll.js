import { useEffect } from "react";
import { useLocation } from "react-router-dom"; // Or your router's equivalent hook

export function useAnchorScroll() {
	const { pathname, hash } = useLocation();

	useEffect(() => {
		// 1. Stop the browser from forcing its own historical scroll position
		if ("scrollRestoration" in window.history) {
			window.history.scrollRestoration = "manual";
		}

		// 2. If an anchor exists (e.g., #contact), target and scroll to it
		if (hash) {
			const element = document.getElementById(hash.replace("#", ""));
			if (element) {
				// Timeout ensures the DOM has completely painted the target component
				setTimeout(() => {
					element.scrollIntoView({ behavior: "smooth", block: "start" });
				}, 0);
				return;
			}
		}

		// 3. Fallback: Scroll to top if there's no hash on route change
		window.scrollTo(0, 0);
	}, [pathname, hash]);
}
