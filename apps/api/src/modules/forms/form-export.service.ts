import { Injectable } from '@nestjs/common';
import { ExportResult, ExportService } from '../export/export.service';
import { ExportFormDto } from './dto/forms.dto';
import { FormResponsesService, stringifyAnswer } from './form-responses.service';
import { FormsService } from './forms.service';

@Injectable()
export class FormExportService {
  constructor(
    private readonly forms: FormsService,
    private readonly responses: FormResponsesService,
    private readonly exportService: ExportService,
  ) {}

  async exportResponses(formId: string, dto: ExportFormDto): Promise<ExportResult> {
    const form = await this.forms.requireForm(formId);
    const responses = await this.responses.listResponsesForExport(formId, {
      from: dto.from,
      to: dto.to,
      completeOnly: dto.completeOnly,
    });

    const rows = responses.map((response) => {
      const answersByField = new Map(
        response.answers.map((answer) => [answer.fieldId, answer]),
      );

      const row: Record<string, string | number | null> = {
        ID: response.id,
        Дата: response.createdAt.toISOString(),
        Автор: response.respondent?.username ?? (response.isAnonymous ? 'Аноним' : ''),
        Завершено: response.isComplete ? 'Да' : 'Нет',
      };

      for (const field of form.fields) {
        row[field.label] = stringifyAnswer(field.type, answersByField.get(field.id));
      }

      return row;
    });

    const filename = `form-${form.slug}-${Date.now()}`;
    return this.exportService.export(rows, filename, dto.format);
  }
}
