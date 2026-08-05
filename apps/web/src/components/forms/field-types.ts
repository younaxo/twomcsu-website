import {
  Type as TypeIcon,
  AlignLeft,
  CircleDot,
  CheckSquare,
  ChevronsUpDown,
  Hash,
  Calendar,
  Clock,
  Mail,
  Phone,
  Link as LinkIcon,
  Upload,
  Star,
  Palette,
  Code2,
  FileText,
  Images,
  Video,
  CalendarClock,
  ListChecks,
  Users,
  Server,
  Shield,
  UserPlus,
  Package,
  ShoppingCart,
  AlertTriangle,
  Newspaper,
  MessagesSquare,
  Gavel,
  PenLine,
  CalendarRange,
  Coins,
  BarChart3,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { FormFieldType } from '@twomc/shared';

export interface FieldTypeMeta {
  type: FormFieldType;
  labelRu: string;
  description: string;
  icon: LucideIcon;
  category: 'standard' | 'advanced' | 'twomc' | 'media' | 'special';
}

export const FIELD_CATEGORIES: Array<{ key: FieldTypeMeta['category']; labelRu: string }> = [
  { key: 'standard', labelRu: 'Стандартные' },
  { key: 'advanced', labelRu: 'Расширенные' },
  { key: 'twomc', labelRu: 'TWOMC' },
  { key: 'media', labelRu: 'Мультимедиа' },
  { key: 'special', labelRu: 'Специальные' },
];

export const FIELD_TYPE_META: Record<FormFieldType, FieldTypeMeta> = {
  [FormFieldType.TEXT]: {
    type: FormFieldType.TEXT,
    labelRu: 'Текст',
    description: 'Однострочное текстовое поле',
    icon: TypeIcon,
    category: 'standard',
  },
  [FormFieldType.TEXTAREA]: {
    type: FormFieldType.TEXTAREA,
    labelRu: 'Многострочный текст',
    description: 'Большое текстовое поле',
    icon: AlignLeft,
    category: 'standard',
  },
  [FormFieldType.RADIO]: {
    type: FormFieldType.RADIO,
    labelRu: 'Один вариант',
    description: 'Выбор одного из нескольких',
    icon: CircleDot,
    category: 'standard',
  },
  [FormFieldType.CHECKBOX]: {
    type: FormFieldType.CHECKBOX,
    labelRu: 'Несколько вариантов',
    description: 'Множественный выбор',
    icon: CheckSquare,
    category: 'standard',
  },
  [FormFieldType.SELECT]: {
    type: FormFieldType.SELECT,
    labelRu: 'Выпадающий список',
    description: 'Компактный выбор варианта',
    icon: ChevronsUpDown,
    category: 'standard',
  },
  [FormFieldType.NUMBER]: {
    type: FormFieldType.NUMBER,
    labelRu: 'Число',
    description: 'Ввод чисел',
    icon: Hash,
    category: 'standard',
  },
  [FormFieldType.DATE]: {
    type: FormFieldType.DATE,
    labelRu: 'Дата',
    description: 'Выбор даты',
    icon: Calendar,
    category: 'standard',
  },
  [FormFieldType.TIME]: {
    type: FormFieldType.TIME,
    labelRu: 'Время',
    description: 'Выбор времени',
    icon: Clock,
    category: 'standard',
  },
  [FormFieldType.EMAIL]: {
    type: FormFieldType.EMAIL,
    labelRu: 'Email',
    description: 'Email с валидацией',
    icon: Mail,
    category: 'standard',
  },
  [FormFieldType.PHONE]: {
    type: FormFieldType.PHONE,
    labelRu: 'Телефон',
    description: 'Телефон с маской',
    icon: Phone,
    category: 'standard',
  },
  [FormFieldType.URL]: {
    type: FormFieldType.URL,
    labelRu: 'Ссылка',
    description: 'URL с валидацией',
    icon: LinkIcon,
    category: 'standard',
  },
  [FormFieldType.FILE_UPLOAD]: {
    type: FormFieldType.FILE_UPLOAD,
    labelRu: 'Файл',
    description: 'Загрузка одного или нескольких файлов',
    icon: Upload,
    category: 'media',
  },
  [FormFieldType.RATING]: {
    type: FormFieldType.RATING,
    labelRu: 'Рейтинг',
    description: 'Оценка звёздами',
    icon: Star,
    category: 'advanced',
  },
  [FormFieldType.COLOR_PICKER]: {
    type: FormFieldType.COLOR_PICKER,
    labelRu: 'Цвет',
    description: 'Выбор цвета',
    icon: Palette,
    category: 'advanced',
  },
  [FormFieldType.CODE_EDITOR]: {
    type: FormFieldType.CODE_EDITOR,
    labelRu: 'Код',
    description: 'Многострочный код',
    icon: Code2,
    category: 'advanced',
  },
  [FormFieldType.MARKDOWN_EDITOR]: {
    type: FormFieldType.MARKDOWN_EDITOR,
    labelRu: 'Markdown',
    description: 'Markdown редактор',
    icon: FileText,
    category: 'advanced',
  },
  [FormFieldType.IMAGE_GALLERY]: {
    type: FormFieldType.IMAGE_GALLERY,
    labelRu: 'Галерея изображений',
    description: 'Несколько изображений',
    icon: Images,
    category: 'media',
  },
  [FormFieldType.VIDEO_URL]: {
    type: FormFieldType.VIDEO_URL,
    labelRu: 'Видео',
    description: 'Ссылка на видео',
    icon: Video,
    category: 'media',
  },
  [FormFieldType.SCHEDULE_PICKER]: {
    type: FormFieldType.SCHEDULE_PICKER,
    labelRu: 'Расписание',
    description: 'Сетка дней и часов',
    icon: CalendarClock,
    category: 'special',
  },
  [FormFieldType.AGREEMENT_CHECKLIST]: {
    type: FormFieldType.AGREEMENT_CHECKLIST,
    labelRu: 'Список согласий',
    description: 'Обязательные пункты для отметки',
    icon: ListChecks,
    category: 'special',
  },
  [FormFieldType.PLAYER_SELECTOR]: {
    type: FormFieldType.PLAYER_SELECTOR,
    labelRu: 'Игроки',
    description: 'Выбор игроков TWOMC',
    icon: Users,
    category: 'twomc',
  },
  [FormFieldType.SERVER_SELECTOR]: {
    type: FormFieldType.SERVER_SELECTOR,
    labelRu: 'Сервер',
    description: 'Выбор игрового сервера',
    icon: Server,
    category: 'twomc',
  },
  [FormFieldType.RANK_SELECTOR]: {
    type: FormFieldType.RANK_SELECTOR,
    labelRu: 'Ранг',
    description: 'Выбор ранга',
    icon: Shield,
    category: 'twomc',
  },
  [FormFieldType.FRIENDS_SELECTOR]: {
    type: FormFieldType.FRIENDS_SELECTOR,
    labelRu: 'Друзья',
    description: 'Выбор из друзей',
    icon: UserPlus,
    category: 'twomc',
  },
  [FormFieldType.PRODUCT_SELECTOR]: {
    type: FormFieldType.PRODUCT_SELECTOR,
    labelRu: 'Товар',
    description: 'Выбор товара из магазина',
    icon: Package,
    category: 'twomc',
  },
  [FormFieldType.ORDER_SELECTOR]: {
    type: FormFieldType.ORDER_SELECTOR,
    labelRu: 'Заказ',
    description: 'Выбор одного из ваших заказов',
    icon: ShoppingCart,
    category: 'twomc',
  },
  [FormFieldType.REPORT_REFERENCE]: {
    type: FormFieldType.REPORT_REFERENCE,
    labelRu: 'Обращение',
    description: 'Ссылка на обращение',
    icon: AlertTriangle,
    category: 'twomc',
  },
  [FormFieldType.NEWS_REFERENCE]: {
    type: FormFieldType.NEWS_REFERENCE,
    labelRu: 'Новость',
    description: 'Ссылка на новость',
    icon: Newspaper,
    category: 'twomc',
  },
  [FormFieldType.TOPIC_REFERENCE]: {
    type: FormFieldType.TOPIC_REFERENCE,
    labelRu: 'Тема',
    description: 'Ссылка на тему',
    icon: MessagesSquare,
    category: 'twomc',
  },
  [FormFieldType.PUNISHMENT_REFERENCE]: {
    type: FormFieldType.PUNISHMENT_REFERENCE,
    labelRu: 'Наказание',
    description: 'Ссылка на наказание',
    icon: Gavel,
    category: 'twomc',
  },
  [FormFieldType.SIGNATURE]: {
    type: FormFieldType.SIGNATURE,
    labelRu: 'Подпись',
    description: 'Ручная подпись на холсте',
    icon: PenLine,
    category: 'special',
  },
  [FormFieldType.DATE_RANGE]: {
    type: FormFieldType.DATE_RANGE,
    labelRu: 'Период дат',
    description: 'От и до',
    icon: CalendarRange,
    category: 'advanced',
  },
  [FormFieldType.CURRENCY_AMOUNT]: {
    type: FormFieldType.CURRENCY_AMOUNT,
    labelRu: 'Сумма',
    description: 'Валютное значение',
    icon: Coins,
    category: 'advanced',
  },
  [FormFieldType.STATS_DISPLAY]: {
    type: FormFieldType.STATS_DISPLAY,
    labelRu: 'Статистика игрока',
    description: 'Показ данных без ввода',
    icon: BarChart3,
    category: 'twomc',
  },
  [FormFieldType.ACHIEVEMENT_SELECTOR]: {
    type: FormFieldType.ACHIEVEMENT_SELECTOR,
    labelRu: 'Достижение',
    description: 'Выбор достижения',
    icon: Trophy,
    category: 'twomc',
  },
};

export const ALL_FIELD_TYPES = Object.values(FormFieldType) as FormFieldType[];

export function fieldTypeMeta(type: FormFieldType): FieldTypeMeta {
  return FIELD_TYPE_META[type];
}

// Extract choices from FormField.options for RADIO/CHECKBOX/SELECT/AGREEMENT
export function extractChoices(options: unknown): string[] {
  if (!options) return [];
  if (Array.isArray(options)) {
    return options.filter((v): v is string => typeof v === 'string');
  }
  if (typeof options === 'object' && options !== null) {
    const obj = options as Record<string, unknown>;
    for (const key of ['choices', 'items', 'options']) {
      const value = obj[key];
      if (Array.isArray(value)) {
        return value.filter((v): v is string => typeof v === 'string');
      }
    }
  }
  return [];
}
