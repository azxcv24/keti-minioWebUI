import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react'; 

export default function GridLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="flex flex-col h-screen w-screen">
			<div className="flex-grow">
				{children}
			</div>
		</section>
	);
}
