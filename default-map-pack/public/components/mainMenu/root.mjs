/**
 * @file root.mjs
 * The main menu's root component.
 */

import controller from "/controller.mjs";

let selectedMapFile = "";

export default function MainMenu() {
    const { t, i18n } = ReactI18next.useTranslation();
    const [mapList, setMapList] = React.useState(controller.getModel("mapPack").mapFiles ?? []);

    React.useEffect(() => {
        // When the main menu component is mounted, set up our event handlers and the background.
        controller.setBackground("pack/assets/background.jpg");
        controller.updateComponentWhen(["MapsFolderScanned"], () => {
            // Need to copy the array. React will not re-render the list otherwise.
            setMapList([...controller.getModel("mapPack").mapFiles]);
        });
    }, []);

    return React.createElement(
        "div",
        null,
        React.createElement(
            "select",
            { size: 10, onInput: ev => (selectedMapFile = ev.target.value) },
            ...mapList.map(mapFile => React.createElement("option", null, mapFile))
        ),
        React.createElement("button", { onClick: () => controller.command("LoadMap", selectedMapFile) }, t("loadMap"))
    );
}
