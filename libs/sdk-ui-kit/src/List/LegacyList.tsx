// (C) 2007-2020 GoodData Corporation
import React, { Component } from "react";
import { Table, Column, Cell } from "fixed-data-table-2";
import cx from "classnames";
import { ScrollCallback } from "./List";

const BORDER_HEIGHT = 1;

const preventDefault = (e: Event) => e.preventDefault();

function isTouchDevice() {
    return "ontouchstart" in document.documentElement;
}

/**
 * @internal
 */
export interface ILegacyListProps {
    className?: string;
    compensateBorder?: boolean;
    dataSource: any;
    height?: number;
    itemHeight: number;
    itemHeightGetter?: () => number;
    onScroll?: ScrollCallback;
    onScrollStart?: ScrollCallback;
    onSelect?: (item: any) => void;
    scrollToSelected?: boolean;
    rowItem: React.ReactElement;
    width?: number;
}

/**
 * @internal
 */
export interface ILegacyListState {
    selected: number;
}

/**
 * @deprecated  This component is deprecated use List instead
 * @internal
 */
export class LegacyList extends Component<ILegacyListProps, ILegacyListState> {
    static defaultProps: Partial<ILegacyListProps> = {
        className: "",
        onScroll: (): void => {},
        onScrollStart: (): void => {},
        onSelect: (): void => {},
        width: 200,
        height: 300,
        itemHeight: 28,
        itemHeightGetter: null,
        compensateBorder: true,
        scrollToSelected: false,
    };

    constructor(props: ILegacyListProps) {
        super(props);

        this.state = {
            selected: null,
        };
    }

    public componentDidMount(): void {
        const { scrollToSelected, dataSource } = this.props;

        if (scrollToSelected) {
            [...Array(dataSource.rowsCount).keys()].forEach((row) => {
                const item = this.props.dataSource.getObjectAt(row);
                if (item && item.selected) {
                    // Because list items start from 0 we need to add the +1 here
                    this.setState({ selected: row + 1 });
                }
            });
        }
    }

    public componentWillUnmount(): void {
        this.enablePageScrolling();
    }

    private onSelect = (_event: any, rowIndex: number) => {
        const { dataSource, onSelect } = this.props;
        const item = dataSource.getObjectAt(rowIndex);

        if (item) {
            onSelect(item);
        }
    };

    private onScroll(method: ScrollCallback, scrollY: number) {
        if (method) {
            const { height, itemHeight } = this.props;

            // vertical scroll position returned by fixed-data-table is converted to index of first visible item
            const rowIndex = Math.floor(scrollY / itemHeight);
            const visibleRange = Math.ceil(height / itemHeight);

            method(rowIndex, rowIndex + visibleRange);
        }
    }

    private onScrollStart = (_scrollX: number, scrollY: number) => {
        this.onScroll(this.props.onScrollStart, scrollY);
    };

    private onScrollEnd = (_scrollX: number, scrollY: number) => {
        this.onScroll(this.props.onScroll, scrollY);
    };

    private getClassNames() {
        return cx("gd-infinite-list", this.props.className);
    }

    private disablePageScrolling() {
        document.body.addEventListener("wheel", preventDefault, { passive: false });
    }

    private enablePageScrolling() {
        document.body.removeEventListener("wheel", preventDefault);
    }

    private renderCell = (props: any) => {
        const { dataSource, rowItem } = this.props;
        const item = dataSource.getObjectAt(props.rowIndex);

        const itemElement = React.cloneElement(rowItem, {
            ...(item ? { item } : {}),
            width: this.props.width,
            isFirst: props.rowIndex === 0,
            isLast: props.rowIndex === dataSource.rowsCount - 1,
        });

        return <Cell {...props}>{itemElement}</Cell>;
    };

    public render(): JSX.Element {
        const { width, height, itemHeight, dataSource, itemHeightGetter } = this.props;
        const { selected } = this.state;

        // compensates for https://github.com/facebook/fixed-data-table/blob/5373535d98b08b270edd84d7ce12833a4478c6b6/src/FixedDataTableNew.react.js#L872
        const compensatedHeight = this.props.compensateBorder ? height + BORDER_HEIGHT * 2 : height;

        return (
            <div
                className={this.getClassNames()}
                onMouseOver={this.disablePageScrolling}
                onMouseOut={this.enablePageScrolling}
            >
                <Table
                    width={width}
                    height={compensatedHeight}
                    rowHeight={itemHeight}
                    rowHeightGetter={itemHeightGetter}
                    headerHeight={0}
                    rowsCount={dataSource.rowsCount}
                    onRowClick={this.onSelect}
                    onScrollStart={this.onScrollStart}
                    onScrollEnd={this.onScrollEnd}
                    touchScrollEnabled={isTouchDevice()}
                    scrollToRow={selected}
                >
                    <Column flexGrow={1} width={1} cell={this.renderCell} />
                </Table>
            </div>
        );
    }
}
