// (C) 2007-2020 GoodData Corporation
import React from "react";
import cx from "classnames";
import noop from "lodash/noop";
import isNil from "lodash/isNil";
import { LegendList } from "./LegendList";
import { ButtonsOrientationType, Paging } from "./Paging";
import { BOTTOM, TOP } from "./PositionTypes";
import { calculateStaticLegend, ITEM_HEIGHT, STATIC_PAGING_HEIGHT } from "./helpers";
import { IPushpinCategoryLegendItem, ItemBorderRadiusPredicate } from "./types";
import { LegendLabelItem } from "./LegendLabelItem";

/**
 * @internal
 */
export interface IStaticLegendProps {
    containerHeight: number;
    position: string;
    series: IPushpinCategoryLegendItem[];
    enableBorderRadius?: boolean | ItemBorderRadiusPredicate;
    shouldFillAvailableSpace?: boolean;
    label?: string;
    buttonOrientation?: ButtonsOrientationType;
    onItemClick?(item: IPushpinCategoryLegendItem): void;
    paginationHeight?: number;
    customComponent?: JSX.Element | null;
}

/**
 * @internal
 */
export class StaticLegend extends React.PureComponent<IStaticLegendProps> {
    public static defaultProps: Partial<IStaticLegendProps> = {
        buttonOrientation: "upDown",
        paginationHeight: STATIC_PAGING_HEIGHT,
    };

    public state = {
        page: 1,
    };

    public showNextPage = (): void => {
        this.setState({ page: this.state.page + 1 });
    };

    public showPrevPage = (): void => {
        this.setState({ page: this.state.page - 1 });
    };

    public renderPaging = (pagesCount: number): React.ReactNode => {
        const { page } = this.state;
        const { buttonOrientation } = this.props;

        return (
            <Paging
                page={page}
                pagesCount={pagesCount}
                showNextPage={this.showNextPage}
                showPrevPage={this.showPrevPage}
                buttonsOrientation={buttonOrientation}
            />
        );
    };

    public render(): React.ReactNode {
        const {
            enableBorderRadius,
            containerHeight,
            onItemClick = noop,
            position,
            series,
            shouldFillAvailableSpace = true,
            label,
            paginationHeight,
            customComponent,
        } = this.props;
        const { page } = this.state;

        const classNames = cx("viz-legend", "static", `position-${position}`);

        // Without paging
        if (position === TOP || position === BOTTOM) {
            return (
                <div className={classNames}>
                    <div className="series">
                        <LegendList
                            enableBorderRadius={enableBorderRadius}
                            series={series}
                            onItemClick={onItemClick}
                        />
                    </div>
                </div>
            );
        }

        const columnNum = position === "dialog" ? 2 : 1;

        const labelHeight = label ? ITEM_HEIGHT : 0;
        const labelComponent = label ? <LegendLabelItem label={label} /> : null;
        const contentHeight = containerHeight - labelHeight;

        const seriesCount = series.length;
        const { hasPaging, visibleItemsCount } = calculateStaticLegend(
            seriesCount,
            contentHeight,
            columnNum,
            paginationHeight,
        );

        const heightOfAvailableSpace = (visibleItemsCount / columnNum) * ITEM_HEIGHT;
        const heightOfVisibleItems = Math.min(visibleItemsCount / columnNum, seriesCount) * ITEM_HEIGHT;
        const seriesHeight =
            (shouldFillAvailableSpace ? heightOfAvailableSpace : heightOfVisibleItems) + labelHeight;
        const shouldDisplayCustomComponent = page === 1 && this.hasCustomComponent();
        const pagesCount = this.getPagesCount(series.length, visibleItemsCount);

        if (shouldDisplayCustomComponent) {
            return (
                <div className={classNames}>
                    <div className="series" style={{ height: seriesHeight }}>
                        {labelComponent}
                        {customComponent}
                    </div>
                    {hasPaging && this.renderPaging(pagesCount)}
                </div>
            );
        }

        const start = this.getPagedSeriesStart(page, visibleItemsCount);
        const end = this.getPagedSeriesEnd(page, visibleItemsCount, series.length);
        const pagedSeries = series.slice(start, end);
        const visibleItemsFitOneColumn = shouldItemsFitOneColumn(
            visibleItemsCount,
            columnNum,
            pagedSeries.length,
        );

        const fullClassNames = cx(classNames, {
            "no-width": visibleItemsFitOneColumn,
        });

        return (
            <div className={fullClassNames}>
                <div className="series" style={{ height: seriesHeight }}>
                    {labelComponent}
                    <LegendList
                        enableBorderRadius={enableBorderRadius}
                        series={pagedSeries}
                        onItemClick={onItemClick}
                    />
                </div>
                {hasPaging && this.renderPaging(pagesCount)}
            </div>
        );
    }

    private getPagesCount(seriesLength: number, visibleItemsCount: number) {
        const defaultPagesCount = Math.ceil(seriesLength / visibleItemsCount);
        return this.hasCustomComponent() ? defaultPagesCount + 1 : defaultPagesCount;
    }

    private getPagedSeriesStart(page: number, visibleItemsCount: number) {
        /**
         * used "2" because the custom component is rendered on the very first page
         */
        return this.hasCustomComponent() ? (page - 2) * visibleItemsCount : (page - 1) * visibleItemsCount;
    }

    private getPagedSeriesEnd(page: number, visibleItemsCount: number, seriesLength: number) {
        return Math.min(visibleItemsCount * page, seriesLength);
    }

    private hasCustomComponent() {
        return !isNil(this.props.customComponent);
    }
}

const shouldItemsFitOneColumn = (visibleItemsCount: number, columnNum: number, pagedSeriesLength: number) =>
    visibleItemsCount / columnNum >= pagedSeriesLength;
