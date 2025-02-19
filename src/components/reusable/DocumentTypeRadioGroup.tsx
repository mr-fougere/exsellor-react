import { UseFormRegister } from "react-hook-form";
import { DocumentType, DocumentFontAwesomeIcon } from "../../interfaces/enum";
import { useTranslation } from "react-i18next";

type RadioGroupWithIconsProps = {
  id: string;
  name: string;
  requiredMessage: string;
  selectedValue: string;
  register: UseFormRegister<any>;
};

const DocumentTypeRadioGroup = ({
  id,
  name,
  requiredMessage,
  register,
  selectedValue,
}: RadioGroupWithIconsProps) => {
  const { t } = useTranslation("", { keyPrefix: "enum.documentType" });

  const documentTypeFontAwesomeIcon = (documentType: DocumentType): string => {
    switch (documentType) {
      case DocumentType.CreditNote:
        return DocumentFontAwesomeIcon.CreditNote;
      case DocumentType.Delivery:
        return DocumentFontAwesomeIcon.Delivery;
      case DocumentType.Order:
        return DocumentFontAwesomeIcon.Order;
      default:
        return DocumentFontAwesomeIcon.Invoice;
    }
  };

  return (
    <div className="space-x-2 flex flex-row align-center mt-2 px-2">
      {Object.values(DocumentType).map((value) => (
        <label
          key={value}
          htmlFor={`${id}-${value}`}
          className={`flex items-center flex-col h-32 flex-1 p-2 border border-gray-300 rounded-md cursor-pointer justify-center 
            ${
              selectedValue === value
                ? "bg-cyan-600 text-white"
                : "bg-sky-50 text-gray-700"
            } 
            hover:bg-sky-200 .border-gray-300`}
        >
          <i
            className={`fa-solid ${documentTypeFontAwesomeIcon(
              value
            )} text-5xl w-full h-full flex justify-center items-center`}
          ></i>
          <span className="text-center px-2">{t(value)}</span>
          <input
            type="radio"
            id={`${id}-${value}`}
            defaultChecked={DocumentType.Invoice === value}
            value={value}
            {...register(name, { required: requiredMessage })}
            className="hidden"
          />
        </label>
      ))}
    </div>
  );
};

export default DocumentTypeRadioGroup;
