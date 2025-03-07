// @ts-nocheck
'use client';
'use strict';
import {
	Navbar as NextUINavbar,
	NavbarContent,
	NavbarMenu,
	NavbarMenuToggle,
	NavbarBrand,
	NavbarItem,
	NavbarMenuItem,
} from "@nextui-org/navbar";
import {
	Listbox,
	ListboxSection,
	ListboxItem
} from "@nextui-org/react";
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '../styles/globals.css'
import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AgGridReact } from 'ag-grid-react';
import { Link } from "@nextui-org/link";
import { Snippet } from "@nextui-org/snippet";
import { Code } from "@nextui-org/code"
import { button as buttonStyles } from "@nextui-org/theme";
import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";

export default function Home() {
	const [buckets, setBuckets] = useState([])

	const load = async () => {
		const data = await (await fetch(`${process.env.NEXT_PUBLIC_API_URL}/s3/buckets`)).json();
		console.log(data);
		return data;
	};

	useEffect(() => {
		load().then(data => {

		});
	}, [])

	return (
			<div style={containerStyle}>
				<Listbox>
					<ListboxItem key='new'></ListboxItem>
					<ListboxItem key='new'></ListboxItem>
					<ListboxItem key='new'></ListboxItem>
				</Listbox>
			</div>
	);
}
