export default function Component() {
    const { t, i18n } = ReactI18next.useTranslation();

    return React.createElement("p", { "data-testid": "message", style: { color: "#fff" } }, t("bye"));
}
