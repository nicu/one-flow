import React from "react";
import { useTranslation } from "react-i18next";

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  return (
    <select
      className="example-select"
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      title="Change language"
    >
      <option value="en">EN</option>
      <option value="es">ES</option>
    </select>
  );
};

export default LanguageSelector;
