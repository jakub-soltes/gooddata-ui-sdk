// (C) 2020 GoodData Corporation

import { action } from "@storybook/addon-actions";
import { storiesOf } from "@storybook/react";
import React from "react";
import { DefaultColorPalette } from "@gooddata/sdk-ui/dist/cjs/base";
import ColorDropdown from "@gooddata/sdk-ui-ext/dist/cjs/internal/components/configurationControls/colors/colorDropdown/ColorDropdown";
import ColoredItemContent from "@gooddata/sdk-ui-ext/dist/cjs/internal/components/configurationControls/colors/coloredItemsList/ColoredItemContent";
import { getLargePalette } from "../mocks/testColorHelper";
import { withMultipleScreenshots } from "../../../_infra/backstopWrapper";
import { ConfigurationControls } from "../../../_infra/storyGroups";
import { InternalIntlWrapper } from "@gooddata/sdk-ui-ext/dist/cjs/internal/utils/internalIntlProvider";
import "@gooddata/sdk-ui-ext/styles/internal/css/config_panel.css";
import "../controlStyles.css";

const wrapperStyle = {
    width: 400,
    height: 400,
    paddingTop: 200,
};
const german = "de-DE";

const defaultScenarios = {
    closed: {},
    opened: {
        clickSelector: ".icon-navigatedown",
        postInteractionWait: 200,
    },
};

const customPicker = {
    ...defaultScenarios,
    "select-custom-color": {
        clickSelectors: [".s-colored-items-list-item", ".s-custom-section-button"],
        postInteractionWait: 200,
    },
};

storiesOf(`${ConfigurationControls}/Colors/ColorDropdown`, module)
    .add("ColorDropdown", () => {
        return withMultipleScreenshots(
            <div style={wrapperStyle} className="screenshot-target">
                <InternalIntlWrapper>
                    <ColorDropdown
                        colorPalette={DefaultColorPalette}
                        onColorSelected={action("onColorSelect")}
                        showCustomPicker={false}
                    >
                        <ColoredItemContent
                            text="<<< this color hardcoded for tests"
                            color={{ r: 20, g: 178, b: 226 }}
                        />
                    </ColorDropdown>
                </InternalIntlWrapper>
            </div>,
            defaultScenarios,
        );
    })
    .add("ColorDropdown pre-selected with large palette", () => {
        return withMultipleScreenshots(
            <div style={wrapperStyle} className="screenshot-target">
                <InternalIntlWrapper>
                    <ColorDropdown
                        selectedColorItem={{ type: "guid", value: "11_12" }}
                        colorPalette={getLargePalette()}
                        onColorSelected={action("onColorSelect")}
                        showCustomPicker={false}
                    >
                        <ColoredItemContent
                            text="<<< this color hardcoded for tests"
                            color={{ r: 20, g: 178, b: 226 }}
                        />
                    </ColorDropdown>
                </InternalIntlWrapper>
            </div>,
            defaultScenarios,
        );
    })
    .add("ColorDropdown with custom picker", () => {
        return withMultipleScreenshots(
            <div style={wrapperStyle} className="screenshot-target">
                <InternalIntlWrapper>
                    <ColorDropdown
                        colorPalette={DefaultColorPalette}
                        onColorSelected={action("onColorSelect")}
                        showCustomPicker={true}
                    >
                        <ColoredItemContent
                            text="<<< this color hardcoded for tests"
                            color={{ r: 20, g: 178, b: 226 }}
                        />
                    </ColorDropdown>
                </InternalIntlWrapper>
            </div>,
            customPicker,
        );
    })
    .add("ColorDropdown with custom picker - localized", () => {
        return withMultipleScreenshots(
            <div style={wrapperStyle} className="screenshot-target">
                <InternalIntlWrapper locale={german}>
                    <ColorDropdown
                        colorPalette={DefaultColorPalette}
                        onColorSelected={action("onColorSelect")}
                        showCustomPicker={true}
                    >
                        <ColoredItemContent
                            text="<<< this color hardcoded for tests"
                            color={{ r: 20, g: 178, b: 226 }}
                        />
                    </ColorDropdown>
                </InternalIntlWrapper>
            </div>,
            customPicker,
        );
    });
