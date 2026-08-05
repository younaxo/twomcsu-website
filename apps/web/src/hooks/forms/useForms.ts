'use client';

import type {
  FormAutofill,
  FormDetail,
  FormFieldDto,
  FormResponseDetail,
  FormResponseSummary,
  FormStats,
  FormStatus,
  FormSummary,
  FormVisibility,
} from '@twomc/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

// Answer payload sent to server for a single field
export interface FormAnswerPayload {
  fieldId: string;
  textValue?: string | null;
  numberValue?: number | null;
  booleanValue?: boolean | null;
  dateValue?: string | null;
  jsonValue?: unknown;
  fileUrls?: string[];
}

export interface FormFieldInput extends Omit<Partial<FormFieldDto>, 'id' | 'type' | 'label'> {
  id?: string;
  type: FormFieldDto['type'];
  label: string;
  order?: number;
}

export interface FormPayload {
  title: string;
  slug?: string;
  description?: string | null;
  coverImage?: string | null;
  visibility?: FormVisibility;
  onePerUser?: boolean;
  isAnonymous?: boolean;
  showResults?: boolean;
  requiresAuth?: boolean;
  requiresCaptcha?: boolean;
  opensAt?: string | null;
  closesAt?: string | null;
  timeLimit?: number | null;
  maxResponses?: number | null;
  multiStep?: boolean;
  stepsConfig?: unknown;
  thankYouMessage?: string | null;
  redirectUrl?: string | null;
  customCss?: string | null;
  status?: FormStatus;
  fields?: FormFieldInput[];
}

export interface AdminFormsFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: FormStatus;
  visibility?: FormVisibility;
}

export interface AdminResponsesFilters {
  page?: number;
  limit?: number;
  completeOnly?: boolean;
  from?: string;
  to?: string;
}

export interface FormInviteView {
  id: string;
  code: string;
  formId: string;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  createdBy: string;
  createdAt: string;
}

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const invalidateForms = (qc: ReturnType<typeof useQueryClient>) => {
  void qc.invalidateQueries({ queryKey: ['forms'] });
  void qc.invalidateQueries({ queryKey: ['admin', 'forms'] });
};

/** Public list of published forms visible to the current viewer */
export function useForms(enabled = true) {
  return useQuery({
    queryKey: queryKeys.forms,
    queryFn: async () => {
      const { data } = await api.get<FormSummary[]>('/forms', { skipAuthRedirect: true });
      return data;
    },
    enabled,
  });
}

export function useForm(slug: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.form(slug),
    queryFn: async () => {
      const { data } = await api.get<FormDetail>(`/forms/${slug}`, {
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled: enabled && Boolean(slug),
  });
}

export function useFormInvite(code: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.formInvite(code),
    queryFn: async () => {
      const { data } = await api.get<FormDetail>(`/forms/invite/${code}`, {
        skipAuthRedirect: true,
      });
      return data;
    },
    enabled: enabled && Boolean(code),
  });
}

export function useSubmitForm(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      answers: FormAnswerPayload[];
      captchaToken?: string;
      inviteCode?: string;
    }) => {
      const { data } = await api.post<{ id: string }>(
        `/forms/${slug}/responses`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.form(slug) });
      void qc.invalidateQueries({ queryKey: queryKeys.myFormResponses });
      void qc.invalidateQueries({ queryKey: queryKeys.forms });
    },
  });
}

export function useSaveDraft(slug: string) {
  return useMutation({
    mutationFn: async (payload: { answers: FormAnswerPayload[]; currentStep?: number }) => {
      const { data } = await api.post<{ id: string }>(
        `/forms/${slug}/responses/save-draft`,
        payload,
      );
      return data;
    },
  });
}

/** Multipart file upload for a form response */
export function useUploadFormFile(slug: string) {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post<{
        url: string;
        fileName: string;
        size: number;
        mimeType: string;
      }>(`/forms/${slug}/responses/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
  });
}

export function useMyForms(enabled = true) {
  return useQuery({
    queryKey: queryKeys.myForms,
    queryFn: async () => {
      const { data } = await api.get<FormSummary[]>('/forms/my');
      return data;
    },
    enabled,
  });
}

export function useMyFormResponses(enabled = true) {
  return useQuery({
    queryKey: queryKeys.myFormResponses,
    queryFn: async () => {
      const { data } = await api.get<FormResponseSummary[]>('/forms/my/responses');
      return data;
    },
    enabled,
  });
}

export function useAutofill(enabled = true) {
  return useQuery({
    queryKey: queryKeys.formAutofill,
    queryFn: async () => {
      const { data } = await api.get<FormAutofill>('/forms/autofill');
      return data;
    },
    enabled,
    staleTime: 60_000,
  });
}

// Admin API

export function useAdminForms(filters: AdminFormsFilters = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminForms(filters as Record<string, unknown>),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResult<FormSummary>>('/admin/forms', {
        params: filters,
      });
      return data;
    },
    enabled,
  });
}

export function useAdminForm(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminForm(id),
    queryFn: async () => {
      const { data } = await api.get<FormDetail>(`/admin/forms/${id}`);
      return data;
    },
    enabled: enabled && Boolean(id),
  });
}

export function useFormTemplates(enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminFormTemplates,
    queryFn: async () => {
      const { data } = await api.get<FormSummary[]>('/admin/forms/templates');
      return data;
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useCreateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FormPayload) => {
      const { data } = await api.post<FormDetail>('/admin/forms', payload);
      return data;
    },
    onSuccess: () => invalidateForms(qc),
  });
}

export function useUpdateForm(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FormPayload) => {
      const { data } = await api.patch<FormDetail>(`/admin/forms/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      invalidateForms(qc);
      void qc.invalidateQueries({ queryKey: queryKeys.adminForm(id) });
    },
  });
}

export function useDeleteForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/forms/${id}`);
      return id;
    },
    onSuccess: () => invalidateForms(qc),
  });
}

export function usePublishForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<FormDetail>(`/admin/forms/${id}/publish`);
      return data;
    },
    onSuccess: (data) => {
      invalidateForms(qc);
      void qc.invalidateQueries({ queryKey: queryKeys.adminForm(data.id) });
    },
  });
}

export function useCloseForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<FormDetail>(`/admin/forms/${id}/close`);
      return data;
    },
    onSuccess: (data) => {
      invalidateForms(qc);
      void qc.invalidateQueries({ queryKey: queryKeys.adminForm(data.id) });
    },
  });
}

export function useDuplicateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<FormDetail>(`/admin/forms/${id}/duplicate`);
      return data;
    },
    onSuccess: () => invalidateForms(qc),
  });
}

export function useCreateFromTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      slug,
      overrides,
    }: {
      slug: string;
      overrides?: Record<string, unknown>;
    }) => {
      const { data } = await api.post<FormDetail>(`/admin/forms/from-template/${slug}`, {
        overrides: overrides ?? {},
      });
      return data;
    },
    onSuccess: () => invalidateForms(qc),
  });
}

export function useFormResponses(
  id: string,
  filters: AdminResponsesFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.adminFormResponses(id, filters as Record<string, unknown>),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResult<FormResponseSummary>>(
        `/admin/forms/${id}/responses`,
        { params: filters },
      );
      return data;
    },
    enabled: enabled && Boolean(id),
  });
}

export function useFormResponse(id: string, responseId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminFormResponse(id, responseId),
    queryFn: async () => {
      const { data } = await api.get<FormResponseDetail>(
        `/admin/forms/${id}/responses/${responseId}`,
      );
      return data;
    },
    enabled: enabled && Boolean(id) && Boolean(responseId),
  });
}

export function useDeleteResponse(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (responseId: string) => {
      await api.delete(`/admin/forms/${id}/responses/${responseId}`);
      return responseId;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'forms', 'responses', id] });
      void qc.invalidateQueries({ queryKey: queryKeys.adminFormStats(id) });
    },
  });
}

export function useFormStats(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminFormStats(id),
    queryFn: async () => {
      const { data } = await api.get<FormStats>(`/admin/forms/${id}/stats`);
      return data;
    },
    enabled: enabled && Boolean(id),
  });
}

export type FormExportFormat = 'csv' | 'excel' | 'pdf';

export function useExportForm(id: string) {
  return useMutation({
    mutationFn: async (payload: {
      format: FormExportFormat;
      from?: string;
      to?: string;
      completeOnly?: boolean;
    }) => {
      const response = await api.post(`/admin/forms/${id}/export`, payload, {
        responseType: 'blob',
      });
      // Try to pull filename from Content-Disposition
      const disposition = response.headers['content-disposition'] as string | undefined;
      const match = disposition?.match(/filename="?([^";]+)"?/i);
      const filename =
        match && match[1] ? decodeURIComponent(match[1]) : `export.${payload.format}`;
      return { blob: response.data as Blob, filename };
    },
  });
}

// Invites

export function useFormInvites(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminFormInvites(id),
    queryFn: async () => {
      const { data } = await api.get<FormInviteView[]>(`/admin/forms/${id}/invites`);
      return data;
    },
    enabled: enabled && Boolean(id),
  });
}

export function useCreateInvite(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { maxUses?: number | null; expiresAt?: string | null }) => {
      const { data } = await api.post<FormInviteView>(`/admin/forms/${id}/invites`, payload);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.adminFormInvites(id) });
    },
  });
}

export function useDeleteInvite(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      await api.delete(`/admin/forms/${id}/invites/${code}`);
      return code;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.adminFormInvites(id) });
    },
  });
}
