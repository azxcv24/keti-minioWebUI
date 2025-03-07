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
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '../../styles/globals.css'
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
import useSWR from 'swr'

export default function Grid() {
	const gridRef = useRef();
	const containerStyle = useMemo(() => ({ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }), []);
	const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
	const [columnDefs, setColumnDefs] = useState([
		{
			headerName: 'ID',
			maxWidth: 100,
			valueGetter: 'node.id',
			cellRenderer: (props) => {
				if (props.value !== undefined) {
					return props.value;
				} else {
					return (
						<img src="https://www.ag-grid.com/example-assets/loading.gif" />
					);
				}
			},
		},
	]);
	const defaultColDef = useMemo(() => {
		return {
			flex: 1,
			resizable: true,
			minWidth: 100,
		};
	}, []);
	const [url, setUrl] = React.useState<any>("");
	const [params, setParams] = React.useState<any>({});
	const [loading, setLoading] = React.useState(false);

	useEffect(() => {
		let params = (new URL(window.location.href)).searchParams;
		const url = params.get("url");
		const bucket = params.get("bucket");
		const prefix = params.get("prefix");
		const version_id = params.get("version_id");
		if(url) setUrl(url)
			else setUrl(`${process.env.NEXT_PUBLIC_API_URL}/csv/preview?bucket=${bucket}&prefix=${prefix}&version_id=${version_id}`)
		setParams({ url, bucket, prefix, version_id });
	}, []);

	const onGridReady = useCallback((params) => {
		const dataSource = {
			rowCount: undefined,
			getRows: (params) => {
				console.log(
					'asking for ' + params.startRow + ' to ' + params.endRow
				);
				fetch(`${url}&format=ag&start=${params.startRow}&limit=${params.endRow - params.startRow}`).then(resp => {
					return resp.json()
				}).then(data => {
					console.log(data)
					var coldefs = [{
						headerName: 'ID',
						maxWidth: 100,
						// it is important to have node.id here, so that when the id changes (which happens
						// when the row is loaded) then the cell is refreshed.
						valueGetter: 'node.id',
						cellRenderer: (props) => {
							if (props.value !== undefined) {
								return props.value;
							} else {
								return (
									<img src="https://www.ag-grid.com/example-assets/loading.gif" />
								);
							}
						},
					},]
					for (var i = 0; i < data.ncols; i++) {
						coldefs.push({ field: '' + i })
					}
					setColumnDefs(coldefs)

					var lastRow = -1;
					if (data.nrows < params.endRow) {
						lastRow = data.nrows;
					}
					params.successCallback(data.rows, lastRow);
					//gridRef.current.api.paginationGoToFirstPage();
				})
			},
		};
		params.api.setDatasource(dataSource);
	}, [url]);

	const getRowStyle = params => {
		if (params.data && params.data.meta && params.data.meta.HL) {
			return { background: 'rgb(244 63 94)', fontWeight: 'bold' }
		}
		return {}
	}

	if (!url) {
		return <></>;
	}

	return (
		<div style={containerStyle}>
			<div>{params.url || `bucket: ${params.bucket} prefix: ${params.prefix} version: ${params.version_id}`}</div>
			<div style={gridStyle} className="ag-theme-alpine">
				<AgGridReact
					ref={gridRef}
					columnDefs={columnDefs}
					defaultColDef={defaultColDef}
					rowBuffer={0}
					rowSelection={'multiple'}
					rowModelType={'infinite'}
					cacheBlockSize={100}
					cacheOverflowSize={2}
					maxConcurrentDatasourceRequests={1}
					infiniteInitialRowCount={1000}
					maxBlocksInCache={10}
					onGridReady={onGridReady}
					getRowStyle={getRowStyle}
					pagination={true}
				/>
			</div>
		</div>
	);
}
