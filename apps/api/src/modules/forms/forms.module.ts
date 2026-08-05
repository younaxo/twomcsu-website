import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ExportModule } from '../export/export.module';
import { UploadsModule } from '../uploads/uploads.module';
import { FormExportService } from './form-export.service';
import { FormFieldsService } from './form-fields.service';
import { FormResponsesService } from './form-responses.service';
import { FormValidationService } from './form-validation.service';
import { FormsAdminController } from './forms-admin.controller';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';

@Module({
  imports: [AuthModule, ExportModule, UploadsModule],
  controllers: [FormsController, FormsAdminController],
  providers: [
    FormsService,
    FormFieldsService,
    FormValidationService,
    FormResponsesService,
    FormExportService,
  ],
  exports: [FormsService],
})
export class FormsModule {}
