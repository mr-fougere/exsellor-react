import { useEffect, useState } from "react";
import {
  CreditNoteStep,
  DeliveryStep,
  DocumentType,
  DraftStep,
  InvoiceStep,
  OrderStep,
} from "../../interfaces/enum";
import { DocumentStep, DocumentSteps } from "../../interfaces/sellsy.interface";
import { useTranslation } from "react-i18next";
import { UseFormRegister } from "react-hook-form";

type StepMultiSelectorProps = {
  name: string;
  id: string;
  documentType: DocumentType;
  register: UseFormRegister<any>;
  selectedValues: DocumentSteps | undefined;
};

export default function StepMultiSelector({
  name,
  id,
  documentType,
  register,
  selectedValues,
}: StepMultiSelectorProps) {
  const { t } = useTranslation("", { keyPrefix: "enum.steps" });
  const [availableSteps, setAvailableSteps] = useState<DocumentSteps>([]);
  const [selectedSteps, setSelectedSteps] = useState<DocumentSteps>(
    selectedValues || availableSteps
  );

  useEffect(() => {
    let steps = null;
    switch (documentType) {
      case DocumentType.Invoice:
        steps = InvoiceStep;
        break;
      case DocumentType.CreditNote:
        steps = CreditNoteStep;
        break;
      case DocumentType.Delivery:
        steps = DeliveryStep;
        break;
      case DocumentType.Order:
        steps = OrderStep;
        break;
      default:
        steps = DraftStep;
        break;
    }

    setAvailableSteps(Object.values(steps));
    setSelectedSteps(excludeDraftStep(Object.values(steps)));
  }, [documentType]);

  const excludeDraftStep = (steps: DocumentSteps) => {
    return steps.filter((step) => step !== DraftStep.Draft);
  };

  // Fonction pour ajouter ou retirer une étape à la sélection
  const handleStepClick = (step: DocumentStep) => {
    setSelectedSteps((prevSteps) => {
      if (prevSteps.includes(step)) {
        return prevSteps.filter((selectedStep) => selectedStep !== step); // Retirer l'étape
      } else {
        return [...prevSteps, step]; // Ajouter l'étape
      }
    });
  };

  // Mettre à jour le formulaire avec les étapes sélectionnées
  useEffect(() => {
    register(name, { value: selectedSteps }); // Mettez à jour la valeur du champ avec les étapes sélectionnées
  }, [selectedSteps, register, name]);

  return (
    <div className="flex flex-row items-center justify-center mt-2 px-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 px-2 flex-1">
        {availableSteps?.map((step) => (
          <button
            id={`${id}-${step}`}
            type="button"
            key={step}
            onClick={() => handleStepClick(step)}
            className={`rounded p-2 hover:border-cyan-500 border rounded ${
              selectedSteps.includes(step) ? "bg-sky-300" : "bg-sky-50"
            }`}
          >
            <div>{t(step)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
