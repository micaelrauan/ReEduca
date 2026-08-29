'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { CATEGORIES, CONDITIONS, DEALS, STATUSES } from '@/lib/reeduca';
import { cn } from '@/lib/utils';
import { PhotoUploader } from './PhotoUploader';
import { uploadListingPhoto, deleteListingPhotoByPath } from '@/lib/storage';

const field =
	'w-full rounded-xl border border-border bg-card px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring';
const labelCls = 'flex flex-col gap-2 text-sm font-semibold';

type ListingFormInitial = Partial<{
	title: string;
	category: string;
	description: string | null;
	condition: string;
	deal: string;
	price: number | null;
	wanted: string | null;
	region: string | null;
	status: string;
}> & { photoUrls?: string[] };

type ListingFormProps = {
	mode: 'create' | 'edit';
	listingId?: string;
	initial?: ListingFormInitial;
};

type FormState = {
	title: string;
	category: string;
	description: string;
	condition: string;
	deal: string;
	price: string;
	wanted: string;
	region: string;
	status: string;
};

export function ListingForm({ mode, listingId, initial }: ListingFormProps) {
	const router = useRouter();
	const [form, setForm] = useState<FormState>({
		title: initial?.title ?? '',
		category: initial?.category ?? 'livros',
		description: initial?.description ?? '',
		condition: initial?.condition ?? 'seminovo',
		deal: initial?.deal ?? 'venda',
		price: initial?.price != null ? String(initial.price) : '',
		wanted: initial?.wanted ?? '',
		region: initial?.region ?? '',
		status: initial?.status ?? 'ativo',
	});
	const [existingUrls, setExistingUrls] = useState<string[]>(initial?.photoUrls ?? []);
	const [removedUrls, setRemovedUrls] = useState<string[]>([]);
	const [newFiles, setNewFiles] = useState<File[]>([]);
	const [saving, setSaving] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState('');

	const set = (key: keyof FormState, value: string) => setForm((f) => ({ ...f, [key]: value }));

	const handleFilesChange = useCallback((files: File[]) => {
		setNewFiles(files);
	}, []);

	const handleUrlsRemoved = useCallback((urls: string[]) => {
		setRemovedUrls(urls);
	}, []);

	const uploadPhotos = async (id: string): Promise<string[]> => {
		const urls: string[] = [...existingUrls];

		for (let i = 0; i < newFiles.length; i++) {
			const url = await uploadListingPhoto(id, newFiles[i], urls.length);
			urls.push(url);
		}

		return urls;
	};

	const deleteRemovedPhotos = async () => {
		for (const url of removedUrls) {
			try {
				const path = url.split('/').slice(-2).join('/');
				await deleteListingPhotoByPath(path);
			} catch {
				// Silently fail - orphaned files will be cleaned up later
			}
		}
	};

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setSaving(true);
		setUploading(false);
		try {
			const payload = {
				title: form.title,
				category: form.category,
				description: form.description,
				condition: form.condition,
				deal: form.deal,
				region: form.region,
				status: mode === 'edit' ? form.status : undefined,
				price:
					form.deal === 'venda' && form.price ? Number(form.price.replace(',', '.')) : null,
				wanted: form.deal === 'troca' ? form.wanted : '',
				photoUrls: existingUrls,
			};

			const res = await fetch(
				mode === 'edit' ? `/api/listings/${listingId}` : '/api/listings',
				{
					method: mode === 'edit' ? 'PATCH' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
				},
			);
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				setError(data?.error || 'Não foi possível salvar o anúncio.');
				return;
			}

			const id = data.id as string;

			if (newFiles.length > 0) {
				setUploading(true);
				try {
					const allUrls = await uploadPhotos(id);
					await fetch(`/api/listings/${id}`, {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ photoUrls: allUrls }),
					});
				} catch {
					setError('Anúncio salvo, mas houve erro ao enviar as fotos. Você pode editá-lo depois.');
					router.push(`/anuncio/${id}`);
					return;
				}
			}

			if (removedUrls.length > 0) {
				await deleteRemovedPhotos();
			}

			router.push(`/anuncio/${id}`);
		} catch {
			setError('Não foi possível salvar o anúncio.');
		} finally {
			setSaving(false);
			setUploading(false);
		}
	};

	const isBusy = saving || uploading;

	return (
		<form onSubmit={submit} className="mx-auto w-full max-w-2xl space-y-5 px-4 py-6">
			<div>
				<h1 className="font-display text-2xl font-extrabold">
					{mode === 'edit' ? 'Editar anúncio' : 'Criar anúncio'}
				</h1>
				<p className="text-sm text-muted-foreground">
					Capriche nas fotos e seja sincero no estado do material.
				</p>
			</div>

			{error && (
				<p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
					{error}
				</p>
			)}

			<label className={labelCls}>
				Título
				<input
					required
					maxLength={120}
					className={field}
					value={form.title}
					onChange={(e) => set('title', e.target.value)}
					placeholder="Ex: Livro de biologia do 1º ano"
				/>
			</label>

			<label className={labelCls}>
				Categoria
				<select
					className={field}
					value={form.category}
					onChange={(e) => set('category', e.target.value)}
				>
					{CATEGORIES.map((c) => (
						<option key={c.value} value={c.value}>
							{c.label}
						</option>
					))}
				</select>
			</label>

			<label className={labelCls}>
				Descrição
				<textarea
					rows={4}
					className={field}
					value={form.description}
					onChange={(e) => set('description', e.target.value)}
					placeholder="Conte o estado, se tem marcações, como combinar a entrega..."
				/>
			</label>

			<PhotoUploader
				existingUrls={existingUrls}
				onUrlsChange={setExistingUrls}
				removedUrls={removedUrls}
				onUrlsRemoved={handleUrlsRemoved}
				newFiles={newFiles}
				onFilesChange={handleFilesChange}
				disabled={isBusy}
			/>

			<div className="space-y-2">
				<p className="text-sm font-semibold">Tipo de negociação</p>
				<div className="flex flex-wrap gap-2">
					{DEALS.map((d) => (
						<button
							key={d.value}
							type="button"
							onClick={() => set('deal', d.value)}
							className={cn(
								'min-h-[44px] rounded-full border px-4 text-sm font-bold',
								form.deal === d.value
									? `${d.className} border-transparent`
									: 'border-border text-muted-foreground',
							)}
						>
							{d.label}
						</button>
					))}
				</div>
			</div>

			{form.deal === 'venda' && (
				<label className={labelCls}>
					Preço (R$)
					<input
						type="number"
						min="0"
						step="0.01"
						className={field}
						value={form.price}
						onChange={(e) => set('price', e.target.value)}
					/>
				</label>
			)}

			{form.deal === 'troca' && (
				<label className={labelCls}>
					O que você quer em troca
					<input
						className={field}
						value={form.wanted}
						onChange={(e) => set('wanted', e.target.value)}
						placeholder="Ex: apostila de química"
					/>
				</label>
			)}

			<label className={labelCls}>
				Estado de conservação
				<select
					className={field}
					value={form.condition}
					onChange={(e) => set('condition', e.target.value)}
				>
					{CONDITIONS.map((c) => (
						<option key={c.value} value={c.value}>
							{c.label}
						</option>
					))}
				</select>
			</label>

			<label className={labelCls}>
				Região
				<input
					className={field}
					value={form.region}
					onChange={(e) => set('region', e.target.value)}
					placeholder="Cidade - bairro"
				/>
			</label>

			{mode === 'edit' && (
				<label className={labelCls}>
					Situação
					<select
						className={field}
						value={form.status}
						onChange={(e) => set('status', e.target.value)}
					>
						{STATUSES.map((s) => (
							<option key={s.value} value={s.value}>
								{s.label}
							</option>
						))}
					</select>
				</label>
			)}

			<button
				type="submit"
				disabled={isBusy}
				className="min-h-[48px] w-full rounded-full bg-primary px-5 font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
			>
				{uploading
					? 'Enviando fotos...'
					: saving
						? 'Salvando...'
						: mode === 'edit'
							? 'Salvar alterações'
							: 'Publicar anúncio'}
			</button>
		</form>
	);
}
