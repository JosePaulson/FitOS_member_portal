import { useEffect, useId, useRef, useState } from 'react';

export default function RecentScans({ scans = [], scansLoading = false }) {
	const [open, setOpen] = useState(false);
	const contentRef = useRef(null);
	const [height, setHeight] = useState('auto');
	const contentId = useId();

	useEffect(() => {
		if (!contentRef.current) return;

		if (open) {
			const el = contentRef.current;
			setHeight(`${el.scrollHeight}px`);

			const raf = requestAnimationFrame(() => {
				setHeight('auto');
			});

			return () => cancelAnimationFrame(raf);
		}

		const el = contentRef.current;
		setHeight(`${el.scrollHeight}px`);

		const raf = requestAnimationFrame(() => {
			setHeight('0px');
		});

		return () => cancelAnimationFrame(raf);
	}, [open, scans.length]);

	return (
		<div>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				aria-controls={contentId}
				className="flex items-center justify-between w-full mb-3 text-sm font-bold"
				style={{ color: 'var(--color-primary)' }}
			>
				<span>Recent scans</span>

				<span
					className="inline-flex items-center gap-2 text-xs transition-transform duration-300"
					style={{ color: 'var(--color-secondary)' }}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						className={`transition-transform duration-300 ${open ? 'rotate-180' : 'rotate-0'}`}
					>
						<path
							d="M6 9l6 6 6-6"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
					{open ? 'Hide' : 'Show'}
				</span>
			</button>

			<div
				id={contentId}
				ref={contentRef}
				style={{
					height,
					overflow: 'hidden',
					opacity: open ? 1 : 0,
					transform: open ? 'translateY(0px)' : 'translateY(-6px)',
					transition: 'height 300ms ease, opacity 220ms ease, transform 300ms ease',
					willChange: 'height, opacity, transform',
				}}
			>
				<div className="flex flex-col gap-2 pb-1">
					{!scansLoading && scans.length > 0 ? (
						scans.map((s) => (
							<div key={s._id} className="flex items-center justify-between gap-3 p-4 card">
								<div className="min-w-0">
									<p className="text-sm font-semibold truncate" style={{ color: 'var(--color-primary)' }}>
										{s.mealLabel || 'Scanned meal'}
									</p>
									<p className="text-xs mt-0.5" style={{ color: 'var(--color-secondary)' }}>
										{new Intl.DateTimeFormat('en-IN', {
											day: 'numeric',
											month: 'short',
											hour: 'numeric',
											minute: '2-digit',
											hour12: true,
											timeZone: 'Asia/Kolkata',
										}).format(new Date(s.createdAt))}
									</p>
								</div>

								<span className="text-sm font-bold shrink-0" style={{ color: 'var(--color-accent)' }}>
									🔥 {s.totalCalories} kcal
								</span>
							</div>
						))
					) : !scansLoading ? (
						<div className="p-4 card" style={{ color: 'var(--color-secondary)' }}>
							No recent scans.
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}