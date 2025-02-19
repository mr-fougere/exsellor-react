import { useForm } from "react-hook-form";
import {
  ExportEstimation,
  ExportInformations,
  ExportInputs,
} from "../../interfaces/export.interface";
import { formatInputDate } from "../../libs/DateFormatter";
import { useEffect, useRef, useState } from "react";
import SellsyClient from "../../services/SellsyClient";
import MonthSelector from "../reusable/MonthSelector";
import ExportArchivist from "../../services/ExportArchivist";
import { bakeFileName } from "../../libs/Helpers";
import { DocumentType, InvoiceStep } from "../../interfaces/enum";
import { PeriodDates } from "../../interfaces/sellsy.interface";
import DocumentTypeRadioGroup from "../reusable/DocumentTypeRadioGroup";
import StepMultiSelector from "../reusable/StepMultiSelector";

type ExportFormProps = {
  setExportInputs: Function;
  sellsyClient: SellsyClient;
  documentTypePeriodDates: { [key in DocumentType]: PeriodDates };
};

const today = new Date();
const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth());
const formattedFirstDay = formatInputDate(firstDayOfMonth);
const formattedToday = formatInputDate(today);

const ExportForm = ({
  setExportInputs,
  sellsyClient,
  documentTypePeriodDates,
}: ExportFormProps) => {
  const { register, handleSubmit, setValue, watch } = useForm<ExportInputs>();
  const exportArchivist = useRef<ExportArchivist>(new ExportArchivist());

  const [estimating, setEstimating] = useState<boolean>(false);
  const [archiveUrl, setArchiveUrl] = useState<string | undefined>(undefined);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(event.target.value);
    const endOfMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      0
    );
    const firstOfMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1
    );

    if (
      selectedDate.getDate() === endOfMonth.getDate() &&
      event.target.id == "end-date"
    ) {
      setValue("periodStartInputDate", formatInputDate(firstOfMonth));
    } else if (
      selectedDate.getDate() === 1 &&
      event.target.id == "start-date"
    ) {
      setValue("periodEndInputDate", formatInputDate(endOfMonth));
    }
  };

  const onSubmit = async (data: ExportInputs) => {
    const formattedData: ExportInformations = {
      ...data,
      periodStartDate: new Date(data.periodStartInputDate),
      periodEndDate: new Date(data.periodEndInputDate),
    };

    setEstimating(true);

    await estimateExport(formattedData)
      .then((estimation) => {
        if (estimation.docCount === 0) {
          alert("Aucun document de ce type sur cette période");
        } else {
          formattedData.estimatedTime = estimation.estimatedTime;
          formattedData.documentCount = estimation.docCount;
          setExportInputs(formattedData);
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setEstimating(false);
      });
  };

  const estimateExport = (
    data: ExportInformations
  ): Promise<ExportEstimation> => {
    return new Promise((resolve, reject) => {
      sellsyClient
        .getDocumentsInfos(data)
        .then((infos) => {
          const docCount = parseInt(infos.nbtotal);
          resolve({ docCount, estimatedTime: docCount * 2 });
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  const periodStartInputDate = watch("periodStartInputDate", formattedFirstDay);
  const periodEndInputDate = watch("periodEndInputDate", formattedToday);
  const documentType = watch("documentType", DocumentType.Invoice);
  const documentSteps = watch("steps");

  const setDates = ({ start, end }: { start: Date; end: Date }) => {
    setValue("periodStartInputDate", formatInputDate(start));
    setValue("periodEndInputDate", formatInputDate(end));
  };

  const filename = bakeFileName(
    documentType,
    new Date(periodStartInputDate),
    new Date(periodEndInputDate)
  );

  useEffect(() => {
    if (exportArchivist.current.isArchived(filename)) {
      setArchiveUrl(exportArchivist.current.archiveUrl(filename));
      return;
    } else {
      setArchiveUrl(undefined);
    }
  }, [filename]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 w-2/5">
      <div>
        <label
          htmlFor="documentType"
          className="block text-sm font-bold text-gray-700"
        >
          Choisissez un type de document
        </label>
        <DocumentTypeRadioGroup
          name="documentType"
          id="doctype"
          requiredMessage="required"
          register={register}
          selectedValue={documentType}
        ></DocumentTypeRadioGroup>
      </div>

      <div>
        <label
          htmlFor="choix"
          className="block text-sm font-bold text-gray-700"
        >
          Choisissez les status des documents
        </label>
        <StepMultiSelector
          name="steps"
          id="steps"
          documentType={documentType}
          register={register}
          selectedValues={documentSteps}
        />
      </div>

      <div>
        <label
          htmlFor="choix"
          className="block text-sm font-bold text-gray-700"
        >
          Choisissez une période
        </label>
        <MonthSelector
          documentTypePeriodDates={documentTypePeriodDates[documentType]}
          setDates={setDates}
          selectedDates={{
            start: new Date(periodStartInputDate),
            end: new Date(periodEndInputDate),
          }}
        />
      </div>

      <div className="flex flex-row space-x-2 px-4">
        <div className="flex-1">
          <label
            htmlFor="start-date"
            className="block text-sm font-medium text-gray-700"
          >
            Date de début
          </label>
          <input
            defaultValue={formattedFirstDay}
            type="date"
            id="start-date"
            {...register("periodStartInputDate", {
              required: "Ce champ est requis",
              onChange: handleDateChange,
            })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="end-date"
            className="block text-sm font-medium text-gray-700"
          >
            Date de fin
          </label>
          <input
            max={formattedToday}
            defaultValue={formattedToday}
            type="date"
            id="end-date"
            {...register("periodEndInputDate", {
              required: "Ce champ est requis",
              onChange: handleDateChange,
            })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {archiveUrl ? (
        <a
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-4"
          href={archiveUrl}
          download={filename}
        >
          <span>Télécharger l'archive</span>
        </a>
      ) : (
        <button
          type="submit"
          disabled={estimating}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-4 "
        >
          {estimating && <i className="fa-solid fa-spinner fa-spin mr-2"></i>}
          <span>
            {estimating ? "Lancement de l'export" : "Lancer l'export"}
          </span>
        </button>
      )}
    </form>
  );
};

export default ExportForm;
