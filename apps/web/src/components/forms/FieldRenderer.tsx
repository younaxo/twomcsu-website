'use client';

import { FormFieldType, type FormFieldDto } from '@twomc/shared';
import {
  AchievementSelectorField,
  AgreementChecklistField,
  CheckboxField,
  CodeEditorField,
  ColorPickerField,
  CurrencyAmountField,
  DateField,
  DateRangeField,
  EmailField,
  FileUploadField,
  FriendsSelectorField,
  ImageGalleryField,
  MarkdownField,
  NewsReferenceField,
  NumberField,
  OrderSelectorField,
  PhoneField,
  PlayerSelectorField,
  ProductSelectorField,
  PunishmentReferenceField,
  RadioField,
  RankSelectorField,
  RatingField,
  ReportReferenceField,
  SchedulePickerField,
  SelectField,
  ServerSelectorField,
  SignatureField,
  StatsDisplayField,
  TextField,
  TextareaField,
  TimeField,
  TopicReferenceField,
  UrlField,
  VideoUrlField,
} from './fields';
import type { FieldValue } from './types';

interface Props {
  field: FormFieldDto;
  slug: string;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
  disabled?: boolean;
}

export function FieldRenderer({ field, slug, value, onChange, disabled }: Props) {
  switch (field.type) {
    case FormFieldType.TEXT:
      return <TextField field={field} value={value} onChange={onChange} disabled={disabled} />;
    case FormFieldType.TEXTAREA:
      return <TextareaField field={field} value={value} onChange={onChange} disabled={disabled} />;
    case FormFieldType.RADIO:
      return <RadioField field={field} value={value} onChange={onChange} disabled={disabled} />;
    case FormFieldType.CHECKBOX:
      return <CheckboxField field={field} value={value} onChange={onChange} disabled={disabled} />;
    case FormFieldType.SELECT:
      return <SelectField field={field} value={value} onChange={onChange} disabled={disabled} />;
    case FormFieldType.NUMBER:
      return <NumberField field={field} value={value} onChange={onChange} disabled={disabled} />;
    case FormFieldType.DATE:
      return <DateField field={field} value={value} onChange={onChange} disabled={disabled} />;
    case FormFieldType.TIME:
      return <TimeField field={field} value={value} onChange={onChange} disabled={disabled} />;
    case FormFieldType.EMAIL:
      return <EmailField field={field} value={value} onChange={onChange} disabled={disabled} />;
    case FormFieldType.PHONE:
      return <PhoneField field={field} value={value} onChange={onChange} disabled={disabled} />;
    case FormFieldType.URL:
      return <UrlField field={field} value={value} onChange={onChange} disabled={disabled} />;
    case FormFieldType.FILE_UPLOAD:
      return (
        <FileUploadField
          field={field}
          slug={slug}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case FormFieldType.RATING:
      return <RatingField field={field} value={value} onChange={onChange} disabled={disabled} />;
    case FormFieldType.MARKDOWN_EDITOR:
      return <MarkdownField field={field} value={value} onChange={onChange} disabled={disabled} />;
    case FormFieldType.COLOR_PICKER:
      return (
        <ColorPickerField field={field} value={value} onChange={onChange} disabled={disabled} />
      );
    case FormFieldType.CODE_EDITOR:
      return (
        <CodeEditorField field={field} value={value} onChange={onChange} disabled={disabled} />
      );
    case FormFieldType.SIGNATURE:
      return (
        <SignatureField field={field} value={value} onChange={onChange} disabled={disabled} />
      );
    case FormFieldType.DATE_RANGE:
      return (
        <DateRangeField field={field} value={value} onChange={onChange} disabled={disabled} />
      );
    case FormFieldType.CURRENCY_AMOUNT:
      return (
        <CurrencyAmountField field={field} value={value} onChange={onChange} disabled={disabled} />
      );
    case FormFieldType.VIDEO_URL:
      return (
        <VideoUrlField field={field} value={value} onChange={onChange} disabled={disabled} />
      );
    case FormFieldType.IMAGE_GALLERY:
      return (
        <ImageGalleryField
          field={field}
          slug={slug}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case FormFieldType.SCHEDULE_PICKER:
      return (
        <SchedulePickerField field={field} value={value} onChange={onChange} disabled={disabled} />
      );
    case FormFieldType.AGREEMENT_CHECKLIST:
      return (
        <AgreementChecklistField
          field={field}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case FormFieldType.PLAYER_SELECTOR:
      return (
        <PlayerSelectorField field={field} value={value} onChange={onChange} disabled={disabled} />
      );
    case FormFieldType.SERVER_SELECTOR:
      return (
        <ServerSelectorField field={field} value={value} onChange={onChange} disabled={disabled} />
      );
    case FormFieldType.RANK_SELECTOR:
      return (
        <RankSelectorField field={field} value={value} onChange={onChange} disabled={disabled} />
      );
    case FormFieldType.FRIENDS_SELECTOR:
      return (
        <FriendsSelectorField
          field={field}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case FormFieldType.PRODUCT_SELECTOR:
      return (
        <ProductSelectorField
          field={field}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case FormFieldType.ORDER_SELECTOR:
      return (
        <OrderSelectorField field={field} value={value} onChange={onChange} disabled={disabled} />
      );
    case FormFieldType.REPORT_REFERENCE:
      return (
        <ReportReferenceField
          field={field}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case FormFieldType.NEWS_REFERENCE:
      return (
        <NewsReferenceField field={field} value={value} onChange={onChange} disabled={disabled} />
      );
    case FormFieldType.TOPIC_REFERENCE:
      return (
        <TopicReferenceField
          field={field}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case FormFieldType.PUNISHMENT_REFERENCE:
      return (
        <PunishmentReferenceField
          field={field}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case FormFieldType.ACHIEVEMENT_SELECTOR:
      return (
        <AchievementSelectorField
          field={field}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case FormFieldType.STATS_DISPLAY:
      return <StatsDisplayField field={field} />;
    default:
      return (
        <div className="rounded-md border border-white/10 p-3 text-xs text-muted-foreground">
          Тип поля {field.type} пока не поддерживается
        </div>
      );
  }
}
