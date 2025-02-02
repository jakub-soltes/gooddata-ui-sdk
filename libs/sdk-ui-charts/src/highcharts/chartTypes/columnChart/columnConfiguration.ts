// (C) 2007-2021 GoodData Corporation
import { IExecutionDefinition } from "@gooddata/sdk-model";
import { IChartConfig } from "../../../interfaces";
import { ITheme } from "@gooddata/sdk-backend-spi";
import { getCommonResponsiveConfig } from "../_chartCreators/responsive";
import { HighchartsOptions } from "../../../highcharts/lib";

import { MAX_POINT_WIDTH } from "../_chartCreators/commonConfiguration";
import { getAxesCounts } from "../_util/common";

export function getColumnConfiguration(
    config: IChartConfig,
    _definition: IExecutionDefinition,
    theme: ITheme,
): HighchartsOptions {
    const columnConfiguration = {
        chart: {
            type: "column",
            spacingTop: 20,
        },
        plotOptions: {
            column: {
                dataLabels: {
                    enabled: true,
                    padding: 2,
                },
                maxPointWidth: MAX_POINT_WIDTH,
            },
            series: {
                states: {
                    hover: {
                        enabled: false,
                    },
                },
            },
        },
        yAxis: [
            {
                stackLabels: {
                    enabled: true,
                    allowOverlap: false,
                    ...(theme?.palette?.complementary && {
                        style: {
                            color: theme?.palette?.complementary?.c9,
                            textOutline: "none",
                        },
                    }),
                },
            },
        ],
    };

    if (config?.enableCompactSize) {
        const [xAxesCount, yAxesCount] = getAxesCounts(config);
        return {
            ...columnConfiguration,
            responsive: getCommonResponsiveConfig(false, xAxesCount, yAxesCount),
        };
    }

    return columnConfiguration;
}
