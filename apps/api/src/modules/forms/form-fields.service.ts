import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Small helper service around FormField rows.
 * Field CRUD is handled inside FormsService.createForm / updateForm — this
 * service exists for future extensions (reorder without full replace, batch
 * updates, per-field metadata reads).
 */
@Injectable()
export class FormFieldsService {
  constructor(private readonly prisma: PrismaService) {}

  async reorder(formId: string, orderedIds: string[]): Promise<void> {
    await this.prisma.$transaction(
      orderedIds.map((fieldId, index) =>
        this.prisma.formField.update({
          where: { id: fieldId },
          data: { order: index, formId },
        }),
      ),
    );
  }

  async getById(fieldId: string) {
    return this.prisma.formField.findUnique({ where: { id: fieldId } });
  }
}
