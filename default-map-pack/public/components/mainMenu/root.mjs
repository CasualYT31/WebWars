/**
 * @file root.mjs
 * The main menu's root component.
 */

import controller from "/controller.mjs";

let image = "pack/assets/background.jpg";
controller.setBackground(image);

export default function MainMenu() {
    const { t, i18n } = ReactI18next.useTranslation();
    const [count, setCount] = React.useState(0);
    return React.createElement(
        "div",
        null,
        React.createElement("h1", { style: { color: "white" } }, count),
        React.createElement("button", { onClick: () => setCount(count + 1) }, t("increment")),
        React.createElement(
            "button",
            {
                onClick: () => {
                    let newLang = "de";
                    if (i18n.language == "de") {
                        newLang = "en";
                    }
                    controller.command("SetLanguage", newLang);
                },
            },
            t("lang")
        ),
        React.createElement(
            "button",
            {
                onClick: () => {
                    if (image == "pack/assets/background.jpg") {
                        image = "background.png";
                    } else {
                        image = "pack/assets/background.jpg";
                    }
                    controller.setBackground(image);
                },
            },
            "Image"
        )
    );
}