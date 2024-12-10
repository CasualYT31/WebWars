/**
 * @file root.mjs
 * The main menu's root component.
 */

import controller from "/src/mvc/controller.mjs";

export default function MainMenu() {
    let image = "assets/images/background.jpg";
    controller.setBackground(image);
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
                    if (image == "assets/images/background.jpg") {
                        image = "assets/images/background.png";
                    } else {
                        image = "assets/images/background.jpg";
                    }
                    controller.setBackground(image);
                },
            },
            "Image"
        )
    );
}
