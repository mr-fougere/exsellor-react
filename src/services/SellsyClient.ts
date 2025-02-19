import Sellsy from "node-sellsy";
import { ExportInformations } from "../interfaces/export.interface";
import {
  DocumentResult,
  DocumentsOutput,
  DocumentSteps,
  PeriodDates,
} from "../interfaces/sellsy.interface";
import {
  CreditNoteStep,
  DeliveryStep,
  DocumentType,
  DraftStep,
  InvoiceStep,
  OrderStep,
} from "../interfaces/enum";
import { CredentialInputs } from "../interfaces/credential.interface";

class SellsyClient {
  private sellsy: typeof Sellsy;

  constructor() {
    this.sellsy = null;
  }

  setup(credentials: CredentialInputs) {
    this.sellsy = new Sellsy({
      creds: {
        consumerKey: credentials.consumerToken,
        consumerSecret: credentials.consumerSecret,
        userToken: credentials.userToken,
        userSecret: credentials.userSecret,
      },
    });
  }

  get isSetup(): boolean {
    return this.sellsy !== null;
  }

  async getDocumentsInfos({
    documentType,
    periodStartDate,
    periodEndDate,
    steps,
  }: ExportInformations): Promise<any> {
    const { infos } = await this.getDocuments(
      documentType,
      1,
      1,
      {
        start: periodStartDate,
        end: periodEndDate,
      },
      steps
    );
    return infos;
  }

  private getStoredDocTypesPeriodDates():
    | {
        [key in DocumentType]: PeriodDates;
      }
    | null {
    const storedDocTypesPeriodDates = localStorage.getItem(
      "documentTypesPeriodDates"
    );

    if (!storedDocTypesPeriodDates) {
      return null;
    }

    const parsedDocTypesPeriodDates: {
      [key in DocumentType]: { start: string; end: string };
    } = storedDocTypesPeriodDates ? JSON.parse(storedDocTypesPeriodDates) : {};
    const documentTypesPeriodDates: { [key in DocumentType]: PeriodDates } = {
      order: { start: new Date(1), end: new Date() },
      invoice: { start: new Date(1), end: new Date() },
      creditnote: { start: new Date(1), end: new Date() },
      delivery: { start: new Date(1), end: new Date() },
    };
    for (const key in parsedDocTypesPeriodDates) {
      const documentTypeKey = key as DocumentType;
      documentTypesPeriodDates[documentTypeKey] = {
        start: new Date(parsedDocTypesPeriodDates[documentTypeKey].start),
        end: new Date(parsedDocTypesPeriodDates[documentTypeKey].end),
      };
    }
    return documentTypesPeriodDates;
  }

  async getAllDocTypesPeriodDates(): Promise<{
    [key in DocumentType]: PeriodDates;
  }> {
    //const storedDocTypesPeriodDates = this.getStoredDocTypesPeriodDates();
    //if (storedDocTypesPeriodDates) return storedDocTypesPeriodDates;

    const documentTypes = Object.values(DocumentType);
    const documentTypesPeriodDates: { [key in DocumentType]: PeriodDates } = {
      order: { start: new Date(1), end: new Date() },
      invoice: { start: new Date(1), end: new Date() },
      creditnote: { start: new Date(1), end: new Date() },
      delivery: { start: new Date(1), end: new Date() },
    };

    for (const documentType of documentTypes) {
      const periodDates = await this.getDocTypePeriodDates(documentType);
      documentTypesPeriodDates[documentType as DocumentType] = periodDates;
    }

    localStorage.setItem(
      "documentTypesPeriodDates",
      JSON.stringify(documentTypesPeriodDates)
    );

    return documentTypesPeriodDates;
  }

  async getDocTypePeriodDates(
    documentType: DocumentType
  ): Promise<PeriodDates> {
    const { documents: firstDocuments, infos: firstDocumentsInfos } =
      await this.getDocuments(documentType, 1, 1);
    const { documents: lastDocuments } = await this.getDocuments(
      documentType,
      firstDocumentsInfos.nbpages,
      1
    );

    const firstKey = Object.keys(firstDocuments)[0];
    const firstDocumentTypeDate = new Date(firstDocuments[firstKey].created);
    const lastKey = Object.keys(lastDocuments)[0];
    const lastDocumentTypeDate = new Date(lastDocuments[lastKey].created);

    return {
      start: firstDocumentTypeDate,
      end: lastDocumentTypeDate,
    };
  }

  private defaultDocTypeSteps(documentType: DocumentType): DocumentSteps {
    let stepEnum = null;

    switch (documentType) {
      case DocumentType.Order:
        stepEnum = OrderStep;
        break;
      case DocumentType.Invoice:
        stepEnum = InvoiceStep;
        break;
      case DocumentType.CreditNote:
        stepEnum = CreditNoteStep;
        break;
      case DocumentType.Delivery:
        stepEnum = DeliveryStep;
        break;
      default:
        stepEnum = DraftStep;
        break;
    }

    return Object.values(stepEnum);
  }

  async getDocuments(
    documentType: DocumentType,
    pagenum: number = 1,
    nbperpage: number = 1,
    periodDates: PeriodDates = { start: new Date(1), end: new Date() },
    steps?: DocumentSteps
  ): Promise<DocumentsOutput> {
    const convertedDates = {
      start: periodDates.start.getTime() / 1000,
      end: periodDates.end.getTime() / 1000,
    };

    const result: DocumentResult = await this.sellsy.api({
      method: "Document.getList",
      params: {
        doctype: documentType,
        pagination: {
          nbperpage: nbperpage,
          pagenum: pagenum,
        },
        search: {
          periodecreationDate_start: convertedDates.start,
          periodecreationDate_end: convertedDates.end,
          steps: steps ?? this.defaultDocTypeSteps(documentType),
        },
      },
    });

    return {
      infos: result.response.infos,
      documents: result.response.result,
      status: result.response.status,
    };
  }

  async getDocument(type: string, id: string): Promise<any> {
    try {
      const document = await this.sellsy.documents.getById(type, id);
      return document;
    } catch (error) {
      console.error("Error retrieving document:", error);
      throw new Error();
    }
  }
}

export default SellsyClient;
