'use server'

import { revalidatePath } from 'next/cache'
import { requirePlatformAdmin } from '@/lib/admin-guard'
import type { AdminActionState } from '@/lib/admin-types'
import {
  validateMembershipFields,
  validateTenantFields,
  validateUserFields,
} from '@/lib/admin-validation'
import {
  addMembership,
  ApiValidationError,
  createTenant,
  createUser,
  removeMembership,
} from '@/lib/api/admin'

const INVALID_FORM_MESSAGE = 'Revisá los campos marcados.'

function getFormValue(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === 'string' ? value.trim() : ''
}

function getRawFormValue(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

function validationState(errors: Record<string, string[]>): AdminActionState {
  return { ok: false, message: INVALID_FORM_MESSAGE, errors }
}

function apiValidationState(error: ApiValidationError): AdminActionState {
  return { ok: false, message: error.message, errors: error.errors }
}

export async function createUserAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requirePlatformAdmin()

  const fields = {
    name: getFormValue(formData, 'name'),
    email: getFormValue(formData, 'email'),
    password: getFormValue(formData, 'password'),
  }
  const errors = validateUserFields(fields)
  if (Object.keys(errors).length > 0) return validationState(errors)

  try {
    await createUser(fields)
    revalidatePath('/admin')
    return { ok: true, message: 'Usuario creado.' }
  } catch (error) {
    if (error instanceof ApiValidationError) return apiValidationState(error)
    throw error
  }
}

export async function createTenantAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requirePlatformAdmin()

  const fields = {
    name: getFormValue(formData, 'name'),
    slug: getRawFormValue(formData, 'slug'),
    admin_user_id: getRawFormValue(formData, 'admin_user_id'),
  }
  const errors = validateTenantFields(fields)
  if (Object.keys(errors).length > 0) return validationState(errors)

  try {
    await createTenant({
      name: fields.name,
      slug: fields.slug,
      admin_user_id: fields.admin_user_id || undefined,
    })
    revalidatePath('/admin')
    return { ok: true, message: 'Club creado.' }
  } catch (error) {
    if (error instanceof ApiValidationError) return apiValidationState(error)
    throw error
  }
}

export async function addMembershipAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requirePlatformAdmin()

  const fields = {
    user_id: getRawFormValue(formData, 'user_id'),
    tenant_slug: getRawFormValue(formData, 'tenant_slug'),
  }
  const errors = validateMembershipFields(fields)
  if (Object.keys(errors).length > 0) return validationState(errors)

  try {
    await addMembership(fields)
    revalidatePath('/admin')
    return { ok: true, message: 'Asociación creada.' }
  } catch (error) {
    if (error instanceof ApiValidationError) return apiValidationState(error)
    throw error
  }
}

export async function removeMembershipAction(formData: FormData): Promise<void> {
  await requirePlatformAdmin()

  await removeMembership(getFormValue(formData, 'membership_id'))
  revalidatePath('/admin')
}
