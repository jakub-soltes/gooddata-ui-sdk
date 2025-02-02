// (C) 2007-2018 GoodData Corporation
import { IPreparedExecution } from "@gooddata/sdk-backend-spi";
import { IBucket, IMeasure, INullableFilter, newBucket } from "@gooddata/sdk-model";
import React from "react";
import { BucketNames, Subtract, withContexts } from "@gooddata/sdk-ui";
import { IBucketChartProps, ICoreChartProps } from "../../interfaces";
import { CoreHeadline } from "./CoreHeadline";
import omit from "lodash/omit";

//
// Public interface
//

/**
 * @public
 */
export interface IHeadlineBucketProps {
    /**
     * Specify the measure whose value will be shown as the headline.
     */
    primaryMeasure: IMeasure;

    /**
     * Optionally specify secondary measure whose value will be shown for comparison with the primary measure.
     * The change in percent between the two values will also be calculated and displayed.
     */
    secondaryMeasure?: IMeasure;

    /**
     * Optionally specify filters to apply on the data to chart.
     */
    filters?: INullableFilter[];
}

/**
 * @public
 */
export interface IHeadlineProps extends IBucketChartProps, IHeadlineBucketProps {}

/**
 * [Headline](https://sdk.gooddata.com/gooddata-ui/docs/headline_component.html)
 * Headline shows a single number or compares two numbers. You can display both measures and attributes.
 *
 * Headlines have two sections: Measure (primary) and Measure (secondary).
 * You can add one item to each section. If you add two items, the headline also displays the change in percent.
 *
 * @public
 */
export const Headline = withContexts(RenderHeadline);

export function RenderHeadline(props: IHeadlineProps): JSX.Element {
    return <CoreHeadline {...toCoreHeadlineProps(props)} />;
}

//
// Internals
//

type IIrrelevantHeadlineProps = IHeadlineBucketProps & IBucketChartProps;
type IHeadlineNonBucketProps = Subtract<IHeadlineProps, IIrrelevantHeadlineProps>;

export function toCoreHeadlineProps(props: IHeadlineProps): ICoreChartProps {
    const buckets = [newBucket(BucketNames.MEASURES, props.primaryMeasure, props.secondaryMeasure)];

    const newProps: IHeadlineNonBucketProps = omit<IHeadlineProps, keyof IIrrelevantHeadlineProps>(props, [
        "primaryMeasure",
        "secondaryMeasure",
        "filters",
        "backend",
    ]);

    return {
        ...newProps,
        execution: createExecution(buckets, props),
        exportTitle: props.exportTitle || "Headline",
    };
}

function createExecution(buckets: IBucket[], props: IHeadlineProps): IPreparedExecution {
    const { backend, workspace } = props;

    return backend
        .withTelemetry("Headline", props)
        .workspace(workspace)
        .execution()
        .forBuckets(buckets, props.filters)
        .withDimensions({ itemIdentifiers: ["measureGroup"] });
}
