import { redirect } from 'next/navigation'

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>
}) {
  const params = searchParams ? await searchParams : {}
  if (params.tab === 'tickets') {
    redirect('/admin/tickets')
  }
  if (params.tab === 'clubes') {
    redirect('/admin/clubes')
  }
  redirect('/admin/usuarios')
}
